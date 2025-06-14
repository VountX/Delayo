import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import DonationButton from '../../../components/DonationButton';
import DelaySettingsComponent from '../../options/DelaySettings';
import useTheme from '../../../utils/useTheme';

function SettingsView(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

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
            <h2 className='card-title font-bold text-delayo-orange'>{t('common.settings')}</h2>
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

        <div className='flex flex-col'>
          <div className='overflow-y-auto max-h-[350px] pr-2 pb-2'>
            <DelaySettingsComponent isPopup={true} />
          </div>
          
          <div className='mt-4 flex justify-center border-t border-base-200 pt-3'>
            <DonationButton isCompact={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;