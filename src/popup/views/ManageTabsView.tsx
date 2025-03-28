import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DelayedTab } from '@types';
import { useTranslation } from 'react-i18next';

import useTheme from '../../utils/useTheme';

function ManageTabsView(): React.ReactElement {
  const [delayedTabs, setDelayedTabs] = useState<DelayedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTabs, setSelectedTabs] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const loadDelayedTabs = async (): Promise<void> => {
      try {
        setLoading(true);
        const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
        const sortedTabs = [...delayedTabs].sort(
          (a, b) => a.wakeTime - b.wakeTime
        );
        setDelayedTabs(sortedTabs);
      } catch (error) {
        console.error('Error loading delayed tabs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDelayedTabs();
  }, []);

  const wakeTabNow = async (tab: DelayedTab): Promise<void> => {
    try {
      if (tab.url) {
        await chrome.tabs.create({ url: tab.url });
        const updatedTabs = delayedTabs.filter((t) => t.id !== tab.id);
        await chrome.storage.local.set({ delayedTabs: updatedTabs });
        await chrome.alarms.clear(`delayed-tab-${tab.id}`);
        setDelayedTabs(updatedTabs);
        setSelectedTabs(prev => prev.filter(id => id !== tab.id));
      }
    } catch (error) {
      console.error('Error waking tab:', error);
    }
  };

  const removeTab = async (tab: DelayedTab): Promise<void> => {
    try {
      const updatedTabs = delayedTabs.filter((t) => t.id !== tab.id);
      await chrome.storage.local.set({ delayedTabs: updatedTabs });
      await chrome.alarms.clear(`delayed-tab-${tab.id}`);
      setDelayedTabs(updatedTabs);
      setSelectedTabs(prev => prev.filter(id => id !== tab.id));
    } catch (error) {
      console.error('Error removing tab:', error);
    }
  };
  
  const toggleSelectMode = (): void => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedTabs([]);
    }
  };

  const toggleSelectAll = (): void => {
    if (selectedTabs.length === delayedTabs.length) {
      setSelectedTabs([]);
    } else {
      setSelectedTabs(delayedTabs.map(tab => tab.id));
    }
  };

  const toggleSelectTab = (tabId: number): void => {
    setSelectedTabs(prev => {
      if (prev.includes(tabId)) {
        return prev.filter(id => id !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };

  const wakeSelectedTabs = async (): Promise<void> => {
    try {
      for (const tabId of selectedTabs) {
        const tab = delayedTabs.find(t => t.id === tabId);
        if (tab && tab.url) {
          await chrome.tabs.create({ url: tab.url });
        }
      }

      const updatedTabs = delayedTabs.filter(tab => !selectedTabs.includes(tab.id));
      await chrome.storage.local.set({ delayedTabs: updatedTabs });

      for (const tabId of selectedTabs) {
        await chrome.alarms.clear(`delayed-tab-${tabId}`);
      }

      setDelayedTabs(updatedTabs);
      setSelectedTabs([]);
    } catch (error) {
      console.error('Error waking selected tabs:', error);
    }
  };

  const removeSelectedTabs = async (): Promise<void> => {
    try {
      const updatedTabs = delayedTabs.filter(tab => !selectedTabs.includes(tab.id));
      await chrome.storage.local.set({ delayedTabs: updatedTabs });

      for (const tabId of selectedTabs) {
        await chrome.alarms.clear(`delayed-tab-${tabId}`);
      }

      setDelayedTabs(updatedTabs);
      setSelectedTabs([]);
    } catch (error) {
      console.error('Error removing selected tabs:', error);
    }
  };

  const formatDate = (timestamp: number): string => {
    // Obter o idioma atual do i18n
    const locale = document.documentElement.lang || navigator.language || 'pt-BR';
    
    // Configurar formatação de acordo com o idioma
    const isEnglish = locale.startsWith('en');
    // As variáveis isSpanish e isPortuguese foram removidas pois não são utilizadas
    
    // Criar objeto de data
    const date = new Date(timestamp);
    
    // Formatar a data de acordo com o idioma
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long', // Mês por extenso (será traduzido automaticamente)
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: isEnglish, // Usar AM/PM apenas para inglês
      // A ordem de data (dia/mês/ano ou mês/dia/ano) é automática com toLocaleString
      // Ordem de data para inglês (mês/dia/ano) é automática com toLocaleString
    });
  };

  const calculateTimeLeft = (wakeTime: number): string => {
    const now = Date.now();
    const diff = wakeTime - now;
    if (diff <= 0) return t('manageTabs.now', 'Now');
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className='card w-[40rem] rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              to='/'
              className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-100'
              viewTransition={{ types: ['slide-right'] }}
            >
              <FontAwesomeIcon icon='arrow-left' />
            </Link>
            <h2 className='card-title font-bold text-delayo-orange'>
              {t('manageTabs.title')}
            </h2>
          </div>
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

        {delayedTabs.length === 0 ? (
          <div className='flex flex-col items-center justify-center p-8 text-center'>
            <FontAwesomeIcon
              icon='hourglass-empty'
              className='mb-4 h-12 w-12 text-neutral-400'
            />
            <h3 className='mb-2 text-lg font-medium'>{t('manageTabs.noTabs')}</h3>
            <p className='text-sm text-base-content/70'>
              {t('manageTabs.noDelayedTabs')}
            </p>
          </div>
        ) : (
          <div className='overflow-y-auto max-h-[400px]'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center'>
                <button
                  type='button'
                  className={`btn btn-sm ${selectMode ? 'btn-outline' : ''}`}
                  style={!selectMode ? { backgroundColor: '#ffb26f', color: '#3B1B00' } : {}}
                  onClick={toggleSelectMode}
                  title={selectMode ? 'Cancelar seleção' : 'Ativar modo de seleção múltipla'}
                >
                  <FontAwesomeIcon 
                    icon={selectMode ? 'times' : 'check-square'} 
                    className='mr-2'
                  />
                  {selectMode ? 'Cancelar' : 'Selecionar'}
                </button>
                {selectMode && (
                  <button
                    type='button'
                    className='btn btn-sm btn-ghost ml-2'
                    onClick={toggleSelectAll}
                  >
                    {selectedTabs.length === delayedTabs.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                )}
              </div>
              {selectMode && selectedTabs.length > 0 && (
                <div className='flex space-x-2'>
                  <button
                    type='button'
                    className='btn btn-sm'
                    style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                    onClick={wakeSelectedTabs}
                  >
                    Acordar ({selectedTabs.length})
                  </button>
                  <button
                    type='button'
                    className='btn btn-outline btn-error btn-sm'
                    onClick={removeSelectedTabs}
                  >
                    Remover ({selectedTabs.length})
                  </button>
                </div>
              )}
            </div>
            <div className='space-y-3'>
              {delayedTabs.map((tab) => (
                <div
                  key={tab.id}
                  className='flex items-center justify-between rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'
                >
                  <div className='flex items-center'>
                    {selectMode && (
                      <div 
                        className='mr-3 cursor-pointer'
                        onClick={() => toggleSelectTab(tab.id)}
                      >
                        <FontAwesomeIcon 
                          icon={selectedTabs.includes(tab.id) ? 'check-square' : 'square'} 
                          className={selectedTabs.includes(tab.id) ? 'text-delayo-orange' : 'text-base-content/50'}
                          style={{ fontSize: 'large' }}
                        />
                      </div>
                    )}
                    {tab.favicon && (
                      <img
                        src={tab.favicon}
                        alt='Tab favicon'
                        className='mr-3 h-5 w-5 rounded-sm'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className='mr-4 max-w-[200px]'>
                      <div className='truncate text-sm font-medium text-base-content/80'>
                        {tab.title || 'Aba sem título'}
                      </div>
                      <div className='truncate text-xs text-base-content/60'>
                        {formatDate(tab.wakeTime)} ({calculateTimeLeft(tab.wakeTime)})
                      </div>
                    </div>
                  </div>
                  {!selectMode && (
                    <div className='flex space-x-2'>
                      <button
                        type='button'
                        className='btn btn-sm'
                        style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                        onClick={() => wakeTabNow(tab)}
                      >
                        Acordar
                      </button>
                      <button
                        type='button'
                        className='btn btn-outline btn-error btn-sm'
                        onClick={() => removeTab(tab)}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageTabsView;