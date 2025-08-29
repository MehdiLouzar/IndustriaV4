/**
 * Composant LanguageSwitcher - Sélecteur de langue international
 * 
 * Permet aux utilisateurs de basculer entre le français et l'anglais
 * avec persistence de la préférence via cookie.
 * 
 * Intègre react-i18next pour :
 * - Changement dynamique de langue sans rechargement
 * - Sauvegarde automatique en cookie pour les visites futures
 * - Interface visuelle simple avec indication de la langue active
 * 
 * Supporte l'internationalisation complète de l'application
 * Industria pour les marchés marocain et international.
 * 
 * @returns Composant React du sélecteur de langue
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

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
