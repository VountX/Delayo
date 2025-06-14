import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';


const getInputClasses = (isPopup: boolean): string => {
  return `input input-bordered ${isPopup ? 'rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100 h-12' : ''}`;
};
const getRadioClasses = (isPopup: boolean): string => {
  return `radio radio-primary ${isPopup ? 'transition-all duration-200' : ''}`;
};
const getSelectClasses = (isPopup: boolean): string => {
  return `select select-bordered ${isPopup ? 'rounded-lg bg-base-100/70 shadow-sm transition-all duration-200 hover:bg-base-100' : ''}`;
};

interface DelaySettings {
  laterToday: number; // hours
  tonightTime: string; // format HH:MM
  tomorrowTime: string; // format HH:MM
  weekendDay: 'saturday' | 'sunday';
  weekendTime: string; // format HH:MM
  nextWeekSameDay: boolean; // if true, same day of week; if false, specific day of week
  nextWeekDay: number; // 0-6 (0 = Sunday, 1 = Monday, etc.)
  nextWeekTime: string; // format HH:MM
  nextMonthSameDay: boolean; // if true, same day of month; if false, same day of week
  somedayMinMonths: number; // minimum months for "Someday"
  somedayMaxMonths: number; // maximum months for "Someday"
}

// Default values for settings
const defaultSettings: DelaySettings = {
  laterToday: 3,
  tonightTime: '18:00',
  tomorrowTime: '09:00',
  weekendDay: 'saturday',
  weekendTime: '09:00',
  nextWeekSameDay: false,
  nextWeekDay: 1, // Monday
  nextWeekTime: '09:00',
  nextMonthSameDay: true,
  somedayMinMonths: 3,
  somedayMaxMonths: 12,
};

interface DelaySettingsComponentProps {
  isPopup?: boolean;
}

