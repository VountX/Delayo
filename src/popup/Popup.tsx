import React, { useEffect, useState } from 'react';
import '../i18n';

import Onboarding from '../components/Onboarding';
import useTheme from '../utils/useTheme';
import Router from './router';

function Popup(): React.ReactElement {
  useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Router />
    </>
  );
}

export default Popup;
