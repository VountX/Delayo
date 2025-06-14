import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSelector(): React.ReactElement {
  const { i18n } = useTranslation();

  const changeLanguage = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);

    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ savedLanguage: newLanguage });
    }
  };

  return (
    <div className='form-control w-full max-w-xs'>
      <select
        className='select select-bordered w-full'
        value={i18n.language}
        onChange={changeLanguage}
      >
        <option value='en'>English</option>
        <option value='pt'>Português</option>
        <option value='es'>Español</option>
      </select>
    </div>
  );
}

export default LanguageSelector;
