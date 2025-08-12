/**
 * Client API public pour les données non-authentifiées
 * 
 * Spécialisé pour les appels API qui ne nécessitent pas d'authentification,
 * notamment pour l'affichage public des zones industrielles.
 * 
 * Caractéristiques :
 * - Pas d'envoi de credentials ou tokens
 * - Gestion gracieuse des échecs (retourne null)
 * - Support des signaux d'annulation
 * - Fallback automatique sur des données par défaut
 * 
 * @template T Type de la réponse attendue
 * @param path Chemin API relatif (ex: '/api/public/zones')
 * @param init Options de requête avec support AbortSignal
 * @returns Promise résolue avec les données ou null en cas d'échec
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
export async function fetchPublicApi<T>(
  path: string,
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    const url = new URL(path, baseUrl)
    const headers = new Headers(init?.headers)
    
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    // Requête sans authentification
    const response = await fetch(url.toString(), {
      ...init,
      headers,
      credentials: 'omit' // Pas de credentials pour les routes publiques
    })

    // Si la réponse n'est pas ok, retourner null au lieu de throw
    if (!response.ok) {
      console.info(`Public API call failed (${response.status}): ${path} - this is normal, using fallback data`)
      return null
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.info(`Public API call error: ${path} - using fallback data`, error)
    return null
  }
}

/**
 * Types TypeScript pour les données publiques de l'API
 * 
 * Définit les structures de données pour les endpoints publics,
 * principalement pour l'affichage des zones industrielles sans authentification.
 */

/**
 * Représentation publique d'une zone industrielle
 */
export interface PublicZone {
  id: string
  name: string
  description?: string
  location?: string
  area?: string
  price?: string
  type?: string
  status: string
  coordinates?: [number, number]
  availableParcels?: number
  activityIcons?: string[]
  amenityIcons?: string[]
}

/**
 * Réponse API pour la liste des zones publiques
 * 
 * Support à la fois le format liste (items) et le format géospatial (features)
 * pour l'affichage en grille et sur carte.
 */
export interface PublicZonesResponse {
  items?: PublicZone[]
  features?: Array<{
    coordinates: [number, number]
    id: string
    name: string
    status: string
    availableParcels: number
    activityIcons: string[]
    amenityIcons: string[]
    description?: string
    price?: string
    area?: string
    location?: string
  }>
  totalPages?: number
  page?: number
}