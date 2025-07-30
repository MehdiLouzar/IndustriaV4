import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/translation.json'
import fr from './locales/fr/translation.json'

const resources = { en: { translation: en }, fr: { translation: fr } } as const

// Synchronous initialization so rendering is not blocked
i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

// Non blocking language preference loading
if (typeof window !== 'undefined') {
  const savedLang =
    localStorage.getItem('lng') ||
    document.cookie.match(/(?:^|; )lng=([^;]*)/i)?.[1] ||
    'fr'
  if (savedLang && savedLang !== i18n.language) {
    i18n.changeLanguage(savedLang)
  }
}

export default i18n
