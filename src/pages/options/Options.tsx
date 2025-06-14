import { DelayedTab } from '@types';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';
import useTheme from '@utils/useTheme';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DonationButton from '../../components/DonationButton';
import LanguageSelector from '../../components/LanguageSelector';
import '../../i18n';

import DelaySettingsComponent from './DelaySettings';
import './options.css';

function Options(): React.ReactElement {
  const [delayedTabItems, setDelayedTabs] = useState<DelayedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tabs' | 'settings'>('tabs');
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const loadDelayedTabs = async (): Promise<void> => {
    try {
      setLoading(true);
      const { delayedTabs = [] } =
        await chrome.storage.local.get('delayedTabs');
      const normalizedTabs = normalizeDelayedTabs(delayedTabs);
      const sortedTabs = [...normalizedTabs].sort(
        (a, b) => a.wakeTime - b.wakeTime
      );
      setDelayedTabs(sortedTabs);
    } catch (error) {
      // Handle error while loading delayed tabs
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDelayedTabs();
  }, []);

  const wakeTabNow = async (tab: DelayedTab): Promise<void> => {
    try {
      if (tab.url) {
        await chrome.tabs.create({ url: tab.url });
        const updatedTabs = delayedTabItems.filter((item) => item.id !== tab.id);
        await chrome.storage.local.set({ delayedTabs: updatedTabs });
        await chrome.alarms.clear(`delayed-tab-${tab.id}`);
        setDelayedTabs(updatedTabs);
        setSelectedTabs(selectedTabs.filter(id => id !== tab.id));
      }
    } catch (error) {
      // Handle error while waking the tab immediately
    }
  };

  const removeTab = async (tab: DelayedTab): Promise<void> => {
    try {
      const updatedTabs = delayedTabItems.filter((item) => item.id !== tab.id);
      await chrome.storage.local.set({ delayedTabs: updatedTabs });
      await chrome.alarms.clear(`delayed-tab-${tab.id}`);
      setDelayedTabs(updatedTabs);
      setSelectedTabs(selectedTabs.filter(id => id !== tab.id));
  } catch (error) {
    // Handle error while removing a tab
  }
  };

  const formatDate = (timestamp: number): string => {
    const locale = i18n.language || navigator.language || 'pt-BR';
    
    const isEnglish = locale.startsWith('en');
    
    const date = new Date(timestamp);
    
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: isEnglish,
    });
  };

  const calculateTimeLeft = (wakeTime: number): string => {
    const now = Date.now();
    const diff = wakeTime - now;
    if (diff <= 0) return 'Now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderLoading = (): React.ReactElement => (
    <div className='p-8 text-center'>
      <span className='loading loading-spinner loading-lg' />
    </div>
  );

  const renderEmptyState = (): React.ReactElement => (
    <div className='card w-full bg-base-300 border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-300'>
      <div className='card-body text-center'>
        <h2 className='card-title justify-center'>{t('manageTabs.noTabs')}</h2>
        <p>
          {t('manageTabs.noDelayedTabs')}
        </p>
      </div>
    </div>
  );

  const wakeSelectedTabs = async (): Promise<void> => {
    try {
      const tabsToWake = delayedTabItems.filter(tab => selectedTabs.includes(tab.id));
      for (const tab of tabsToWake) {
        if (tab.url) {
          await chrome.tabs.create({ url: tab.url });
          await chrome.alarms.clear(`delayed-tab-${tab.id}`);
        }
      }
      const updatedTabs = delayedTabItems.filter(tab => !selectedTabs.includes(tab.id));
      await chrome.storage.local.set({ delayedTabs: updatedTabs });
      setDelayedTabs(updatedTabs);
      setSelectedTabs([]);
  } catch (error) {
    // Handle error while waking selected tabs
  }
  };

  const toggleTabSelection = (tabId: string): void => {
    setSelectedTabs(prev =>
      prev.includes(tabId)
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId]
    );
  };

  const renderTabsTable = (): React.ReactElement => (
    <div className='card w-full bg-base-300 border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-300'>
      <div className='card-body p-0'>
        <div className='w-full overflow-x-auto'>
          <table className='table w-full [&>tbody>tr:nth-child(odd)]:bg-base-100 [&>tbody>tr:nth-child(even)]:bg-base-300 [&>tbody>tr:hover]:bg-base-100'>
            <thead>
              <tr>
                <th className='w-12'>
                  <label>
                    <span className='sr-only'>Select all</span>
                    <input
                      type='checkbox'
                      className='checkbox'
                      checked={selectedTabs.length === delayedTabItems.length && delayedTabItems.length > 0}
                      onChange={() =>
                        setSelectedTabs(
                          selectedTabs.length === delayedTabItems.length
                            ? []
                            : delayedTabItems.map(tab => tab.id)
                        )
                      }
                    />
                  </label>
                </th>
                <th className='w-1/4'>{t('common.tabs')}</th>
                <th className='w-1/4'>{t('manageTabs.delayedUntil')}</th>
                <th className='w-1/6'>{t('manageTabs.timeLeft')}</th>
                <th className='w-1/3'>{t('manageTabs.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {delayedTabItems.map((tab) => (
                <tr key={tab.id}>
                  <td>
                    <label>
                      <span className='sr-only'>Select tab</span>
                      <input
                        type='checkbox'
                        className='checkbox'
                        aria-label='Select tab'
                        checked={selectedTabs.includes(tab.id)}
                        onChange={() => toggleTabSelection(tab.id)}
                      />
                    </label>
                  </td>
                  <td>
                    <div className='flex items-center space-x-2'>
                      {tab.favicon && (
                        <img
                          src={tab.favicon}
                          alt='Tab favicon'
                          className='h-5 w-5 flex-shrink-0'
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div
                        className='max-w-[160px] truncate sm:max-w-[220px]'
                        title={tab.title || tab.url}
                      >
                        {tab.title || tab.url || 'Unknown tab'}
                      </div>
                    </div>
                  </td>
                  <td className='whitespace-normal'>
                    {formatDate(tab.wakeTime)}
                  </td>
                  <td>{calculateTimeLeft(tab.wakeTime)}</td>
                  <td>
                    <div className='flex space-x-2'>
                      <button
                        type='button'
                        className='btn btn-sm'
                        style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                        onClick={() => wakeTabNow(tab)}
                      >
                        {t('manageTabs.wakeUp')}
                      </button>
                      <button
                        type='button'
                        className='btn btn-outline btn-error btn-sm'
                        onClick={() => removeTab(tab)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedTabs.length > 0 && (
            <div className='p-4 flex justify-end'>
              <button
                type='button'
                className='btn btn-primary'
                onClick={wakeSelectedTabs}
              >
                {t('manageTabs.actions.wakeNow')} {selectedTabs.length} {selectedTabs.length === 1 ? t('common.tabs.singular', 'Tab') : t('common.tabs')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  let content: React.ReactElement;
  if (loading) {
    content = renderLoading();
  } else if (delayedTabItems.length === 0) {
    content = renderEmptyState();
  } else {
    content = renderTabsTable();
  }

  return (
    <div className='container mx-auto max-w-fit p-4'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>{t('manageTabs.title')}</h1>
        <button
          type='button'
          className='btn btn-circle btn-ghost btn-sm transition-all duration-200 hover:bg-base-100'
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={theme === 'light' ? '0 0 384 512' : '0 0 512 512'}
            className="h-5 w-5"
            fill={theme === 'light' ? '#8A05BE' : '#FFD700'}
          >
            {theme === 'light' ? (
              <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
            ) : (
              <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" />
            )}
          </svg>
        </button>
      </div>

      <div className='tabs mb-6'>
        <a
          className={`tab tab-bordered ${activeTab === 'tabs' ? 'tab-active !border-delayo-orange !border-b-[3px]' : ''}`}
          onClick={() => setActiveTab('tabs')}
        >
          <span className='font-bold'>{t('manageTabs.tabsDelayed')}</span>
        </a>
        <a
          className={`tab tab-bordered ${activeTab === 'settings' ? 'tab-active !border-delayo-orange !border-b-[3px]' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className='font-bold'>{t('common.settings')}</span>
        </a>
      </div>

      {activeTab === 'tabs' ? content : <div className="settings-width-850"><DelaySettingsComponent isPopup={false} /></div>}

      <div className="form-control mt-4">
        <label className="label">
          <span className="label-text font-medium">{t('settings.language')}</span>
        </label>
        <LanguageSelector />
      </div>

      <div className='mt-6 text-center text-sm'>
        <div className='flex flex-col items-center justify-center gap-2'>
          <div className='flex items-center justify-center mb-4'>
            <DonationButton isCompact={false} />
          </div>
          <a
            href='https://github.com/allud1t/delayo'
            target='_blank'
            rel='noopener noreferrer'
            className='link link-primary flex items-center gap-2'
          >
            <svg
              viewBox='0 0 24 24'
              width='16'
              height='16'
              stroke='currentColor'
              fill='currentColor'
              strokeWidth='0'
              className='opacity-90'
            >
              <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
            </svg>
            GitHub Repository
          </a>
          <div className='flex gap-4'>
            <a
              href='https://github.com/allud1t/delayo/discussions/new?category=ideas'
              target='_blank'
              rel='noopener noreferrer'
              className='link link-accent'
            >
              Propose New Features
            </a>
            <a
              href='https://github.com/allud1t/delayo/issues/new'
              target='_blank'
              rel='noopener noreferrer'
              className='link link-accent'
            >
              Report Issues
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;
