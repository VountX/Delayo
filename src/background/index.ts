import { DelayedTab, RecurrencePattern } from '@types';

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Set up initial storage
    chrome.storage.local.set({ delayedTabs: [] });

    // Create context menu
    chrome.contextMenus.create({
      id: 'delay-tab',
      title: 'Delay this tab',
      contexts: ['page'],
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'delay-tab' && tab?.id) {
    // Open the popup programmatically
    chrome.action.openPopup();
  }
});

// Calculate the next occurrence for a recurring tab
function calculateNextWakeTime(
  recurrencePattern: RecurrencePattern
): number | null {
  const now = new Date();
  const [hours, minutes] = recurrencePattern.time.split(':').map(Number);

  // Check if we've reached the end date
  if (recurrencePattern.endDate && now.getTime() >= recurrencePattern.endDate) {
    return null; // No more occurrences
  }

  const nextWakeTime = new Date();
  nextWakeTime.setHours(hours, minutes, 0, 0);

  switch (recurrencePattern.type) {
    case 'daily':
      // Set to tomorrow if today's time has passed
      if (nextWakeTime.getTime() <= now.getTime()) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 1);
      }
      break;

    case 'weekdays': {
      // Start from tomorrow and find next weekday
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
        return null; // No days selected
      }

      const currentDay = now.getDay();
      const sortedDays = [...recurrencePattern.daysOfWeek].sort(
        (a, b) => a - b
      );

      // Find the next day in our selected days
      const nextDayIndex = sortedDays.findIndex((day) => day > currentDay);

      if (nextDayIndex !== -1) {
        // We found a day later this week
        const daysToAdd = sortedDays[nextDayIndex] - currentDay;
        nextWakeTime.setDate(now.getDate() + daysToAdd);
      } else {
        // All selected days are earlier in the week, go to next week
        const daysToAdd = 7 - currentDay + sortedDays[0];
        nextWakeTime.setDate(now.getDate() + daysToAdd);
      }

      // If the time already passed today and it's the same day, set to next week
      if (
        nextWakeTime.getDay() === currentDay &&
        nextWakeTime.getTime() <= now.getTime()
      ) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 7);
      }
      break;
    }

    case 'monthly': {
      // Set to the specified day of month
      nextWakeTime.setDate(recurrencePattern.dayOfMonth || 1);

      // If the day has already passed this month, set to next month
      if (nextWakeTime.getTime() <= now.getTime()) {
        nextWakeTime.setMonth(nextWakeTime.getMonth() + 1);
      }
      break;
    }

    default:
      // Default case for unknown recurrence types
      return null;
  }

  return nextWakeTime.getTime();
}

// Handle alarms when they go off
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Check if this is a delayed tab alarm
  if (alarm.name.startsWith('delayed-tab-')) {
    try {
      // Get the tab ID from the alarm name
      const tabId = parseInt(alarm.name.replace('delayed-tab-', ''), 10);

      // Retrieve the delayed tabs from storage
      const { delayedTabs = [] } =
        await chrome.storage.local.get('delayedTabs');

      // Find the delayed tab that matches this alarm
      const delayedTab = delayedTabs.find(
        (tab: DelayedTab) => tab.id === tabId
      );

      if (delayedTab && delayedTab.url) {
        await chrome.tabs.create({ url: delayedTab.url });

        // Show a notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: delayedTab.favicon || 'icons/icon128.png',
          title: 'Tab Awakened!',
          message: `Your ${delayedTab.isRecurring ? 'recurring' : 'delayed'} tab "${delayedTab.title}" is now open.`,
        });

        // Check if this is a recurring tab
        if (delayedTab.isRecurring && delayedTab.recurrencePattern) {
          // Calculate the next wake time for this recurring tab
          const nextWakeTime = calculateNextWakeTime(
            delayedTab.recurrencePattern
          );

          if (nextWakeTime) {
            // Update the tab's wake time for the next occurrence
            const updatedTab = {
              ...delayedTab,
              wakeTime: nextWakeTime,
            };

            // Create a new tab ID since Chrome doesn't allow reusing the same tab ID
            const newTabId = Date.now(); // Using timestamp as a simple unique ID
            updatedTab.id = newTabId;

            // Update the delayed tabs list
            const updatedTabs = delayedTabs.filter(
              (tab: DelayedTab) => tab.id !== tabId
            );
            updatedTabs.push(updatedTab);

            // Save the updated tabs
            await chrome.storage.local.set({ delayedTabs: updatedTabs });

            // Create a new alarm for the next occurrence
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

// Check for tabs that should have awakened (in case Chrome was closed)
chrome.runtime.onStartup.addListener(async () => {
  try {
    const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
    const now = Date.now();

    // Find tabs that should have been awakened
    const tabsToWake = delayedTabs.filter(
      (tab: DelayedTab) => tab.wakeTime <= now
    );
    const remainingTabs = delayedTabs.filter(
      (tab: DelayedTab) => tab.wakeTime > now
    );

    // Process tabs that should be awakened - using Promise.all instead of for loop
    await Promise.all(
      tabsToWake.map(async (tab: DelayedTab) => {
        if (tab.url) {
          await chrome.tabs.create({ url: tab.url });

          // If it's a recurring tab, schedule the next occurrence
          if (tab.isRecurring && tab.recurrencePattern) {
            const nextWakeTime = calculateNextWakeTime(tab.recurrencePattern);

            if (nextWakeTime) {
              // Create a new tab entry with updated wake time
              const newTabId = Date.now();
              const updatedTab = {
                ...tab,
                id: newTabId,
                wakeTime: nextWakeTime,
              };

              // Add the updated tab to the remaining tabs
              remainingTabs.push(updatedTab);

              // Create a new alarm for the next occurrence
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
