import React, { useEffect, useId, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { DelayedTab, RecurrencePattern } from '@types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Accessible Form Control component using function declaration with destructured props
function FormControl({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className='form-control'>
      <span className='mb-2 block text-sm font-medium'>{label}</span>
      {children}
    </div>
  );
}

function RecurringDelayView(): React.ReactElement {
  // Generate unique IDs for form elements
  const patternId = useId();
  const timeId = useId();
  const daysOfWeekId = useId();
  const dayOfMonthId = useId();
  const endDateId = useId();

  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [highlightedTabs, setHighlightedTabs] = useState<chrome.tabs.Tab[]>([]);
  const [allWindowTabs, setAllWindowTabs] = useState<chrome.tabs.Tab[]>([]);
  const [selectedMode, setSelectedMode] = useState<'active' | 'highlighted' | 'window'>('active');
  const [loading, setLoading] = useState(true);
  const [recurrenceType, setRecurrenceType] =
    useState<RecurrencePattern['type']>('daily');
  const [time, setTime] = useState<string>('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default to weekdays
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [endDate, setEndDate] = useState<string>('');

  const weekDays = [
    { value: 0, label: 'D' },
    { value: 1, label: 'S' },
    { value: 2, label: 'T' },
    { value: 3, label: 'Q' },
    { value: 4, label: 'Q' },
    { value: 5, label: 'S' },
    { value: 6, label: 'S' },
  ];

  useEffect(() => {
    const getTabs = async (): Promise<void> => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
          // Obter a aba ativa
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          setActiveTab(tab);
          
          // Obter abas destacadas (selecionadas pelo usuário)
          const highlighted = await chrome.tabs.query({
            highlighted: true,
            currentWindow: true,
          });
          setHighlightedTabs(highlighted);
          
          // Obter o modo de seleção da tela principal
          const { selectedMode: mainViewMode } = await chrome.storage.local.get('selectedMode');
          if (mainViewMode) {
            setSelectedMode(mainViewMode);
          } else if (highlighted.length > 1) {
            setSelectedMode('highlighted');
          } else {
            setSelectedMode('active');
          }
          
          // Obter todas as abas da janela atual
          const allTabs = await chrome.tabs.query({
            currentWindow: true,
          });
          setAllWindowTabs(allTabs);
        } else {
          // Modo de desenvolvimento
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

  useEffect(() => {
    // Update selected days when recurrence type changes
    if (recurrenceType === 'daily') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (recurrenceType === 'weekdays') {
      setSelectedDays([1, 2, 3, 4, 5]);
    } else if (recurrenceType === 'weekly') {
      setSelectedDays([new Date().getDay()]);
    }
  }, [recurrenceType]);

  const toggleDay = (day: number): void => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  // Função para obter as abas a serem adiadas com base no modo selecionado
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

    // Calculate the first wake time
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const firstWakeTime = new Date();
    firstWakeTime.setHours(hours, minutes, 0, 0);

    // If the time is already past today, set to tomorrow
    if (firstWakeTime.getTime() < now.getTime()) {
      firstWakeTime.setDate(firstWakeTime.getDate() + 1);
    }

    // For monthly, set to the correct day of month
    if (recurrenceType === 'monthly') {
      firstWakeTime.setDate(dayOfMonth);
      // If the day has already passed this month, set to next month
      if (firstWakeTime.getTime() < now.getTime()) {
        firstWakeTime.setMonth(firstWakeTime.getMonth() + 1);
      }
    }

    // For weekly or custom days, adjust to the next occurrence of one of the selected days
    if (recurrenceType === 'weekly' || recurrenceType === 'custom') {
      const currentDay = now.getDay();
      let daysUntilNext = 7; // Default to a week if no days are selected

      // Find the next day that is selected
      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (selectedDays.includes(checkDay)) {
          daysUntilNext = i;
          break;
        }
      }

      firstWakeTime.setDate(now.getDate() + daysUntilNext);
    }

    // Create the recurrence pattern
    const recurrencePattern: RecurrencePattern = {
      type: recurrenceType,
      time,
      daysOfWeek: selectedDays,
      dayOfMonth: recurrenceType === 'monthly' ? dayOfMonth : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
    };

    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      // Save to storage
      chrome.storage.local.get({ delayedTabs: [] }, async (data) => {
        const { delayedTabs } = data;
        const tabIds: number[] = [];
        
        // Processar cada aba a ser adiada
        for (const tab of tabsToDelay) {
          if (!tab.id) continue;
          
          // Create the delayed tab info
          const tabInfo: DelayedTab = {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            favicon: tab.favIconUrl,
            createdAt: Date.now(),
            wakeTime: firstWakeTime.getTime(),
            recurrencePattern,
          };
          
          // Adicionar à lista de abas adiadas
          delayedTabs.push(tabInfo);
          
          // Create alarm for this tab
          if (chrome.alarms) {
            await chrome.alarms.create(`delayed-tab-${tabInfo.id}`, {
              when: firstWakeTime.getTime(),
            });
          }
          
          // Adicionar ID da aba à lista para fechar
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
    <div className='card w-80 rounded-none bg-base-300 shadow-xl'>
      <div className='card-body p-5'>
        <div className='mb-4 flex items-center'>
          <Link
            to='/'
            className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-100'
            aria-label='Voltar ao menu principal'
            viewTransition={{ types: ['slide-right'] }}
          >
            <FontAwesomeIcon icon='arrow-left' />
          </Link>
          <h2 className='card-title font-bold text-delayo-orange'>
            Adiamento Recorrente
          </h2>
        </div>

        <div className='mb-4'>
          <div className='text-sm font-medium text-base-content/80 mb-2'>Adiando:</div>
          <div className='rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'>
            {selectedMode === 'active' && activeTab && (
              <div className='flex items-center'>
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
                {highlightedTabs.length} {highlightedTabs.length === 1 ? 'aba selecionada' : 'abas selecionadas'}
              </div>
            )}
            
            {selectedMode === 'window' && (
              <div className='text-sm font-medium text-base-content/80'>
                {allWindowTabs.length} {allWindowTabs.length === 1 ? 'aba na janela' : 'abas na janela'}
              </div>
            )}
          </div>
        </div>

        <FormControl label='Padrão de Recorrência'>
          <select
            id={patternId}
            className='select select-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={recurrenceType}
            onChange={(e) =>
              setRecurrenceType(e.target.value as RecurrencePattern['type'])
            }
          >
            <option value='daily'>Diariamente</option>
            <option value='weekdays'>Dias de Semana (Seg-Sex)</option>
            <option value='weekly'>Semanalmente</option>
            <option value='monthly'>Mensalmente</option>
            <option value='custom'>Dias Personalizados</option>
          </select>
        </FormControl>

        <FormControl label='Horário'>
          <input
            id={timeId}
            type='time'
            className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </FormControl>

        {(recurrenceType === 'weekly' || recurrenceType === 'custom') && (
          <FormControl label='Dias da Semana'>
            <div
              id={daysOfWeekId}
              className='mt-1 flex flex-wrap justify-between gap-1'
            >
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  type='button'
                  className={`btn btn-circle btn-sm ${selectedDays.includes(day.value) ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => toggleDay(day.value)}
                  aria-label={`Toggle ${day.label}`}
                  aria-pressed={selectedDays.includes(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </FormControl>
        )}

        {recurrenceType === 'monthly' && (
          <FormControl label='Dia do Mês'>
            <input
              id={dayOfMonthId}
              type='number'
              className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
              min='1'
              max='31'
              value={dayOfMonth}
              onChange={(e) =>
                setDayOfMonth(
                  Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1))
                )
              }
            />
          </FormControl>
        )}

        <FormControl label='Data de Término (opcional)'>
          <input
            id={endDateId}
            type='date'
            className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </FormControl>

        <div className='card-actions mt-4 justify-end'>
          <button
            className='btn btn-primary'
            onClick={handleDelay}
            disabled={
              getTabsToDelay().length === 0 ||
              (recurrenceType === 'custom' && selectedDays.length === 0)
            }
          >
            Adiar Aba
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecurringDelayView;
