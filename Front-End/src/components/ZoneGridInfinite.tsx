"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Factory } from 'lucide-react'
import { fetchApi } from '@/lib/utils'
import type { ListResponse } from '@/types'
import ZoneCard from './ZoneCard'
import LoadingSpinner from './LoadingSpinner'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

const ZONES_PER_PAGE = 12
const MAX_TOTAL_ZONES = 100 // Limite pour éviter les problèmes de performance

interface IndustrialZone {
  id: string
  name: string
  description: string
  location: string
  area: string
  price: string
  type: string
  status: string
  deliveryDate?: string
  image?: string
}

export default function ZoneGridInfinite() {
  const [allZones, setAllZones] = useState<IndustrialZone[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadZones = useCallback(async (page: number, isLoadingMore = false) => {
    if (isLoadingMore) {
      setIsFetchingMore(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    
    try {
      const response = await fetchApi<ListResponse<IndustrialZone>>(
        `/api/zones?page=${page}&limit=${ZONES_PER_PAGE}`
      )

      if (response) {
        let zonesData: IndustrialZone[] = Array.isArray(response.items)
          ? response.items
          : Array.isArray(response)
            ? (response as unknown as IndustrialZone[])
            : []

        if (isLoadingMore) {
          setAllZones(prev => {
            const newZones = [...prev, ...zonesData]
            // Limiter le nombre total de zones pour éviter les problèmes de performance
            return newZones.slice(0, MAX_TOTAL_ZONES)
          })
        } else {
          setAllZones(zonesData)
        }

        const totalPages = response.totalPages || Math.ceil(zonesData.length / ZONES_PER_PAGE) || 1
        const hasMore = page < totalPages && allZones.length + zonesData.length < MAX_TOTAL_ZONES
        setHasNextPage(hasMore)
      } else {
        // Données de fallback
        const fallbackData = [
          {
            id: 'demo-1',
            name: 'Zone Industrielle Demo',
            description: 'Zone de démonstration avec toutes les commodités nécessaires pour votre activité industrielle.',
            location: 'Casablanca, Maroc',
            area: '10,000 m²',
            price: '2,500 DH/m²',
            type: 'Zone Privée',
            status: 'Disponible'
          },
          {
            id: 'demo-2',
            name: 'Parc Technologique Rabat',
            description: 'Espace moderne dédié aux technologies et à l\'innovation avec infrastructures de pointe.',
            location: 'Rabat-Salé, Maroc',
            area: '15,000 m²',
            price: '3,200 DH/m²',
            type: 'Parc Technologique',
            status: 'Disponible'
          }
        ]

        if (isLoadingMore) {
          setAllZones(prev => [...prev, ...fallbackData])
        } else {
          setAllZones(fallbackData)
        }
        setHasNextPage(false)
      }
    } catch (err) {
      setError('Erreur de chargement des zones')
      if (!isLoadingMore && allZones.length === 0) {
        setAllZones([
          {
            id: 'fallback-1',
            name: 'Zone Exemple',
            description: 'Données de démonstration - Contactez-nous pour plus d\'informations.',
            location: 'Maroc',
            area: '5,000 m²',
            price: 'Prix sur demande',
            type: 'Zone Industrielle',
            status: 'Disponible'
          }
        ])
      }
      setHasNextPage(false)
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [allZones.length])

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      loadZones(nextPage, true)
    }
  }, [currentPage, hasNextPage, isFetchingMore, loadZones])

  useEffect(() => {
    loadZones(1, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { isFetching } = useInfiniteScroll(fetchNextPage, {
    hasNextPage,
    isFetchingNextPage: isFetchingMore,
    threshold: 0.8
  })

  const handleRetry = useCallback(() => {
    setCurrentPage(1)
    setAllZones([])
    setHasNextPage(true)
    loadZones(1, false)
  }, [loadZones])

  const safeZones = useMemo(() => Array.isArray(allZones) ? allZones : [], [allZones])

  if (isLoading && safeZones.length === 0) {
    return (
      <LoadingSpinner 
        size="lg"
        message="Chargement des zones industrielles..."
        className="py-16"
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header avec compteur */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {safeZones.length > 0 ? `${safeZones.length} zone${safeZones.length > 1 ? 's' : ''} disponible${safeZones.length > 1 ? 's' : ''}` : 'Zones industrielles'}
          {safeZones.length >= MAX_TOTAL_ZONES && (
            <span className="text-sm text-gray-500 block mt-1">
              (Affichage limité à {MAX_TOTAL_ZONES} zones pour optimiser les performances)
            </span>
          )}
        </h2>
        <p className="text-gray-600">
          Trouvez l'espace idéal pour développer votre activité industrielle
        </p>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}. Les données affichées sont des exemples.
          </div>
        )}
      </div>

      {/* Grille de cartes optimisée avec scroll infini */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {safeZones.map((zone, index) => (
          <ZoneCard key={`${zone.id}-${index}`} zone={zone} />
        ))}
      </div>

      {/* Message si pas de zones */}
      {safeZones.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Factory className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune zone disponible</h3>
          <p className="text-gray-500 mb-6">
            Nous n'avons trouvé aucune zone correspondant à vos critères.
          </p>
          <Button 
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Indicateur de chargement pour le scroll infini */}
      {isFetchingMore && (
        <div className="flex justify-center py-8">
          <LoadingSpinner 
            size="md"
            message="Chargement de plus de zones..."
          />
        </div>
      )}

      {/* Message de fin si plus de pages */}
      {!hasNextPage && safeZones.length > 0 && (
        <div className="text-center py-8 border-t">
          <p className="text-gray-500">
            {safeZones.length >= MAX_TOTAL_ZONES 
              ? `Vous avez atteint la limite d'affichage de ${MAX_TOTAL_ZONES} zones.`
              : 'Vous avez vu toutes les zones disponibles.'
            }
          </p>
        </div>
      )}
    </div>
  )
}