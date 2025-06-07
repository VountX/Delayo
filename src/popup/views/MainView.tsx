// filepath: /home/burkhard/Code/delayo/src/popup/views/MainView.tsx
import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import { DelayOption } from '@types';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useTheme from '../../utils/useTheme';

interface DelaySettings {
  laterToday: number; // hours
  tonightTime: string; // format HH:MM
  tomorrowTime: string; // format HH:MM
  weekendDay: 'saturday' | 'sunday';
  weekendTime: string; // format HH:MM
  nextWeekSameDay: boolean; // if true, same week day; if false, specific day
  nextWeekDay: number; // 0-6 (0 = Sunday, 1 = Monday, ...)
  nextWeekTime: string; // format HH:MM
  nextMonthSameDay: boolean; // if true, same month day; if false, same week day near the same day
  somedayMinMonths: number; // min of months for "Someday"
  somedayMaxMonths: number; // max of months for "Someday"
}

function MainView(): React.ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [highlightedTabs, setHighlightedTabs] = useState<chrome.tabs.Tab[]>([]);
  const [allWindowTabs, setAllWindowTabs] = useState<chrome.tabs.Tab[]>([]);
  const [selectedMode, setSelectedMode] = useState<'active' | 'highlighted' | 'window'>('active');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DelaySettings>({
    laterToday: 3, // 3 hours later
    tonightTime: '18:00',
    tomorrowTime: '09:00',
    weekendDay: 'saturday',
    weekendTime: '09:00',
    nextWeekDay: 1, // Monday
    nextWeekTime: '09:00',
    nextMonthSameDay: true,
    nextWeekSameDay: true,
    somedayMinMonths: 3, // default min of 3 months for "Someday"
    somedayMaxMonths: 12, // default - max of 12 months for "Someday"
  });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const getTabs = async (): Promise<void> => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          // Actual tab
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          setActiveTab(tab);
          
          // Selected by user
          const highlighted = await chrome.tabs.query({
            highlighted: true,
            currentWindow: true,
          });
          setHighlightedTabs(highlighted);
          
          // Intelligence to decide method based on number of tabs selected
          if (highlighted.length > 1) {
            setSelectedMode('highlighted');
          } else {
            setSelectedMode('active');
          }
          
          // For window - all tabs
          const allTabs = await chrome.tabs.query({
            currentWindow: true,
          });
          setAllWindowTabs(allTabs);
        } else {
          // dev
          const mockTab = {
            id: 123,
            url: 'https://example.com',
            title: 'Example Page (DEV MODE)',
            favIconUrl: 'https://www.google.com/favicon.ico',
          } as chrome.tabs.Tab;
          
          setActiveTab(mockTab);
          setHighlightedTabs([mockTab]);
          setAllWindowTabs([mockTab]);
        }
      } catch (error) {
        console.error('Error getting tabs:', error);
      } finally {
        setLoading(false);
      }
    };

    getTabs();
  }, []);

  // load settings
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const { delaySettings } =
            await chrome.storage.local.get('delaySettings');
          if (delaySettings) {
            setSettings(delaySettings);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const getTimeFromString = (
    timeString: string
  ): { hours: number; minutes: number } => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  };

  const delayOptions: DelayOption[] = [
    {
      id: 'later_today',
      label: t('popup.delayOptions.laterToday', { hours: settings.laterToday }),
      hours: settings.laterToday,
    },
    {
      id: 'tonight',
      label: t('popup.delayOptions.tonight', { time: settings.tonightTime }),
      custom: true,
      calculateTime: () => {
        const { hours, minutes } = getTimeFromString(settings.tonightTime);
        const today = new Date();
        today.setHours(hours, minutes, 0, 0);
        if (today.getTime() < Date.now()) {
          return Date.now() + 60 * 60 * 1000;
        }
        return today.getTime();
      },
    },
    {
      id: 'tomorrow',
      label: t('popup.delayOptions.tomorrow', { time: settings.tomorrowTime }),
      custom: true,
      calculateTime: () => {
        const { hours, minutes } = getTimeFromString(settings.tomorrowTime);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hours, minutes, 0, 0);
        return tomorrow.getTime();
      },
    },
    {
      id: 'weekend',
      label: t('popup.delayOptions.weekend', { 
        day: t(`popup.weekdays.${settings.weekendDay}`), 
        time: settings.weekendTime 
      }),
      custom: true,
      calculateTime: () => {
        const { hours, minutes } = getTimeFromString(settings.weekendTime);
        const today = new Date();
        const currentDay = today.getDay();
        const targetDay = settings.weekendDay === 'saturday' ? 6 : 0;

        let daysUntilTarget;
        if (currentDay === targetDay) {
          daysUntilTarget = 7;
        } else if (currentDay < targetDay) {
          daysUntilTarget = targetDay - currentDay;
        } else {
          daysUntilTarget = 7 - (currentDay - targetDay);
        }

        const targetDate = new Date();
        targetDate.setDate(today.getDate() + daysUntilTarget);
        targetDate.setHours(hours, minutes, 0, 0);
        return targetDate.getTime();
      },
    },
    {
      id: 'next_week',
      label: (() => {
        if (settings.nextWeekSameDay) {
          const today = new Date();
          const dayName = t(`popup.weekdays.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()]}`);
          return t('popup.delayOptions.nextWeek', { day: dayName, time: '' }).replace(', ', '');
        } else {
          const dayName = t(`popup.weekdays.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][settings.nextWeekDay]}`);
          return t('popup.delayOptions.nextWeek', { day: dayName, time: '' }).replace(', ', '');
        }
      })(),
      custom: true,
      calculateTime: () => {
        const today = new Date();
        const hours = today.getHours();
        const minutes = today.getMinutes();
        let targetDay;
        
        if (settings.nextWeekSameDay) {
          targetDay = today.getDay();
        } else {
          targetDay = settings.nextWeekDay;
        }
        
        const currentDay = today.getDay();
        let daysUntilTarget;
        if (currentDay === targetDay) {
          daysUntilTarget = 7;
        } else if (currentDay < targetDay) {
          daysUntilTarget = targetDay - currentDay + 7;
        } else {
          daysUntilTarget = 7 - (currentDay - targetDay) + 7;
        }

        const targetDate = new Date();
        targetDate.setDate(today.getDate() + daysUntilTarget);
        targetDate.setHours(hours, minutes, 0, 0);
        return targetDate.getTime();
      },
    },
    {
      id: 'next_month',
      label: (() => {
        const today = new Date();
        const targetDate = new Date();
        let formattedDate = '';
        
        if (settings.nextMonthSameDay) {
          targetDate.setMonth(today.getMonth() + 1);
          const lastDayOfNextMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 2,
            0
          ).getDate();
          if (today.getDate() > lastDayOfNextMonth) {
            targetDate.setDate(lastDayOfNextMonth);
          }
          const { i18n } = useTranslation();
          const locale = i18n.language || navigator.language || 'pt-BR';
          formattedDate = targetDate.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
        } else {
          const currentDay = today.getDay();
          const currentWeekOfMonth = Math.ceil(today.getDate() / 7);
          targetDate.setMonth(today.getMonth() + 1);
          targetDate.setDate(1);

          while (targetDate.getDay() !== currentDay) {
            targetDate.setDate(targetDate.getDate() + 1);
          }

          targetDate.setDate(
            targetDate.getDate() + (currentWeekOfMonth - 1) * 7
          );

          if (targetDate.getMonth() !== (today.getMonth() + 1) % 12) {
            targetDate.setDate(1);
            targetDate.setMonth((today.getMonth() + 1) % 12);

            let lastOccurrence = 0;
            const daysInMonth = new Date(
              targetDate.getFullYear(),
              targetDate.getMonth() + 1,
              0
            ).getDate();

            for (let i = 1; i <= daysInMonth; i++) {
              targetDate.setDate(i);
              if (targetDate.getDay() === currentDay) {
                lastOccurrence = i;
              }
            }

            targetDate.setDate(lastOccurrence);
          }

          const { i18n } = useTranslation();
          const locale = i18n.language || navigator.language || 'pt-BR';
          formattedDate = targetDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
        }
        
        const { i18n } = useTranslation();
        const locale = i18n.language || navigator.language || 'pt-BR';
        let timeStr;
        
        if (locale.startsWith('en')) {
          const hours = today.getHours();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const hours12 = hours % 12 || 12;
          timeStr = `${hours12}:${today.getMinutes().toString().padStart(2, '0')} ${ampm}`;
        } else {
          timeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
        }
        return `${t('popup.delayOptions.nextMonth')} (${formattedDate}, ${timeStr})`;
      })(),
      custom: true,
      calculateTime: () => {
        const today = new Date();
        const targetDate = new Date();

        if (settings.nextMonthSameDay) {
          targetDate.setMonth(today.getMonth() + 1);
          const lastDayOfNextMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 2,
            0
          ).getDate();
          if (today.getDate() > lastDayOfNextMonth) {
            targetDate.setDate(lastDayOfNextMonth);
          }
        } else {
          const currentDay = today.getDay();
          const currentWeekOfMonth = Math.ceil(today.getDate() / 7);
          targetDate.setMonth(today.getMonth() + 1);
          targetDate.setDate(1);

          while (targetDate.getDay() !== currentDay) {
            targetDate.setDate(targetDate.getDate() + 1);
          }

          targetDate.setDate(
            targetDate.getDate() + (currentWeekOfMonth - 1) * 7
          );

          if (targetDate.getMonth() !== (today.getMonth() + 1) % 12) {
            targetDate.setDate(1);
            targetDate.setMonth((today.getMonth() + 1) % 12);

            let lastOccurrence = 0;
            const daysInMonth = new Date(
              targetDate.getFullYear(),
              targetDate.getMonth() + 1,
              0
            ).getDate();

            for (let i = 1; i <= daysInMonth; i++) {
              targetDate.setDate(i);
              if (targetDate.getDay() === currentDay) {
                lastOccurrence = i;
              }
            }

            targetDate.setDate(lastOccurrence);
          }
        }
        targetDate.setHours(today.getHours(), today.getMinutes(), 0, 0);
        return targetDate.getTime();
      },
    },
    {
      id: 'someday',
      label: t('popup.delayOptions.someday'),
      custom: true,
      calculateTime: () => {
        const today = new Date();
        const minMonths = settings.somedayMinMonths;
        const maxMonths = settings.somedayMaxMonths;
        const randomMonths = Math.floor(Math.random() * (maxMonths - minMonths + 1)) + minMonths;

        const randomDays = Math.floor(Math.random() * 30);

        const targetDate = new Date();
        targetDate.setMonth(today.getMonth() + randomMonths);
        targetDate.setDate(today.getDate() + randomDays);

        return targetDate.getTime();
      },
    },
  ];

  const getTabsToDelay = (): chrome.tabs.Tab[] => {
    switch (selectedMode) {
      case 'active':
        return activeTab ? [activeTab] : [];
      case 'highlighted':
        return highlightedTabs;
      case 'window':
        return allWindowTabs;
      default:
        return activeTab ? [activeTab] : [];
    }
  };

  const handleDelay = async (option: DelayOption): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ selectedMode });
    }
    const tabsToDelay = getTabsToDelay();
    if (tabsToDelay.length === 0) return;

    let wakeTime: number;
    if (option.calculateTime) {
      wakeTime = option.calculateTime();
    } else {
      const now = Date.now();
      wakeTime =
        now +
        (option.hours ? option.hours * 60 * 60 * 1000 : 0) +
        (option.days ? option.days * 24 * 60 * 60 * 1000 : 0);
    }

    await chrome.storage.local.get({ delayedTabs: [] }, async (data) => {
      const { delayedTabs } = data;
      const tabIds: number[] = [];
      
      for (const tab of tabsToDelay) {
        if (!tab.id) continue;

        const newTabId = Date.now() + Math.floor(Math.random() * 10000);

        const tabInfo = {
          id: newTabId,
          url: tab.url,
          title: tab.title,
          favicon: tab.favIconUrl,
          createdAt: Date.now(),
          wakeTime,
        };

        delayedTabs.push(tabInfo);
        
        await chrome.alarms.create(`delayed-tab-${tabInfo.id}`, {
          when: wakeTime,
        });
        
        tabIds.push(tab.id);
      }
      
      await chrome.storage.local.set({ delayedTabs });

      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
      }

      window.close();
    });
  };

  if (loading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className='card w-[40rem] rounded-none bg-base-300 shadow-md max-h-[600px] overflow-hidden'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <h2 className='card-title flex items-center font-bold text-delayo-orange'>
            <FontAwesomeIcon
              icon={faHourglassHalf}
              className='mr-2 h-5 w-5 text-delayo-orange'
            />
            Delayo
          </h2>
          <div className='flex items-center space-x-2'>
            <Link
              to='/settings'
              className='btn btn-circle btn-ghost btn-sm transition-all duration-200 hover:bg-base-100'
              viewTransition={{ types: ['slide-left'] }}
              aria-label='Settings'
            >
              <FontAwesomeIcon
                icon='gear'
                className='text-neutral-400 hover:text-delayo-orange'
              />
            </Link>
            <button
              type='button'
              className='btn btn-circle btn-ghost btn-sm transition-all duration-200 hover:bg-base-100'
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <FontAwesomeIcon
                icon={theme === 'light' ? 'moon' : 'sun'}
                className={
                  theme === 'light' ? 'text-delayo-purple' : 'text-delayo-yellow'
                }
              />
            </button>
          </div>
        </div>

        <div className='mb-5 flex flex-col space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-base-content/80'>{t('popup.delay')}:</div>
            <div className='flex space-x-2'>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'active' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMode('active')}
              >
                {t('popup.tabs.active')}
              </button>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'highlighted' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMode('highlighted')}
                disabled={highlightedTabs.length <= 1}
              >
                {t('popup.tabs.highlighted')} {highlightedTabs.length > 1 ? `(${highlightedTabs.length})` : ''}
              </button>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'window' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMode('window')}
              >
                {t('popup.tabs.window')} {allWindowTabs.length > 0 ? `(${allWindowTabs.length})` : ''}
              </button>
            </div>
          </div>

          <div className='rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'>
            {selectedMode === 'active' && activeTab && (
              <div className='flex items-center'>
                {activeTab.favIconUrl && (
                  <img
                    src={activeTab.favIconUrl}
                    alt='Tab favicon'
                    className='mr-3 h-5 w-5 rounded-sm'
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className='truncate text-sm font-medium text-base-content/80'>
                  {activeTab.title}
                </div>
              </div>
            )}
            
            {selectedMode === 'highlighted' && (
              <div className='text-sm font-medium text-base-content/80'>
                {highlightedTabs.length} {highlightedTabs.length === 1 ? t('common.tabs.singular') : t('common.tabs')} {t('popup.selected')}
              </div>
            )}
            
            {selectedMode === 'window' && (
              <div className='text-sm font-medium text-base-content/80'>
                {allWindowTabs.length} {allWindowTabs.length === 1 ? t('common.tabs.singular') : t('common.tabs')} {t('popup.inWindow')}
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-3 gap-2.5'>
          {delayOptions.slice(0, 7).map((option) => (
            <div key={option.id} className='card'>
              <button
                type='button'
                className='group btn h-24 flex-col items-center justify-center rounded-xl border-none bg-base-100/70 p-3 shadow-sm transition-all duration-200 hover:bg-base-100'
                onClick={() => handleDelay(option)}
              >
                <FontAwesomeIcon
                  icon={
                    option.id === 'later_today'
                      ? 'mug-hot'
                      : option.id === 'tonight'
                        ? 'moon'
                        : option.id === 'tomorrow'
                          ? 'cloud-sun'
                          : option.id === 'weekend'
                            ? 'couch'
                            : option.id === 'next_week'
                              ? 'briefcase'
                              : option.id === 'next_month'
                                ? 'envelope'
                                : option.id === 'someday'
                                  ? 'umbrella-beach'
                                  : 'clock'
                  }
                  className='mb-3 h-5 w-5 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
                />
                <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                  {option.label}
                </span>
              </button>
            </div>
          ))}

          <div className='card'>
            <Link
              to='/custom-delay'
              className='group btn h-24 flex-col items-center justify-center rounded-xl border-none bg-base-100/70 p-3 shadow-sm transition-all duration-200 hover:bg-base-100'
              viewTransition={{ types: ['slide-left'] }}
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                  chrome.storage.local.set({ selectedMode });
                }
              }}
            >
              <FontAwesomeIcon
                icon='calendar-days'
                className='mb-3 h-5 w-5 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
              />
              <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                {t('popup.delayOptions.custom')}
              </span>
            </Link>
          </div>

          <div className='card'>
            <Link
              to='/recurring-delay'
              className='group btn h-24 flex-col items-center justify-center rounded-xl border-none bg-base-100/70 p-3 shadow-sm transition-all duration-200 hover:bg-base-100'
              viewTransition={{ types: ['slide-left'] }}
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                  chrome.storage.local.set({ selectedMode });
                }
              }}
            >
              <FontAwesomeIcon
                icon='repeat'
                className='mb-3 h-5 w-5 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
              />
              <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                {t('popup.delayOptions.recurring')}
              </span>
            </Link>
          </div>
        </div>

        <div className='mt-6 flex justify-center'>
          <Link
            to='/manage-tabs'
            className='btn btn-sm btn-ghost text-sm font-medium text-base-content/70 hover:text-delayo-orange transition-all duration-200'
            viewTransition={{ types: ['slide-left'] }}
          >
            <FontAwesomeIcon
              icon='list-ul'
              className='mr-2 h-4 w-4'
            />
            {t('popup.actions.manageTabs')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MainView;
