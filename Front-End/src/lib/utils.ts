// Front-End/src/lib/utils.ts
/**
 * Utilitaires généraux du frontend Industria (version sécurisée)
 * 
 * Version refactorisée sans stockage des tokens dans localStorage
 * Les tokens JWT sont maintenant stockés côté serveur dans des cookies httpOnly
 * 
 * @author Industria Platform Team
 * @version 2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne les classes CSS de manière intelligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Récupère l'URL de base de l'API selon l'environnement
 */
export function getBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || '';
  }

  return process.env.NEXT_PUBLIC_API_URL || '';
}

/**
 * Cache API sécurisé avec gestion mémoire et TTL
 */
class SecureApiCache {
  private cache = new Map<string, { data: unknown; timestamp: number; size: number }>()
  private readonly MAX_SIZE = 15;
  private readonly TTL = 600000; // 10 minutes
  private totalSize = 0;
  private readonly MAX_TOTAL_SIZE = 8 * 1024 * 1024; // 8MB

  private estimateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2;
    } catch {
      return 1024;
    }
  }

  set(key: string, data: unknown) {
    const size = this.estimateSize(data)
    if (size > 2 * 1024 * 1024) {
      return;
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
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.totalSize -= item.size
        this.cache.delete(key)
      }
    }
  }
}

export const apiCache = new SecureApiCache()

// Nettoyage périodique du cache
if (typeof window !== 'undefined') {
  const cleanupTimer = setInterval(() => apiCache.cleanup(), 60000)

  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupTimer)
    apiCache.clear()
  })

  window.addEventListener('error', () => {
    apiCache.clear()
  })
}

/**
 * Client API pour les requêtes côté client
 * IMPORTANT: Cette fonction doit être utilisée uniquement pour les requêtes non-sensibles
 * Pour les requêtes nécessitant une authentification, utilisez les Server Actions
 */
export async function fetchPublicApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  // Add Content-Type if not a FormData request
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const baseUrl = getBaseUrl();
  
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.text().catch(() => 'Request failed');
    throw new Error(error);
  }
  
  const text = await response.text();
  if (!text) return {} as T;
  
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

/**
 * Récupère les informations de l'utilisateur depuis le cookie
 * Note: Ces informations sont non-sensibles et stockées dans un cookie lisible côté client
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  // Lire le cookie user_info
  const cookies = document.cookie.split(';');
  const userInfoCookie = cookies.find(c => c.trim().startsWith('user_info='));
  
  if (!userInfoCookie) return null;
  
  try {
    const userInfo = decodeURIComponent(userInfoCookie.split('=')[1]);
    return JSON.parse(userInfo);
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;
  
  return user.roles.includes(role);
}

/**
 * Helper pour décoder un JWT (partie payload uniquement, sans validation)
 * Utilisé uniquement pour l'affichage d'informations non sensibles
 */
export function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}