// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',           // لو ما في ترجمة للغة الحالية
    debug: false,
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      // افتراضياً سيحاول تحميل /locales/{lng}/{ns}.json
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      // نبحث أولا في localStorage ثم الكوكيز ثم المتصفح
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
