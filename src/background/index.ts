import { DelayedTab, RecurrencePattern } from '@types';
import generateUniqueTabId from '@utils/generateUniqueTabId';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';

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
      const tabId = alarm.name.replace('delayed-tab-', '');

      const { delayedTabs = [] } =
        await chrome.storage.local.get('delayedTabs');
      const normalizedTabs = normalizeDelayedTabs(delayedTabs);

      const delayedTab = normalizedTabs.find(
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

          // Refresh tabs before updating to avoid race conditions when multiple
          // alarms fire simultaneously
          const { delayedTabs: currentTabs = [] } = await chrome.storage.local.get(
            'delayedTabs'
          );
          const updatedTabs = currentTabs.filter(
            (tab: DelayedTab) => String(tab.id) !== tabId
          );

          if (nextWakeTime) {
            const updatedTab = {
              ...delayedTab,
              wakeTime: nextWakeTime,
            };

            const newTabId = generateUniqueTabId();
            updatedTab.id = newTabId;
            updatedTabs.push(updatedTab);

            await chrome.storage.local.set({ delayedTabs: updatedTabs });

            await chrome.alarms.create(`delayed-tab-${newTabId}`, {
              when: nextWakeTime,
            });
          } else {
            await chrome.storage.local.set({ delayedTabs: updatedTabs });
          }
        } else {
          const { delayedTabs: currentTabs = [] } = await chrome.storage.local.get(
            'delayedTabs'
          );
          const updatedTabs = currentTabs.filter(
            (tab: DelayedTab) => String(tab.id) !== tabId
          );
          await chrome.storage.local.set({ delayedTabs: updatedTabs });
        }
      }
    } catch (error) {
      // Handle errors waking the tab
      if (chrome.runtime.lastError) {
        // Log runtime errors for debugging
      }
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
    const normalizedTabs = normalizeDelayedTabs(delayedTabs);
    const now = Date.now();

    const tabsToWake = normalizedTabs.filter(
      (tab: DelayedTab) => tab.wakeTime <= now
    );
    const remainingTabs = normalizedTabs.filter(
      (tab: DelayedTab) => tab.wakeTime > now
    );

    await Promise.all(
      tabsToWake.map(async (tab: DelayedTab) => {
        if (tab.url) {
          await chrome.tabs.create({ url: tab.url });
          if (tab.isRecurring && tab.recurrencePattern) {
            const nextWakeTime = calculateNextWakeTime(tab.recurrencePattern);

            if (nextWakeTime) {
              const newTabId = generateUniqueTabId();
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
    // Handle errors during startup wake process
    if (chrome.runtime.lastError) {
      // Log runtime errors for debugging
    }
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'wake-tabs' && Array.isArray(request.tabIds)) {
    const wakeTabs = async (): Promise<void> => {
      try {
        const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
        const normalizedTabs = normalizeDelayedTabs(delayedTabs);

        const tabsToWake = normalizedTabs.filter((tab: DelayedTab) =>
          request.tabIds.includes(tab.id)
        );

        for (const tab of tabsToWake) {
          if (tab.url) {
            await chrome.tabs.create({ url: tab.url });
          }
          await chrome.alarms.clear(`delayed-tab-${tab.id}`);
        }

        const updatedTabs = normalizedTabs.filter(
          (tab: DelayedTab) => !request.tabIds.includes(tab.id)
        );

        await chrome.storage.local.set({ delayedTabs: updatedTabs });

        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error });
      }
    };

    wakeTabs();
    return true; // keep the message channel open for async response
  }
  return undefined;
});