function DelaySettingsComponent({ isPopup = false }: DelaySettingsComponentProps): React.ReactElement {
  const [settings, setSettings] = useState<DelaySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        setLoading(true);
        const { delaySettings = defaultSettings } =
          await chrome.storage.local.get('delaySettings');
        setSettings(delaySettings);
        } catch (error) {
          // Handle error while loading settings
        } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to local storage
  const saveSettings = async (): Promise<void> => {
    try {
      await chrome.storage.local.set({ delaySettings: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      // Handle error while saving settings
    }
  };

  const resetSettings = (): void => {
    setSettings(defaultSettings);
  };

  // Update a specific delay setting value
  const updateSetting = <K extends keyof DelaySettings>(
    key: K,
    value: DelaySettings[K]
  ): void => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className='p-8 text-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className={`card w-full max-w-4xl mx-auto bg-base-300 ${!isPopup ? 'border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-300' : ''}`}>
      <div className='card-body p-6 sm:p-8'>
        <h2 className='card-title mb-4'>{t('settings.defaultDelayOptions')}</h2>

        <div className='space-y-4'>
          {/* Later Today */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.laterToday')}</span>
            </label>
            <div className='flex items-center'>
              <input
                type='number'
                className={`${getInputClasses(isPopup)} w-20`}
                min='1'
                max='12'
                value={settings.laterToday}
                onChange={(e) =>
                  updateSetting('laterToday', parseInt(e.target.value, 10) || 1)
                }
              />
              <span className='ml-2'>{t('settings.hours')}</span>
            </div>
          </div>

          {/* Tonight */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.tonight')}</span>
            </label>
            <div className='relative'>
              <input
                type='time'
                className={`${getInputClasses(isPopup)} w-full max-w-72`}
                value={settings.tonightTime}
                onChange={(e) => updateSetting('tonightTime', e.target.value)}
                style={{ appearance: 'none' }}
              />
            </div>
          </div>

          {/* Tomorrow */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.tomorrow')}</span>
            </label>
            <div className='relative'>
              <input
                type='time'
                className={`${getInputClasses(isPopup)} w-full max-w-72`}
                value={settings.tomorrowTime}
                onChange={(e) => updateSetting('tomorrowTime', e.target.value)}
                style={{ appearance: 'none' }}
              />
            </div>
          </div>

          {/* This Weekend */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.weekend')}</span>
            </label>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <select
                className={`${getSelectClasses(isPopup)} w-full max-w-72`}
                value={settings.weekendDay}
                onChange={(e) =>
                  updateSetting(
                    'weekendDay',
                    e.target.value as 'saturday' | 'sunday'
                  )
                }
              >
                <option value='saturday'>{t('popup.weekdays.saturday')}</option>
                <option value='sunday'>{t('popup.weekdays.sunday')}</option>
              </select>
              <div className='relative'>
                <input
                  type='time'
                  className={`${getInputClasses(isPopup)} w-full max-w-72`}
                  value={settings.weekendTime}
                  onChange={(e) => updateSetting('weekendTime', e.target.value)}
                  style={{ appearance: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Next Week */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.nextWeek')}</span>
            </label>
            <div className='flex items-center mb-2'>
              <div className='form-control'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextWeekOption'
                    className={getRadioClasses(isPopup)}
                    checked={settings.nextWeekSameDay}
                    onChange={() => updateSetting('nextWeekSameDay', true)}
                  />
                  <span className='label-text ml-2'>{t('settings.sameDayOfWeek', 'Mesmo dia da semana')}</span>
                </label>
              </div>
              <div className='form-control ml-4'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextWeekOption'
                    className={getRadioClasses(isPopup)}
                    checked={!settings.nextWeekSameDay}
                    onChange={() => updateSetting('nextWeekSameDay', false)}
                  />
                  <span className='label-text ml-2'>{t('settings.specificDay', 'Dia específico')}</span>
                </label>
              </div>
            </div>
            
            {!settings.nextWeekSameDay && (
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                <select
                  className={`${getSelectClasses(isPopup)} w-full max-w-72`}
                  value={settings.nextWeekDay}
                  onChange={(e) =>
                    updateSetting('nextWeekDay', parseInt(e.target.value, 10))
                  }
                >
                  <option value='0'>{t('popup.weekdays.sunday')}</option>
                  <option value='1'>{t('popup.weekdays.monday')}</option>
                  <option value='2'>{t('popup.weekdays.tuesday')}</option>
                  <option value='3'>{t('popup.weekdays.wednesday')}</option>
                  <option value='4'>{t('popup.weekdays.thursday')}</option>
                  <option value='5'>{t('popup.weekdays.friday')}</option>
                  <option value='6'>{t('popup.weekdays.saturday')}</option>
                </select>
                <div className='relative'>
                  <input
                    type='time'
                    className={`${getInputClasses(isPopup)} w-full max-w-72`}
                    value={settings.nextWeekTime}
                    onChange={(e) => updateSetting('nextWeekTime', e.target.value)}
                    style={{ appearance: 'none' }}
                  />
                </div>
              </div>
            )}
            
            {/* Removed the time input for 'same day of the week' */}
          </div>

          {/* Next Month */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.nextMonth')}</span>
            </label>
            <div className='flex items-center'>
              <div className='form-control'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextMonthOption'
                    className={getRadioClasses(isPopup)}
                    checked={settings.nextMonthSameDay}
                    onChange={() => updateSetting('nextMonthSameDay', true)}
                  />
                  <span className='label-text ml-2'>{t('settings.sameDayOfMonth')}</span>
                </label>
              </div>
              <div className='form-control ml-4'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextMonthOption'
                    className={getRadioClasses(isPopup)}
                    checked={!settings.nextMonthSameDay}
                    onChange={() => updateSetting('nextMonthSameDay', false)}
                  />
                  <span className='label-text ml-2'>{t('settings.sameDayOfWeek')}</span>
                </label>
              </div>
            </div>
            {}
          </div>

          {/* Someday (Random) */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.someday')}</span>
            </label>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <div>
                <label className='label'>
                  <span className='label-text'>{t('settings.minMonths')}</span>
                </label>
                <input
                  type='number'
                  className={`${getInputClasses(isPopup)} w-20`}
                  min='1'
                  max='12'
                  value={settings.somedayMinMonths}
                  onChange={(e) =>
                    updateSetting(
                      'somedayMinMonths',
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                />
              </div>
              <div>
                <label className='label'>
                  <span className='label-text'>{t('settings.maxMonths')}</span>
                </label>
                <input
                  type='number'
                  className={`${getInputClasses(isPopup)} w-20`}
                  min={settings.somedayMinMonths + 1}
                  max='36'
                  value={settings.somedayMaxMonths}
                  onChange={(e) =>
                    updateSetting(
                      'somedayMaxMonths',
                      parseInt(e.target.value, 10) ||
                        settings.somedayMinMonths + 1
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className='card-actions mt-6 justify-end'>
          <button
            type='button'
            className='btn btn-outline'
            onClick={resetSettings}
          >
            {t('settings.reset')}
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={saveSettings}
          >
            {t('common.save')}
          </button>
        </div>

        {saved && (
          <div className='mt-4 text-center text-success'>
            {t('settings.saved', 'Configurações salvas com sucesso!')}
          </div>
        )}
      </div>
    </div>
  );
}

export default DelaySettingsComponent;
