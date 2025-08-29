/**
 * Hook de cache API avec TTL (Time To Live)
 * 
 * Fournit un système de cache intelligent pour les appels API avec :
 * - Cache en mémoire avec expiration automatique
 * - Rafraîchissement forcé des données
 * - Gestion des états de chargement et d'erreur
 * - Hook spécialisé pour les données communes (zones, régions, etc.)
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchPublicApi } from '@/lib/utils'

/**
 * Entrée dans le cache avec données et timestamp
 */
interface CacheEntry<T> {
  /** Données mises en cache */
  data: T
  /** Timestamp de création de l'entrée */
  timestamp: number
}

/**
 * Options de configuration du cache
 */
interface CacheOptions {
  /** Time to live en millisecondes (défaut: 5 minutes) */
  ttl?: number
  /** Clé personnalisée pour le cache (défaut: URL) */
  key?: string
}

const cache = new Map<string, CacheEntry<any>>()

/**
 * Hook de cache API avec TTL
 * 
 * @template T Type des données retournées par l'API
 * @param url URL de l'endpoint API
 * @param options Options de configuration du cache
 * @returns Objet avec data, loading, error, refresh, clearCache
 */
export function useApiCache<T>(
  url: string,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, key = url } = options // 5 minutes par défaut
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    // Vérifier le cache
    if (!forceRefresh) {
      const cached = cache.get(key)
      if (cached && Date.now() - cached.timestamp < ttl) {
        setData(cached.data)
        setLoading(false)
        return cached.data
      }
    }

    try {
      const result = await fetchPublicApi<T>(url)
      
      // Sauvegarder dans le cache
      cache.set(key, {
        data: result,
        timestamp: Date.now()
      })
      
      setData(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de requête')
      return null
    } finally {
      setLoading(false)
    }
  }, [url, key, ttl])

  const clearCache = useCallback(() => {
    cache.delete(key)
  }, [key])

  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    clearCache
  }
}

/**
 * Hook spécialisé pour précharger les données communes de la plateforme
 * 
 * Pré-charge et cache les référentiels fréquemment utilisés :
 * - Zones industrielles
 * - Régions du Maroc
 * - Types de zones
 * - Activités autorisées
 * - Équipements disponibles
 * 
 * @returns Objet avec toutes les données communes et état de chargement global
 */
export function useCommonData() {
  const zones = useApiCache<any>('/api/zones/all', { key: 'zones-all', ttl: 10 * 60 * 1000 })
  const regions = useApiCache<any>('/api/regions/all', { key: 'regions-all', ttl: 15 * 60 * 1000 })
  const zoneTypes = useApiCache<any>('/api/zone-types/all', { key: 'zone-types-all', ttl: 30 * 60 * 1000 })
  const activities = useApiCache<any>('/api/activities', { key: 'activities-all', ttl: 15 * 60 * 1000 })
  const amenities = useApiCache<any>('/api/amenities/all', { key: 'amenities-all', ttl: 15 * 60 * 1000 })

  return {
    zones,
    regions, 
    zoneTypes,
    activities,
    amenities,
    isLoading: zones.loading || regions.loading || zoneTypes.loading || activities.loading || amenities.loading
  }
}