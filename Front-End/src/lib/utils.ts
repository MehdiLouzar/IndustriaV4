import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || ''
  }
  return process.env.NEXT_PUBLIC_API_URL || ''
}

// Memory-safe cache with strict limits and TTL
class SecureApiCache {
  private cache = new Map<string, { data: unknown; timestamp: number; size: number }>()
  private readonly MAX_SIZE = 15
  private readonly TTL = 600000 // 10 minutes
  private totalSize = 0
  private readonly MAX_TOTAL_SIZE = 8 * 1024 * 1024 // 8MB

  private estimateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2
    } catch {
      return 1024
    }
  }

  set(key: string, data: unknown) {
    const size = this.estimateSize(data)
    if (size > 2 * 1024 * 1024) {
      console.warn('Cache: objet rejeté (trop volumineux)')
      return
    }
    while (this.cache.size >= this.MAX_SIZE || this.totalSize + size > this.MAX_TOTAL_SIZE) {
      this.evictOldest()
    }
    this.cache.set(key, { data, timestamp: Date.now(), size })
    this.totalSize += size
  }

  private evictOldest() {
    const oldestKey = this.cache.keys().next().value
    if (oldestKey) {
      const item = this.cache.get(oldestKey)
      if (item) {
        this.totalSize -= item.size
        this.cache.delete(oldestKey)
      }
    }
  }

  clear() {
    this.cache.clear()
    this.totalSize = 0
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() - item.timestamp > this.TTL) {
      this.totalSize -= item.size
      this.cache.delete(key)
      return null
    }
    return item.data
  }

  cleanup() {
    const now = Date.now()
    let cleaned = 0
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.totalSize -= item.size
        this.cache.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`Cache cleanup: ${cleaned} entrées supprimées`)
    }
  }
}

export const apiCache = new SecureApiCache()

// Gestionnaire des requêtes en cours pour éviter les doublons
const pendingRequests = new Map<string, Promise<any>>()

// Fonction pour créer une clé unique pour une requête
function createRequestKey(path: string, init?: RequestInit): string {
  const method = init?.method || 'GET'
  const body = init?.body ? JSON.stringify(init.body) : ''
  return `${method}:${path}:${body}`
}

let cleanupTimer: NodeJS.Timeout | null = null
if (typeof window !== 'undefined') {
  cleanupTimer = setInterval(() => apiCache.cleanup(), 60000)

  window.addEventListener('beforeunload', () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
    apiCache.clear()
  })

  window.addEventListener('error', () => {
    apiCache.clear()
  })
}

export async function fetchApi<T>(
  path: string,
  init?: RequestInit & { signal?: AbortSignal },
  token?: string
): Promise<T | null> {
  let abortController: AbortController | null = null
  try {
    if (!init?.signal) {
      abortController = new AbortController()
      init = { ...init, signal: abortController.signal }
    }

    const url = new URL(path, getBaseUrl())
    const headers = new Headers(init?.headers)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const method = init?.method?.toUpperCase() || 'GET'
    const cacheKey = `${method}:${url}`
    const requestKey = createRequestKey(path, init)

    if (method === 'GET') {
      const cached = apiCache.get(cacheKey)
      if (cached) return cached as T
      
      // Vérifier s'il y a une requête en cours pour éviter les doublons
      if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey)
      }
    }

    // Routes publiques (sans authentification)
    const publicRoutes = [
      '/api/public',
      '/api/zones',
      '/api/map',
      '/api/activities',
      '/api/amenities',
      '/api/regions',
      '/api/zone-types',
      '/api/countries'
    ]
    
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route))
    const isProtected = 
      path.startsWith('/api/admin') || 
      (path.startsWith('/api/') && method !== 'GET' && !isPublicRoute && !path.includes('/reservations')) ||
      (path.startsWith('/api/') && method === 'GET' && !isPublicRoute && path.includes('/users'))
    
    console.log(`API Call: ${method} ${path} - Protected: ${isProtected}`)

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    } else if (isProtected && typeof window !== 'undefined') {
      // Try to get token from localStorage if not provided
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        console.log(`Setting auth token for ${method} ${path}`)
        headers.set('Authorization', `Bearer ${storedToken}`)
      } else {
        console.error(`No auth token found for protected route: ${path}`)
        // Seulement rediriger pour les routes admin
        if (path.startsWith('/api/admin')) {
          window.location.href = '/auth/login'
          return Promise.reject(new Error('Missing auth token'))
        }
      }
    }

    // Créer la promesse de requête
    const requestPromise = (async () => {
      const res = await fetch(url.toString(), { credentials: 'include', ...init, headers })
      if (init.signal?.aborted) return null
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'No response body')
        console.warn(`API Error ${res.status} for ${method} ${url}:`, errorText)
        
        if (res.status === 401 && typeof window !== 'undefined') {
          if (isProtected) {
            console.warn('Authentication failed for protected route')
            // Seulement rediriger pour les routes admin
            if (path.startsWith('/api/admin')) {
              window.location.href = '/auth/login'
            }
          } else {
            console.info('401 on public route - this is normal, using fallback data')
          }
        }
        
        return null
      }

      const data = await res.json()
      if (method === 'GET' && !init.signal?.aborted) {
        apiCache.set(cacheKey, data)
      }
      return data
    })()

    // Ajouter aux requêtes en cours pour les GET
    if (method === 'GET') {
      pendingRequests.set(requestKey, requestPromise)
      requestPromise.finally(() => {
        pendingRequests.delete(requestKey)
      })
    }

    return await requestPromise
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Fetch error:', err)
    }
    return null
  } finally {
    if (abortController) {
      abortController = null
    }
  }
}
