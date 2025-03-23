import React, { useEffect, useId, useState } from 'react';
import { Link } from '@tanstack/react-router';

import { RecurrencePattern, DelayedTab } from '@types';

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
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      setActiveTab(tab);
      setLoading(false);
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

    // For weekly or custom days, find the next occurrence
    if (recurrenceType === 'weekly' || recurrenceType === 'custom') {
      const currentDay = now.getDay();
      // Find the next day in our selected days
      const nextDayIndex = selectedDays.findIndex((day) => day > currentDay);

      if (nextDayIndex !== -1) {
        // We found a day later this week
        const daysToAdd = selectedDays[nextDayIndex] - currentDay;
        firstWakeTime.setDate(now.getDate() + daysToAdd);
      } else if (selectedDays.length > 0) {
        // All selected days are earlier in the week, go to next week
        const daysToAdd = 7 - currentDay + selectedDays[0];
        firstWakeTime.setDate(now.getDate() + daysToAdd);
      }
    }

    // Create the recurrence pattern
    const recurrencePattern: RecurrencePattern = {
      type: recurrenceType,
      time,
      daysOfWeek: selectedDays,
    };

    if (recurrenceType === 'monthly') {
      recurrencePattern.dayOfMonth = dayOfMonth;
    }

    if (endDate) {
      recurrencePattern.endDate = new Date(endDate).getTime();
    }

    const tabInfo: DelayedTab = {
      id: activeTab.id,
      url: activeTab.url,
      title: activeTab.title,
      favicon: activeTab.favIconUrl,
      createdAt: Date.now(),
      wakeTime: firstWakeTime.getTime(),
      isRecurring: true,
      recurrencePattern,
    };

    // Save delayed tab info to storage
    await chrome.storage.local.get({ delayedTabs: [] }, async (data) => {
      const { delayedTabs } = data;
      delayedTabs.push(tabInfo);
      await chrome.storage.local.set({ delayedTabs });

      // Create alarm for this tab
      await chrome.alarms.create(`delayed-tab-${tabInfo.id}`, {
        when: firstWakeTime.getTime(),
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
          <h2 className='card-title text-delayo-orange'>Repetidamente</h2>
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

        <form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
          <FormControl label='Padrão de Recorrência'>
            <select
              id={patternId}
              className='select select-bordered w-full'
              value={recurrenceType}
              onChange={(e) =>
                setRecurrenceType(e.target.value as RecurrencePattern['type'])
              }
              aria-label='Padrão de Recorrência'
            >
              <option value='daily'>Diariamente</option>
              <option value='weekdays'>Dias Úteis (Seg-Sex)</option>
              <option value='weekly'>Semanalmente</option>
              <option value='monthly'>Mensalmente</option>
              <option value='custom'>Personalizado</option>
            </select>
          </FormControl>

          <FormControl label='Horário'>
            <input
              id={timeId}
              type='time'
              className='input input-bordered w-full'
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label='Horário de despertar'
            />
          </FormControl>

          {(recurrenceType === 'weekly' || recurrenceType === 'custom') && (
            <FormControl label='Dias da Semana'>
              <div
                className='flex justify-between'
                role='group'
                aria-labelledby={daysOfWeekId}
              >
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type='button'
                    className={`btn btn-circle btn-sm ${
                      selectedDays.includes(day.value)
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                    onClick={() => toggleDay(day.value)}
                    aria-label={`${day.label} day`}
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
              <select
                id={dayOfMonthId}
                className='select select-bordered w-full'
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                aria-label='Dia do mês'
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </FormControl>
          )}

          <FormControl label='Data Final (Opcional)'>
            <input
              id={endDateId}
              type='date'
              className='input input-bordered w-full'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label='Data final'
            />
          </FormControl>

          <div className='card-actions mt-4'>
            <button
              type='button'
              className='btn btn-primary btn-block'
              onClick={handleDelay}
            >
              Definir Adiamento Recorrente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecurringDelayView;
