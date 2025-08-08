"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Map, Grid3X3 } from 'lucide-react'

type ViewMode = 'grid' | 'map'

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
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