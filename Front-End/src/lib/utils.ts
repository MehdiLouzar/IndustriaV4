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
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Get the token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Prepare headers
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  // Add Authorization header if token exists and not uploading files
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add Content-Type if not a FormData request
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Make the request with the full URL
  const response = await fetch(`http://localhost:8080${url}`, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Token is invalid or expired
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    throw new Error('Unauthorized');
  }
  
  // Handle other errors
  if (!response.ok) {
    const error = await response.text().catch(() => 'Request failed');
    throw new Error(error);
  }
  
  // Parse response
  const text = await response.text();
  if (!text) return {} as T;
  
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

/**
 * Fonction utilitaire pour télécharger des fichiers depuis l'API avec authentification
 */
export async function downloadFile(
  endpoint: string,
  params: URLSearchParams = new URLSearchParams(),
  defaultFilename: string = 'export.csv'
): Promise<void> {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Token d\'authentification manquant')
    }

    const response = await fetch(`http://localhost:8080${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Extraire le nom de fichier depuis les headers si disponible
    const contentDisposition = response.headers.get('content-disposition')
    let filename = defaultFilename
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    throw error
  }
}
