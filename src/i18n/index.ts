import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import vi from './locales/vi.json';

export const defaultNS = 'translation';
export const resources = {
  en: {
    translation: en,
  },
  vi: {
    translation: vi,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'ddl-tool-language',
      caches: ['localStorage'],
    },
  });

export default i18n;