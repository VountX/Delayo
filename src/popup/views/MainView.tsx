// filepath: /home/burkhard/Code/delayo/src/popup/views/MainView.tsx
import React, { useEffect, useState } from 'react';
import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import { DelayOption } from '@types';

import useTheme from '../../utils/useTheme';

// Definição do tipo para as configurações de adiamento
interface DelaySettings {
  laterToday: number; // horas
  tonightTime: string; // formato HH:MM
  tomorrowTime: string; // formato HH:MM
  weekendDay: 'saturday' | 'sunday';
  weekendTime: string; // formato HH:MM
  nextWeekDay: number; // 0-6 (0 = domingo, 1 = segunda, etc.)
  nextWeekTime: string; // formato HH:MM
  nextMonthSameDay: boolean; // se true, mesmo dia do mês; se false, mesmo dia da semana
  somedayMinMonths: number; // mínimo de meses para "Um Dia"
  somedayMaxMonths: number; // máximo de meses para "Um Dia"
}

function MainView(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DelaySettings>({
    laterToday: 3, // 3 horas mais tarde
    tonightTime: '18:00', // 18h
    tomorrowTime: '09:00', // 9h
    weekendDay: 'saturday',
    weekendTime: '09:00', // 9h
    nextWeekDay: 1, // Segunda-feira
    nextWeekTime: '09:00', // 9h
    nextMonthSameDay: true,
    somedayMinMonths: 3, // mínimo 3 meses
    somedayMaxMonths: 12, // máximo 12 meses
  });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const getCurrentTab = async (): Promise<void> => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          setActiveTab(tab);
        } else {
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

  // Carrega as configurações salvas
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

  // Função para extrair horas e minutos de uma string no formato HH:MM
  const getTimeFromString = (
    timeString: string
  ): { hours: number; minutes: number } => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  };

  const delayOptions: DelayOption[] = [
    {
      id: 'later_today',
      label: `Mais Tarde (em ${settings.laterToday}h)`,
      hours: settings.laterToday,
    },
    {
      id: 'tonight',
      label: `Esta Noite (às ${settings.tonightTime})`,
      custom: true,
      calculateTime: () => {
        const { hours, minutes } = getTimeFromString(settings.tonightTime);
        const today = new Date();
        today.setHours(hours, minutes, 0, 0);
        // Se já passou do horário configurado, retorna o horário atual + 1 hora
        if (today.getTime() < Date.now()) {
          return Date.now() + 60 * 60 * 1000;
        }
        return today.getTime();
      },
    },
    {
      id: 'tomorrow',
      label: `Amanhã (às ${settings.tomorrowTime})`,
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
      label: `Este Fim de Semana (${settings.weekendDay === 'saturday' ? 'Sábado' : 'Domingo'}, ${settings.weekendTime})`,
      custom: true,
      calculateTime: () => {
        const { hours, minutes } = getTimeFromString(settings.weekendTime);
        const today = new Date();
        const currentDay = today.getDay(); // 0 é Domingo, 6 é Sábado
        const targetDay = settings.weekendDay === 'saturday' ? 6 : 0;

        // Calcula quantos dias faltam até o dia alvo
        let daysUntilTarget;
        if (currentDay === targetDay) {
          // Se hoje já é o dia alvo, vai para o próximo
          daysUntilTarget = 7;
        } else if (currentDay < targetDay) {
          // Se o dia alvo ainda não chegou esta semana
          daysUntilTarget = targetDay - currentDay;
        } else {
          // Se o dia alvo já passou esta semana
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
      label: `Próxima Semana (${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][settings.nextWeekDay]}, ${settings.nextWeekTime})`,
      custom: true,
      calculateTime: () => {
        const { hours, minutes } = getTimeFromString(settings.nextWeekTime);
        const today = new Date();
        const currentDay = today.getDay(); // 0 é Domingo, 1 é Segunda
        const targetDay = settings.nextWeekDay;

        // Calcula quantos dias faltam até o dia alvo na próxima semana
        let daysUntilTarget;
        if (currentDay === targetDay) {
          // Se hoje já é o dia alvo, vai para o próximo na semana que vem
          daysUntilTarget = 7;
        } else if (currentDay < targetDay) {
          // Se o dia alvo ainda não chegou esta semana, vai para a próxima semana
          daysUntilTarget = targetDay - currentDay + 7;
        } else {
          // Se o dia alvo já passou esta semana, vai para a próxima semana
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
      label: 'Próximo Mês',
      custom: true,
      calculateTime: () => {
        const today = new Date();
        const targetDate = new Date();

        if (settings.nextMonthSameDay) {
          // Mesmo dia do mês seguinte
          targetDate.setMonth(today.getMonth() + 1);
          // Verifica se o dia existe no próximo mês (ex: 31 de janeiro -> 28/29 de fevereiro)
          const lastDayOfNextMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 2,
            0
          ).getDate();
          if (today.getDate() > lastDayOfNextMonth) {
            targetDate.setDate(lastDayOfNextMonth);
          }
        } else {
          // Mesmo dia da semana no próximo mês
          const currentDay = today.getDay();
          const currentWeekOfMonth = Math.ceil(today.getDate() / 7);

          // Avança para o próximo mês
          targetDate.setMonth(today.getMonth() + 1);
          // Define o dia 1 do próximo mês
          targetDate.setDate(1);

          // Encontra o primeiro dia da semana correspondente no próximo mês
          while (targetDate.getDay() !== currentDay) {
            targetDate.setDate(targetDate.getDate() + 1);
          }

          // Avança para a semana correspondente
          targetDate.setDate(
            targetDate.getDate() + (currentWeekOfMonth - 1) * 7
          );

          // Verifica se ainda estamos no mesmo mês
          if (targetDate.getMonth() !== (today.getMonth() + 1) % 12) {
            // Se passou para o mês seguinte, volta para a última ocorrência do dia da semana no mês desejado
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

        // Mantém a mesma hora do dia
        targetDate.setHours(today.getHours(), today.getMinutes(), 0, 0);
        return targetDate.getTime();
      },
    },
    {
      id: 'someday',
      label: 'Um Dia (Aleatório)',
      custom: true,
      calculateTime: () => {
        const today = new Date();
        const minMonths = settings.somedayMinMonths;
        const maxMonths = settings.somedayMaxMonths;

        // Gera um número aleatório de meses entre min e max
        const randomMonths =
          Math.floor(Math.random() * (maxMonths - minMonths + 1)) + minMonths;

        // Gera um número aleatório de dias entre 0 e 30
        const randomDays = Math.floor(Math.random() * 30);

        const targetDate = new Date();
        targetDate.setMonth(today.getMonth() + randomMonths);
        targetDate.setDate(today.getDate() + randomDays);

        // Mantém a mesma hora do dia
        return targetDate.getTime();
      },
    },
  ];

  const handleDelay = async (option: DelayOption): Promise<void> => {
    if (!activeTab || !activeTab.id) return;

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
    <div className='card w-[36rem] rounded-xl bg-base-100 shadow-md'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <h2 className='card-title flex items-center font-medium text-delayo-orange'>
            <FontAwesomeIcon
              icon={faHourglassHalf}
              className='mr-2 h-5 w-5 text-delayo-orange'
            />
            Delayo
          </h2>
          <button
            type='button'
            className='btn btn-circle btn-ghost btn-sm transition-all duration-200 hover:bg-base-200'
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
            <div className='truncate text-sm font-medium text-base-content/80'>
              {activeTab.title}
            </div>
          </div>
        )}

        <div className='grid grid-cols-3 gap-2.5'>
          {delayOptions.slice(0, 7).map((option) => (
            <div key={option.id} className='card'>
              <button
                type='button'
                className='group btn h-24 flex-col items-center justify-center rounded-xl border-none bg-base-200/70 p-3 shadow-sm transition-all duration-200 hover:bg-base-200'
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

          {/* Custom Date/Time button */}
          <div className='card'>
            <Link
              to='/custom-delay'
              className='group btn h-24 flex-col items-center justify-center rounded-xl border-none bg-base-200/70 p-3 shadow-sm transition-all duration-200 hover:bg-base-200'
              viewTransition={{ types: ['slide-left'] }}
            >
              <FontAwesomeIcon
                icon='calendar-days'
                className='mb-3 h-5 w-5 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
              />
              <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                Escolher Data/Hora
              </span>
            </Link>
          </div>

          {/* Recurring Delay button */}
          <div className='card'>
            <Link
              to='/recurring-delay'
              className='group btn h-24 flex-col items-center justify-center rounded-xl border-none bg-base-200/70 p-3 shadow-sm transition-all duration-200 hover:bg-base-200'
              viewTransition={{ types: ['slide-left'] }}
            >
              <FontAwesomeIcon
                icon='repeat'
                className='mb-3 h-5 w-5 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
              />
              <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                Adiamento Recorrente
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainView;
