import React, { useState } from 'react';
import {
  faArrowLeft,
  faArrowRight,
  faCalendarAlt,
  faClock,
  faCog,
  faHourglassHalf,
  faRepeat,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    // Save to localStorage that the tutorial has been completed
    localStorage.setItem('onboardingCompleted', 'true');
    onComplete();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className='flex flex-col items-center text-center'>
            <div className='mb-6 text-5xl text-primary'>
              <FontAwesomeIcon icon={faHourglassHalf} />
            </div>
            <h2 className='mb-4 text-2xl font-bold'>
              {t('onboarding.welcome.title')}
            </h2>
            <p className='mb-4 text-lg'>
              {t('onboarding.welcome.description')}
            </p>
          </div>
        );
      case 1:
        return (
          <div className='flex flex-col items-center text-center'>
            <div className='mb-6 text-5xl text-primary'>
              <FontAwesomeIcon icon={faClock} />
            </div>
            <h2 className='mb-4 text-2xl font-bold'>
              {t('onboarding.delayOptions.title')}
            </h2>
            <p className='mb-4 text-lg'>
              {t('onboarding.delayOptions.description')}
            </p>
            <div className='w-full max-w-xs rounded-lg bg-base-200 p-3'>
              <ul className='space-y-2 text-left text-base'>
                <li>{t('popup.delayOptions.laterToday', { hours: 3 })}</li>
                <li>{t('popup.delayOptions.tomorrow', { time: '09:00' })}</li>
                <li>
                  {t('popup.delayOptions.weekend', {
                    day: t('popup.weekdays.saturday'),
                    time: '09:00',
                  })}
                </li>
              </ul>
            </div>
          </div>
        );
      case 2:
        return (
          <div className='flex flex-col items-center text-center'>
            <div className='mb-6 text-5xl text-primary'>
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <h2 className='mb-4 text-2xl font-bold'>
              {t('onboarding.customDelay.title')}
            </h2>
            <p className='mb-4 text-lg'>
              {t('onboarding.customDelay.description')}
            </p>
            <div className='flex w-full max-w-xs justify-center rounded-lg bg-base-200 p-3'>
              <div className='badge badge-primary'>
                {t('popup.delayOptions.custom')}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className='flex flex-col items-center text-center'>
            <div className='mb-6 text-5xl text-primary'>
              <FontAwesomeIcon icon={faRepeat} />
            </div>
            <h2 className='mb-4 text-2xl font-bold'>
              {t('onboarding.recurring.title')}
            </h2>
            <p className='mb-4 text-lg'>
              {t('onboarding.recurring.description')}
            </p>
            <div className='flex w-full max-w-xs justify-center rounded-lg bg-base-200 p-3'>
              <div className='badge badge-primary'>
                {t('popup.delayOptions.recurring')}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className='flex flex-col items-center text-center'>
            <div className='mb-6 text-5xl text-primary'>
              <FontAwesomeIcon icon={faCog} />
            </div>
            <h2 className='mb-4 text-2xl font-bold'>
              {t('onboarding.settings.title')}
            </h2>
            <p className='mb-4 text-lg'>
              {t('onboarding.settings.description')}
            </p>
            <div className='w-full max-w-xs rounded-lg bg-base-200 p-3'>
              <p className='mb-2 text-base'>
                {t('onboarding.settings.gearClick')}
                <br />
                <br />
                ou
                <br />
                <br />
                {t('onboarding.settings.rightClick')}
              </p>
              <div className='flex justify-center'>
                <div className='badge badge-primary'>
                  {t('common.settings')}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-base-100 bg-opacity-95 p-4'>
      <div className='relative w-full max-w-md rounded-lg border-2 border-primary bg-base-100 bg-base-200 p-6 shadow-lg'>
        <button
          onClick={completeOnboarding}
          className='btn btn-circle btn-error btn-sm absolute right-2 top-2 text-white'
          aria-label={t('onboarding.close')}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className='flex min-h-[300px] flex-col justify-between'>
          <div className='mb-8'>{renderStep()}</div>

          <div className='mt-4 flex items-center justify-between'>
            <div>
              {currentStep > 0 && (
                <button onClick={prevStep} className='btn btn-outline btn-sm'>
                  <FontAwesomeIcon icon={faArrowLeft} className='mr-2' />
                  {t('onboarding.back')}
                </button>
              )}
            </div>

            <div className='flex space-x-1'>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${currentStep === index ? 'bg-primary' : 'bg-base-300'}`}
                />
              ))}
            </div>

            <div>
              <button onClick={nextStep} className='btn btn-primary btn-sm'>
                {currentStep < totalSteps - 1
                  ? t('onboarding.next')
                  : t('onboarding.finish')}
                {currentStep < totalSteps - 1 && (
                  <FontAwesomeIcon icon={faArrowRight} className='ml-2' />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
