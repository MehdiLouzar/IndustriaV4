/**
 * Composant AdminHeader - En-tête simplifié pour les pages d'administration
 * 
 * Affiche un en-tête minimal avec uniquement un lien de retour vers
 * le dashboard principal d'administration. Utilisé dans les pages
 * de détail ou de gestion spécifiques.
 * 
 * Design volontairement épuré pour ne pas distraire l'utilisateur
 * de ses tâches administratives.
 * 
 * @returns Composant React de l'en-tête admin
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

'use client'

import Link from 'next/link'

export default function AdminHeader() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 h-12 flex items-center justify-end">
        <Link
          href="/admin"
          className="text-sm text-gray-700 hover:text-red-600"
        >
          Retour au dashboard
        </Link>
      </div>
    </header>
  )
}
