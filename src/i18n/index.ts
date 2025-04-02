import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationPT from './locales/pt/translation.json';

const getSavedLanguage = async (): Promise<string | null> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const { savedLanguage } = await chrome.storage.local.get('savedLanguage');
      return savedLanguage || null;
    }
  } catch (error) {
    console.error('Error getting saved language:', error);
  }
  return null;
};

const resources = {
  en: {
    translation: translationEN
  },
  pt: {
    translation: translationPT
  },
  es: {
    translation: translationES
  }
};

const initI18n = async (): Promise<void> => {
  const savedLanguage = await getSavedLanguage();
  
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage || undefined,
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['navigator', 'localStorage'],
        caches: ['localStorage'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng',
      }
    });
};

initI18n();

export default i18n;