import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function CustomDelayView(): React.ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [highlightedTabs, setHighlightedTabs] = useState<chrome.tabs.Tab[]>([]);
  const [allWindowTabs, setAllWindowTabs] = useState<chrome.tabs.Tab[]>([]);
  const [selectedMode, setSelectedMode] = useState<'active' | 'highlighted' | 'window'>('active');
  const [loading, setLoading] = useState(true);
  const [customDate, setCustomDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  useEffect(() => {
    const getTabs = async (): Promise<void> => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          setActiveTab(tab);
          
          const highlighted = await chrome.tabs.query({
            highlighted: true,
            currentWindow: true,
          });
          setHighlightedTabs(highlighted);
          
          const { selectedMode: mainViewMode } = await chrome.storage.local.get('selectedMode');
          if (mainViewMode) {
            setSelectedMode(mainViewMode);
          } else if (highlighted.length > 1) {
            setSelectedMode('highlighted');
          } else {
            setSelectedMode('active');
          }

          const allTabs = await chrome.tabs.query({
            currentWindow: true,
          });
          setAllWindowTabs(allTabs);
        } else {
          //dev
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

  const handleDelay = async (): Promise<void> => {
    const tabsToDelay = getTabsToDelay();
    if (tabsToDelay.length === 0) return;

    const wakeTime = new Date(customDate).getTime();

    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get({ delayedTabs: [] }, async (data) => {
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
          
          if (chrome.alarms) {
            await chrome.alarms.create(`delayed-tab-${tabInfo.id}`, {
              when: wakeTime,
            });
          }
          
          tabIds.push(tab.id);
        }

        await chrome.storage.local.set({ delayedTabs });

        if (chrome.tabs && tabIds.length > 0) {
          await chrome.tabs.remove(tabIds);
        }

        if (window.close) {
          window.close();
        }
      });
    } else {
      console.log('Development mode - tabs would be delayed:', tabsToDelay);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className='card w-80 rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center'>
          <Link
            to='/'
            className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-100'
            aria-label={t('common.back')}
            viewTransition={{ types: ['slide-right'] }}
          >
            <FontAwesomeIcon icon='arrow-left' />
          </Link>
          <h2 className='card-title font-bold text-delayo-orange'>
            {t('customDelay.title')}
          </h2>
        </div>

        <div className='mb-5'>
          <div className='text-sm font-medium text-base-content/80 mb-2'>{t('popup.delay')}:</div>
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
                <div className='overflow-hidden'>
                  <div className='truncate text-sm font-medium text-base-content/80'>
                    {activeTab.title}
                  </div>
                  <div className='truncate text-xs text-base-content/60'>
                    {activeTab.url}
                  </div>
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

        <div className='form-control'>
          <label className='label'>
            <span className='label-text font-medium'>
              {t('customDelay.selectDateTime')}
            </span>
          </label>
          <input
            type='datetime-local'
            className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className='card-actions mt-6 justify-end'>
          <button
            className='btn btn-primary border-none shadow-sm transition-all duration-200 hover:shadow'
            onClick={handleDelay}
            disabled={!activeTab || !customDate}
          >
            {t('customDelay.delayTab')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomDelayView;
