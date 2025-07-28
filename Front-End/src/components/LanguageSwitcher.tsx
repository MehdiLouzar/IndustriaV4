'use client';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    if (typeof document !== 'undefined') {
      document.cookie = `lng=${lng};path=/`;
    }
  };

  return (
    <div className="flex gap-1 text-sm">
      <button
        onClick={() => changeLanguage('fr')}
        className={i18n.language === 'fr' ? 'font-bold underline' : ''}
      >
        FR
      </button>
      <span>|</span>
      <button
        onClick={() => changeLanguage('en')}
        className={i18n.language === 'en' ? 'font-bold underline' : ''}
      >
        EN
      </button>
    </div>
  );
}
