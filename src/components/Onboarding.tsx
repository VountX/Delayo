import {
  faArrowLeft,
  faArrowRight,
  faCalendarAlt,
  faClock,
  faCog,
  faHourglassHalf,
  faRepeat,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
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
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl mb-6 text-primary">
              <FontAwesomeIcon icon={faHourglassHalf} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{t('onboarding.welcome.title')}</h2>
            <p className="mb-4 text-lg">{t('onboarding.welcome.description')}</p>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl mb-6 text-primary">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{t('onboarding.delayOptions.title')}</h2>
            <p className="mb-4 text-lg">{t('onboarding.delayOptions.description')}</p>
            <div className="bg-base-200 p-3 rounded-lg w-full max-w-xs">
              <ul className="text-left space-y-2 text-base">
                <li>{t('popup.delayOptions.laterToday', { hours: 3 })}</li>
                <li>{t('popup.delayOptions.tomorrow', { time: '09:00' })}</li>
                <li>{t('popup.delayOptions.weekend', { day: t('popup.weekdays.saturday'), time: '09:00' })}</li>
              </ul>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl mb-6 text-primary">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{t('onboarding.customDelay.title')}</h2>
            <p className="mb-4 text-lg">{t('onboarding.customDelay.description')}</p>
            <div className="bg-base-200 p-3 rounded-lg w-full max-w-xs flex justify-center">
              <div className="badge badge-primary">{t('popup.delayOptions.custom')}</div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl mb-6 text-primary">
              <FontAwesomeIcon icon={faRepeat} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{t('onboarding.recurring.title')}</h2>
            <p className="mb-4 text-lg">{t('onboarding.recurring.description')}</p>
            <div className="bg-base-200 p-3 rounded-lg w-full max-w-xs flex justify-center">
              <div className="badge badge-primary">{t('popup.delayOptions.recurring')}</div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl mb-6 text-primary">
              <FontAwesomeIcon icon={faCog} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{t('onboarding.settings.title')}</h2>
            <p className="mb-4 text-lg">{t('onboarding.settings.description')}</p>
            <div className="bg-base-200 p-3 rounded-lg w-full max-w-xs">
              <p className="text-base mb-2">
                {t('onboarding.settings.gearClick')}
                <br /><br />
                ou
                <br /><br />
                {t('onboarding.settings.rightClick')}
              </p>
              <div className="flex justify-center">
                <div className="badge badge-primary">{t('common.settings')}</div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-base-100 bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg shadow-lg max-w-md w-full p-6 relative border-2 border-primary bg-base-200">
        <button 
          onClick={completeOnboarding} 
          className="btn btn-sm btn-circle absolute right-2 top-2 btn-error text-white"
          aria-label={t('onboarding.close')}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <div className="min-h-[300px] flex flex-col justify-between">
          <div className="mb-8">
            {renderStep()}
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div>
              {currentStep > 0 && (
                <button 
                  onClick={prevStep} 
                  className="btn btn-outline btn-sm"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  {t('onboarding.back')}
                </button>
              )}
            </div>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${currentStep === index ? 'bg-primary' : 'bg-base-300'}`}
                />
              ))}
            </div>
            
            <div>
              <button 
                onClick={nextStep} 
                className="btn btn-primary btn-sm"
              >
                {currentStep < totalSteps - 1 ? t('onboarding.next') : t('onboarding.finish')}
                {currentStep < totalSteps - 1 && <FontAwesomeIcon icon={faArrowRight} className="ml-2" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;