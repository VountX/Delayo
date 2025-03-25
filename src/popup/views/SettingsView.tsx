import React from 'react';
import { Link } from '@tanstack/react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import useTheme from '../../utils/useTheme';
import DelaySettings from '../../options/DelaySettings';

function SettingsView(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();

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
            <h2 className='card-title font-bold text-delayo-orange'>Configurações</h2>
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

        <div className='overflow-y-auto max-h-[400px] pr-2 pb-2'>
          <DelaySettings />
        </div>
      </div>
    </div>
  );
}

export default SettingsView;