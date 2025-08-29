/**
 * Composant ViewToggle - Bascule entre modes d'affichage
 * 
 * Permet aux utilisateurs de basculer entre l'affichage en grille
 * et l'affichage carte pour consulter les zones industrielles.
 * 
 * Interface sous forme de boutons radio avec :
 * - Bouton Grille : Affichage en cartes/vignettes
 * - Bouton Carte : Affichage sur carte interactive Leaflet
 * - État visuel clair avec icônes et couleurs distinctives
 * - Transition fluide entre les modes
 * 
 * Intègre parfaitement avec les composants ZoneGrid et MapView
 * pour offrir une expérience utilisateur flexible.
 * 
 * @param currentView Mode d'affichage actuellement actif
 * @param onViewChange Callback appelé lors du changement de mode
 * @param className Classes CSS supplémentaires optionnelles
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Map, Grid3X3 } from 'lucide-react'

/**
 * Mode d'affichage disponibles
 */
type ViewMode = 'grid' | 'map'

/**
 * Props du composant ViewToggle
 */
interface ViewToggleProps {
  /** Mode d'affichage actuellement sélectionné */
  currentView: ViewMode
  /** Callback de changement de mode */
  onViewChange: (view: ViewMode) => void
  /** Classes CSS supplémentaires */
  className?: string
}

export default function ViewToggle({ currentView, onViewChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex items-center gap-2 bg-gray-100 p-1 rounded-lg ${className}`}>
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={`px-4 py-2 ${
          currentView === 'grid' 
            ? 'bg-white shadow-sm text-gray-900' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
        }`}
      >
        <Grid3X3 className="w-4 h-4 mr-2" />
        Grille
      </Button>
      <Button
        variant={currentView === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('map')}
        className={`px-4 py-2 ${
          currentView === 'map' 
            ? 'bg-white shadow-sm text-gray-900' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
        }`}
      >
        <Map className="w-4 h-4 mr-2" />
        Carte
      </Button>
    </div>
  )
}