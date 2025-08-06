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
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T | null> {
  let abortController: AbortController | null = null
  try {
    if (!init?.signal) {
      abortController = new AbortController()
      init = { ...init, signal: abortController.signal }
    }

    const url = new URL(path, getBaseUrl())
    const headers = new Headers(init?.headers)
    const method = init?.method?.toUpperCase() || 'GET'
    const cacheKey = `${method}:${url}`

    if (method === 'GET') {
      const cached = apiCache.get(cacheKey)
      if (cached) return cached as T
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token && method !== 'GET') {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    const res = await fetch(url.toString(), { ...init, headers })
    if (init.signal?.aborted) return null
    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      return null
    }

    const data = await res.json()
    if (method === 'GET' && !init.signal?.aborted) {
      apiCache.set(cacheKey, data)
    }
    return data
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
