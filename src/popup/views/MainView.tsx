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
  const [highlightedTabs, setHighlightedTabs] = useState<chrome.tabs.Tab[]>([]);
  const [allWindowTabs, setAllWindowTabs] = useState<chrome.tabs.Tab[]>([]);
  const [selectedMode, setSelectedMode] = useState<'active' | 'highlighted' | 'window'>('active');
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
    const getTabs = async (): Promise<void> => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
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
          
          // Definir o modo de seleção com base nas abas destacadas
          if (highlighted.length > 1) {
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

  const handleDelay = async (option: DelayOption): Promise<void> => {
    // Salvar o modo selecionado no armazenamento local para ser usado em outras telas
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

    // Obter as abas já adiadas
    await chrome.storage.local.get({ delayedTabs: [] }, async (data) => {
      const { delayedTabs } = data;
      const tabIds: number[] = [];
      
      // Processar cada aba a ser adiada
      for (const tab of tabsToDelay) {
        if (!tab.id) continue;
        
        const tabInfo = {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          favicon: tab.favIconUrl,
          createdAt: Date.now(),
          wakeTime,
        };

        // Adicionar à lista de abas adiadas
        delayedTabs.push(tabInfo);
        
        // Criar alarme para esta aba
        await chrome.alarms.create(`delayed-tab-${tabInfo.id}`, {
          when: wakeTime,
        });
        
        // Adicionar ID da aba à lista para fechar
        tabIds.push(tab.id);
      }
      
      // Salvar informações das abas adiadas
      await chrome.storage.local.set({ delayedTabs });

      // Fechar todas as abas
      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
      }

      // Fechar o popup
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
    <div className='card w-[40rem] rounded-none bg-base-300 shadow-md'>
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

        {/* Seletor de modo de adiamento */}
        <div className='mb-5 flex flex-col space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-base-content/80'>Adiar:</div>
            <div className='flex space-x-2'>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'active' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMode('active')}
              >
                Aba Ativa
              </button>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'highlighted' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMode('highlighted')}
                disabled={highlightedTabs.length <= 1}
              >
                Abas Selecionadas {highlightedTabs.length > 1 ? `(${highlightedTabs.length})` : ''}
              </button>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'window' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMode('window')}
              >
                Toda a Janela {allWindowTabs.length > 0 ? `(${allWindowTabs.length})` : ''}
              </button>
            </div>
          </div>
          
          {/* Exibição da aba ou abas selecionadas */}
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

          {/* Custom Date/Time button */}
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
                Escolher Data/Hora
              </span>
            </Link>
          </div>

          {/* Recurring Delay button */}
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
                Adiamento Recorrente
              </span>
            </Link>
          </div>
        </div>
        
        {/* Manage Delayed Tabs button */}
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
            Gerenciar Abas Adiadas
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MainView;
