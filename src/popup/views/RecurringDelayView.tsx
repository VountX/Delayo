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
    const getCurrentTab = async (): Promise<void> => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          setActiveTab(tab);
        } else {
          // Development mode mock data
          setActiveTab({
            id: 123,
            url: 'https://example.com',
            title: 'Example Page (DEV MODE)',
            favIconUrl: 'https://www.google.com/favicon.ico',
          } as chrome.tabs.Tab);
        }
      } catch (error) {
        console.error('Error getting tab:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentTab();
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

  const handleDelay = async (): Promise<void> => {
    if (!activeTab || !activeTab.id) return;

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

    // Create the delayed tab info
    const tabInfo: DelayedTab = {
      id: activeTab.id,
      url: activeTab.url,
      title: activeTab.title,
      favicon: activeTab.favIconUrl,
      createdAt: Date.now(),
      wakeTime: firstWakeTime.getTime(),
      recurrencePattern,
    };

    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      // Save to storage
      chrome.storage.local.get({ delayedTabs: [] }, async (data) => {
        const { delayedTabs } = data;
        delayedTabs.push(tabInfo);
        await chrome.storage.local.set({ delayedTabs });

        // Create alarm for this tab
        if (chrome.alarms) {
          await chrome.alarms.create(`delayed-tab-${tabInfo.id}`, {
            when: firstWakeTime.getTime(),
          });
        }

        // Close the tab
        if (chrome.tabs) {
          await chrome.tabs.remove(tabInfo.id);
        }

        // Close the popup
        if (window.close) {
          window.close();
        }
      });
    } else {
      console.log('Development mode - tab would be delayed:', tabInfo);
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

        {activeTab && (
          <div className='mb-4 flex items-center rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'>
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
              !activeTab ||
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
