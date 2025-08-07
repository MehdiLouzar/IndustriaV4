// Utilitaire pour les appels API publics (sans authentification)
export async function fetchPublicApi<T>(
  path: string,
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T | null> {
  try {
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8080' 
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    
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

// Types pour les données publiques
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