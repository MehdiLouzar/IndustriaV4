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

const fetchCache = new Map<string, unknown>();

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = new URL(path, getBaseUrl())
    const headers = new Headers(init?.headers)
    const method = init?.method?.toUpperCase() || 'GET'

    const cacheKey = `${method}:${url}`
    if (method === 'GET' && fetchCache.has(cacheKey)) {
      return fetchCache.get(cacheKey) as T
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
      fetchCache.set(cacheKey, data)
    } else {
      fetchCache.clear()
    }
    return data
  } catch (err) {
    console.error(err)
    return null
  }
}
