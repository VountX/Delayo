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
    <div className='card w-80 bg-base-100 shadow-xl'>
      <div className='card-body p-5'>
        <div className='mb-4 flex items-center'>
          <Link
            to='/'
            className='btn btn-circle btn-ghost btn-sm mr-2'
            aria-label='Voltar ao menu principal'
            viewTransition={{ types: ['slide-right'] }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={2}
              stroke='currentColor'
              className='h-6 w-6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18'
              />
            </svg>
          </Link>
          <h2 className='card-title text-delayo-orange'>Escolher Data/Hora</h2>
        </div>

        {activeTab && (
          <div className='mb-4 flex items-center rounded-lg bg-base-100 p-3 shadow-sm'>
            {activeTab.favIconUrl && (
              <img
                src={activeTab.favIconUrl}
                alt='Tab favicon'
                className='mr-3 h-5 w-5'
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className='truncate text-sm font-medium'>
              {activeTab.title}
            </div>
          </div>
        )}

        <div className='mb-4 space-y-4'>
          <p className='text-sm'>Selecione quando trazer esta aba de volta:</p>
          <input
            type='datetime-local'
            className='input input-bordered w-full'
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        </div>

        <button
          type='button'
          className='btn btn-primary btn-block'
          onClick={handleDelay}
        >
          Adiar até o horário selecionado
        </button>
      </div>
    </div>
  );
}

export default CustomDelayView;
