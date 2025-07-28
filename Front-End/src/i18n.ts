import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

const resources = { en: { translation: en }, fr: { translation: fr } } as const;

function getCookieLang() {
  if (typeof document === 'undefined') return 'fr';
  const match = document.cookie.match(/(?:^|; )lng=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : 'fr';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getCookieLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
