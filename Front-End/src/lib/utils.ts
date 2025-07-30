import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}

// Simple in-memory cache with TTL and max size to avoid leaks
class ApiCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  private readonly maxSize = 50

  set(key: string, data: unknown, ttl: number) {
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value
      this.cache.delete(oldest)
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }

  cleanup() {
    const now = Date.now()
    for (const [k, v] of this.cache.entries()) {
      if (now - v.timestamp > v.ttl) {
        this.cache.delete(k)
      }
    }
  }
}

const apiCache = new ApiCache()

if (typeof window !== 'undefined') {
  // periodic cleanup every 5min
  setInterval(() => apiCache.cleanup(), 300_000)
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = new URL(path, getBaseUrl())
    const headers = new Headers(init?.headers)
    const method = init?.method?.toUpperCase() || 'GET'

    const cacheKey = `${method}:${url}`
    const cached = method === 'GET' ? apiCache.get(cacheKey) : null
    if (cached) {
      return cached as T
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      // Only attach the token for non-GET requests to avoid 401 on public APIs
      if (token && method !== 'GET') {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    const res = await fetch(url.toString(), { ...init, headers })
    if (!res.ok) {
        // Drop invalid tokens on unauthorized responses
        if (res.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token')
        }
        return null
    }
    const data = await res.json()
    if (method === 'GET') {
      // zones endpoint has longer TTL
      const ttl = url.pathname.includes('/zones') ? 600_000 : 300_000
      apiCache.set(cacheKey, data, ttl)
    } else {
      // mutation invalidates cache
      apiCache.cleanup()
    }
    return data
  } catch (err) {
    console.error(err)
    return null
  }
}
