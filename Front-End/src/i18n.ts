import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr }
} as const;

async function getCookieLang(): Promise<string> {
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      const lang = cookieStore.get('lng')?.value;
      return lang || 'fr';
    } catch {
      return 'fr';
    }
  }

  const match = document.cookie.match(/(?:^|; )lng=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : 'fr';
}

// Fonction d'initialisation à appeler manuellement
export async function initI18n() {
  const lang = await getCookieLang();
  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
