import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';

function CustomDelayView(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [customDate, setCustomDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  useEffect(() => {
    const getCurrentTab = async (): Promise<void> => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      setActiveTab(tab);
      setLoading(false);
    };

    getCurrentTab();
  }, []);

  const handleDelay = async (): Promise<void> => {
    if (!activeTab || !activeTab.id) return;

    const wakeTime = new Date(customDate).getTime();

    const tabInfo = {
      id: activeTab.id,
      url: activeTab.url,
      title: activeTab.title,
      favicon: activeTab.favIconUrl,
      createdAt: Date.now(),
      wakeTime,
    };

    // Save delayed tab info to storage
    await chrome.storage.local.get({ delayedTabs: [] }, async (data) => {
      const { delayedTabs } = data;
      delayedTabs.push(tabInfo);
      await chrome.storage.local.set({ delayedTabs });

      // Create alarm for this tab
      await chrome.alarms.create(`delayed-tab-${tabInfo.id}`, {
        when: wakeTime,
      });

      // Close the tab
      await chrome.tabs.remove(tabInfo.id);

      // Close the popup
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
    <div className='card w-80 bg-base-100 shadow-md rounded-xl'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center'>
          <Link
            to='/'
            className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-200'
            aria-label='Voltar ao menu principal'
            viewTransition={{ types: ['slide-right'] }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='h-5 w-5'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18'
              />
            </svg>
          </Link>
          <h2 className='card-title text-delayo-orange font-medium'>Escolher Data/Hora</h2>
        </div>

        {activeTab && (
          <div className='mb-5 flex items-center rounded-lg bg-base-200/50 p-4 shadow-sm transition-all duration-200 hover:bg-base-200/80'>
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

        <div className='form-control'>
          <label className='label'>
            <span className='label-text font-medium'>Escolha a data e hora</span>
          </label>
          <input
            type='datetime-local'
            className='input input-bordered w-full bg-base-200/70 focus:bg-base-200 transition-all duration-200 border-none shadow-sm'
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className='card-actions mt-6 justify-end'>
          <button
            className='btn btn-primary border-none shadow-sm hover:shadow transition-all duration-200'
            onClick={handleDelay}
            disabled={!activeTab || !customDate}
          >
            Adiar Aba
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomDelayView;