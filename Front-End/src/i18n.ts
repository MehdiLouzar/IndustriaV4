import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

const resources = { en: { translation: en }, fr: { translation: fr } } as const;

function getCookieLang() {
  if (typeof window === 'undefined') {
    try {
      // Read cookie on the server using next/headers
      // wrapped in a dynamic require so it is not bundled for the client
      const { cookies } = require('next/headers');
      const lang = cookies().get('lng')?.value;
      return lang || 'fr';
    } catch {
      return 'fr';
    }
  }
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
