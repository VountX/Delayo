import { DelayedTab, RecurrencePattern } from '@types';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({ delayedTabs: [] });

    chrome.contextMenus.create({
      id: 'delay-tab',
      title: 'Delay this tab',
      contexts: ['page'],
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'delay-tab' && tab?.id) {
    chrome.action.openPopup();
  }
});

function calculateNextWakeTime(
  recurrencePattern: RecurrencePattern
): number | null {
  const now = new Date();
  const [hours, minutes] = recurrencePattern.time.split(':').map(Number);

  if (recurrencePattern.endDate && now.getTime() >= recurrencePattern.endDate) {
    return null;
  }

  const nextWakeTime = new Date();
  nextWakeTime.setHours(hours, minutes, 0, 0);

  switch (recurrencePattern.type) {
    case 'daily':
      if (nextWakeTime.getTime() <= now.getTime()) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 1);
      }
      break;

    case 'weekdays': {
      nextWakeTime.setDate(nextWakeTime.getDate() + 1);
      while (nextWakeTime.getDay() === 0 || nextWakeTime.getDay() === 6) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 1);
      }
      break;
    }

    case 'weekly':
    case 'custom': {
      if (
        !recurrencePattern.daysOfWeek ||
        recurrencePattern.daysOfWeek.length === 0
      ) {
        return null;
      }

      const currentDay = now.getDay();
      const sortedDays = [...recurrencePattern.daysOfWeek].sort(
        (a, b) => a - b
      );

      const nextDayIndex = sortedDays.findIndex((day) => day > currentDay);

      if (nextDayIndex !== -1) {
        const daysToAdd = sortedDays[nextDayIndex] - currentDay;
        nextWakeTime.setDate(now.getDate() + daysToAdd);
      } else {
        const daysToAdd = 7 - currentDay + sortedDays[0];
        nextWakeTime.setDate(now.getDate() + daysToAdd);
      }

      if (
        nextWakeTime.getDay() === currentDay &&
        nextWakeTime.getTime() <= now.getTime()
      ) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 7);
      }
      break;
    }

    case 'monthly': {
      nextWakeTime.setDate(recurrencePattern.dayOfMonth || 1);

      if (nextWakeTime.getTime() <= now.getTime()) {
        nextWakeTime.setMonth(nextWakeTime.getMonth() + 1);
      }
      break;
    }

    default:
      // Default case
      return null;
  }

  return nextWakeTime.getTime();
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('delayed-tab-')) {
    try {
      const tabId = parseInt(alarm.name.replace('delayed-tab-', ''), 10);

      const { delayedTabs = [] } =
        await chrome.storage.local.get('delayedTabs');

      const delayedTab = delayedTabs.find(
        (tab: DelayedTab) => tab.id === tabId
      );

      if (delayedTab && delayedTab.url) {
        await chrome.tabs.create({ url: delayedTab.url });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: delayedTab.favicon || 'icons/icon128.png',
          title: 'Tab Awakened!',
          message: `Your ${delayedTab.isRecurring ? 'recurring' : 'delayed'} tab "${delayedTab.title}" is now open.`,
        });

        if (delayedTab.isRecurring && delayedTab.recurrencePattern) {
          const nextWakeTime = calculateNextWakeTime(
            delayedTab.recurrencePattern
          );

          if (nextWakeTime) {
            const updatedTab = {
              ...delayedTab,
              wakeTime: nextWakeTime,
            };

            const newTabId = Date.now(); 
            updatedTab.id = newTabId;

            const updatedTabs = delayedTabs.filter(
              (tab: DelayedTab) => tab.id !== tabId
            );
            updatedTabs.push(updatedTab);

            await chrome.storage.local.set({ delayedTabs: updatedTabs });

            await chrome.alarms.create(`delayed-tab-${newTabId}`, {
              when: nextWakeTime,
            });

          } else {
            const updatedTabs = delayedTabs.filter(
              (tab: DelayedTab) => tab.id !== tabId
            );
            await chrome.storage.local.set({ delayedTabs: updatedTabs });
          }
        } else {
          const updatedTabs = delayedTabs.filter(
            (tab: DelayedTab) => tab.id !== tabId
          );
          await chrome.storage.local.set({ delayedTabs: updatedTabs });
        }
      }
    } catch (error) {
      //
      if (chrome.runtime.lastError) {
        //
      }
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
    const now = Date.now();

    const tabsToWake = delayedTabs.filter(
      (tab: DelayedTab) => tab.wakeTime <= now
    );
    const remainingTabs = delayedTabs.filter(
      (tab: DelayedTab) => tab.wakeTime > now
    );

    await Promise.all(
      tabsToWake.map(async (tab: DelayedTab) => {
        if (tab.url) {
          await chrome.tabs.create({ url: tab.url });
          if (tab.isRecurring && tab.recurrencePattern) {
            const nextWakeTime = calculateNextWakeTime(tab.recurrencePattern);

            if (nextWakeTime) {
              const newTabId = Date.now();
              const updatedTab = {
                ...tab,
                id: newTabId,
                wakeTime: nextWakeTime,
              };

              remainingTabs.push(updatedTab);
              await chrome.alarms.create(`delayed-tab-${newTabId}`, {
                when: nextWakeTime,
              });
            }
          }
        }
      })
    );

    await chrome.storage.local.set({ delayedTabs: remainingTabs });

    await Promise.all(
      remainingTabs.map((tab: DelayedTab) =>
        chrome.alarms.create(`delayed-tab-${tab.id}`, {
          when: tab.wakeTime,
        })
      )
    );
  } catch (error) {
    //
    if (chrome.runtime.lastError) {
      //
    }
  }
});
