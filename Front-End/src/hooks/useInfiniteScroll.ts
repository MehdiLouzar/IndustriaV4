"use client"

/**
 * Hook de défilement infini (infinite scroll)
 * 
 * Détecte automatiquement quand l'utilisateur approche du bas de page
 * et déclenche le chargement de données supplémentaires.
 * 
 * Utilisé pour l'affichage paginé des zones industrielles avec chargement
 * progressif pour améliorer les performances.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

import { useState, useEffect, useCallback } from 'react'

/**
 * Options de configuration du défilement infini
 */
interface UseInfiniteScrollOptions {
  /** Indique s'il reste des pages à charger */
  hasNextPage: boolean
  /** Indique si un chargement est déjà en cours */
  isFetchingNextPage: boolean
  /** Seuil de déclenchement (0.8 = 80% de la page) */
  threshold?: number
}

/**
 * Hook de défilement infini avec détection automatique
 * 
 * @param fetchNextPage Fonction à appeler pour charger la page suivante
 * @param options Configuration du comportement de défilement
 * @returns Objet avec état isFetching
 */
export const useInfiniteScroll = (
  fetchNextPage: () => void,
  options: UseInfiniteScrollOptions
) => {
  const { hasNextPage, isFetchingNextPage, threshold = 0.8 } = options
  const [isFetching, setIsFetching] = useState(false)

  const handleScroll = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return

    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight
    
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage >= threshold && !isFetching) {
      setIsFetching(true)
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold, isFetching])

  useEffect(() => {
    if (!isFetchingNextPage) {
      setIsFetching(false)
    }
  }, [isFetchingNextPage])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { isFetching }
}