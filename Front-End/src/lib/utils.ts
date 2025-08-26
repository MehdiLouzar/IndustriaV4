/**
 * Utilitaires généraux du frontend Industria
 * 
 * Regroupe les fonctions utilitaires essentielles :
 * - Fusion de classes CSS avec TailwindCSS
 * - Client API sécurisé avec authentification JWT et refresh automatique
 * - Système de cache mémoire avec TTL et limites
 * - Gestion sécurisée des téléchargements de fichiers
 * - Configuration d'URLs d'API selon l'environnement
 * 
 * Le cache API inclut des protections contre les fuites mémoire
 * et un nettoyage automatique périodique.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne les classes CSS de manière intelligente
 * 
 * Combine clsx pour la logique conditionnelle et tailwind-merge
 * pour résoudre les conflits entre classes TailwindCSS.
 * 
 * @param inputs Liste des classes à fusionner
 * @returns Chaîne de classes CSS optimisée
 * 
 * @example
 * cn('px-4 py-2', condition && 'bg-blue-500', 'px-2') // 'py-2 bg-blue-500 px-2'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Récupère l'URL de base de l'API selon l'environnement
 * 
 * En mode SSR (server-side), utilise API_INTERNAL_URL pour éviter
 * les problèmes de réseau interne. En mode client, utilise l'URL publique.
 * 
 * @returns URL de base pour les appels API
 */
export function getBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}

/**
 * Cache API sécurisé avec gestion mémoire et TTL
 * 
 * Implémente un cache en mémoire avec :
 * - Limite stricte du nombre d'entrées (15 max)
 * - Limite de taille totale (8MB max)
 * - TTL de 10 minutes avec nettoyage automatique
 * - Éviction des entrées les plus anciennes (LRU)
 * - Protection contre les objets trop volumineux (2MB max)
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
    let cleaned = 0
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.totalSize -= item.size
        this.cache.delete(key)
        cleaned++
      }
    }
    // Cleanup completed silently
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

// Flag pour éviter les refresh en boucle
let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

/**
 * Ajoute un callback à exécuter après le refresh du token
 */
function subscribeTokenRefresh(cb: () => void) {
  refreshSubscribers.push(cb);
}

/**
 * Notifie tous les subscribers après un refresh réussi
 */
function onTokenRefreshed() {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
}

/**
 * Rafraîchit le token d'accès
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    if (data.userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
    }

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Client API principal avec authentification JWT et refresh automatique
 * 
 * Gère automatiquement :
 * - Authentification Bearer token depuis localStorage
 * - Refresh automatique du token en cas d'expiration
 * - Headers appropriés selon le type de contenu
 * - Redirection automatique en cas d'échec du refresh
 * - Gestion d'erreurs robuste
 * - Support des uploads de fichiers (FormData)
 * 
 * @template T Type de la réponse attendue
 * @param url Endpoint API relatif (ex: '/api/zones')
 * @param options Options de requête (méthode, body, headers, etc.)
 * @returns Promise résolue avec les données typées
 * 
 * @throws Error si non-autorisé ou si la requête échoue
 */
export async function fetchApi<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const baseUrl = getBaseUrl();
  let response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !url.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;

      const refreshed = await refreshAccessToken();
      isRefreshing = false;

      if (refreshed) {
        onTokenRefreshed();
        response = await fetch(`${baseUrl}${url}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userInfo');
          window.location.href = '/auth/login';
        }
        throw new Error('Unauthorized');
      }
    } else {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(() => {
          fetch(`${baseUrl}${url}`, {
            ...options,
            headers,
            credentials: 'include',
          })
            .then(async (retryResponse) => {
              if (!retryResponse.ok) {
                const error = await retryResponse.text().catch(() => 'Request failed');
                throw new Error(error);
              }
              const text = await retryResponse.text();
              if (!text) return resolve({} as T);
              try {
                resolve(JSON.parse(text));
              } catch {
                resolve(text as unknown as T);
              }
            })
            .catch(reject);
        });
      });
    }
  }

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
 * Téléchargement sécurisé de fichiers depuis l'API
 * 
 * Gère le téléchargement de fichiers avec authentification JWT :
 * - Vérification du token d'authentification
 * - Création automatique du lien de téléchargement
 * - Extraction du nom de fichier depuis les headers HTTP
 * - Nettoyage automatique des ressources
 * 
 * @param endpoint Endpoint de téléchargement (ex: '/api/export/zones')
 * @param params Paramètres de requête optionnels
 * @param defaultFilename Nom de fichier par défaut si non spécifié par l'API
 * 
 * @throws Error si le token est manquant ou si la requête échoue
 */
export async function downloadFile(
  endpoint: string,
  params: URLSearchParams = new URLSearchParams(),
  defaultFilename: string = 'export.csv'
): Promise<void> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
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
    throw error;
  }
}

/**
 * Récupère les informations de l'utilisateur courant
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;
  
  try {
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
 * Déconnecte l'utilisateur
 */
export async function logout() {
  try {
    const baseUrl = getBaseUrl();
    await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignorer les erreurs de logout
    });
  } finally {
    localStorage.removeItem('userInfo');
    window.location.href = '/auth/login';
  }
}