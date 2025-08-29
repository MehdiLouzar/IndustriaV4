/**
 * Composant Providers - Fournisseurs de contexte globaux
 * 
 * Configure et fournit les contextes nécessaires à l'application :
 * - Internationalisation (i18n) avec react-i18next
 * - Configuration côté client de i18n au montage
 * - Monitoring d'urgence pour la surveillance applicative
 * 
 * Ce composant wraps l'application entière et doit être placé
 * au plus haut niveau de l'arbre de composants pour assurer
 * la disponibilité des contextes partout.
 * 
 * @param children Composants enfants à wrapper avec les providers
 * @returns Application wrappée avec tous les contextes
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

'use client';

import { I18nextProvider } from 'react-i18next'
import i18n, { setupClientI18n } from '../i18n'
import { useEffect } from 'react'
import '../i18n'
import '../lib/emergency-monitor'

/**
 * Props du composant Providers
 */
interface ProvidersProps {
  /** Composants enfants à entourer des providers */
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    setupClientI18n()
  }, [])
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
