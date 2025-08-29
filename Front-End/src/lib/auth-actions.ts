"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Stockage sécurisé des tokens dans des cookies httpOnly
 */
async function setSecureTokens(accessToken: string, refreshToken: string, expiresIn: number = 3600) {
  const cookieStore = await cookies();
  
  // Cookie httpOnly pour l'access token
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresIn,
    path: '/'
  });
  
  // Cookie httpOnly pour le refresh token (30 jours)
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/'
  });
}

/**
 * Récupération des tokens depuis les cookies
 */
export async function getTokens() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get('access_token')?.value,
    refreshToken: cookieStore.get('refresh_token')?.value
  };
}

/**
 * Connexion utilisateur avec stockage sécurisé des tokens
 */
export async function login(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    
    // Stocker les tokens dans des cookies httpOnly
    await setSecureTokens(data.accessToken, data.refreshToken, data.expiresIn);
    
    // Stocker uniquement les infos utilisateur non sensibles dans un cookie lisible côté client
    const cookieStore = await cookies();
    cookieStore.set('user_info', JSON.stringify({
      id: data.userInfo.id,
      email: data.userInfo.email,
      name: data.userInfo.name,
      roles: data.userInfo.roles
    }), {
      httpOnly: false, // Accessible côté client pour l'UI
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.expiresIn,
      path: '/'
    });

    return { success: true, user: data.userInfo };
  } catch (error) {
    return { success: false, error: error };
  }
}

/**
 * Rafraîchissement automatique du token
 */
export async function refreshToken() {
  try {
    const { refreshToken } = await getTokens();
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    // Mettre à jour les tokens
    await setSecureTokens(data.accessToken, data.refreshToken, data.expiresIn);
    
    // Mettre à jour les infos utilisateur
    if (data.userInfo) {
      const cookieStore = await cookies();
      cookieStore.set('user_info', JSON.stringify(data.userInfo), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.expiresIn,
        path: '/'
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Déconnexion utilisateur
 */
export async function logout() {
  try {
    const { accessToken } = await getTokens();
    
    if (accessToken) {
      // Appeler l'endpoint de logout backend
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }).catch(() => {
        // Ignorer les erreurs de logout
      });
    }
  } finally {
    // Nettoyer les cookies
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    cookieStore.delete('user_info');
    
    // Rediriger vers la page de login
    redirect('/auth/login');
  }
}

/**
 * Requête API sécurisée avec gestion automatique du refresh
 */
export async function secureApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  let { accessToken } = await getTokens();
  
  if (!accessToken) {
    return { error: 'Not authenticated' };
  }
  
  // Première tentative
  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': options.body instanceof FormData ? '' : 'application/json',
    },
  });
  
  // Si 401, essayer de rafraîchir le token
  if (response.status === 401) {
    const refreshResult = await refreshToken();
    
    if (!refreshResult.success) {
      redirect('/auth/login');
    }
    
    // Récupérer le nouveau token
    const tokens = await getTokens();
    accessToken = tokens.accessToken;
    
    if (!accessToken) {
      return { error: 'Failed to refresh token' };
    }
    
    // Réessayer la requête
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': options.body instanceof FormData ? '' : 'application/json',
      },
    });
  }
  
  if (!response.ok) {
    const error = await response.text().catch(() => 'Request failed');
    return { error };
  }
  
  const text = await response.text();
  if (!text) return { data: {} as T };
  
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { data: text as unknown as T };
  }
}

/**
 * Vérifier l'authentification
 */
export async function checkAuth() {
  const { accessToken } = await getTokens();
  
  if (!accessToken) {
    return { isAuthenticated: false };
  }
  
  // Optionnel : vérifier la validité du token auprès de l'API
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      // Token invalide, essayer de le rafraîchir
      const refreshResult = await refreshToken();
      return { isAuthenticated: refreshResult.success };
    }
    
    return { isAuthenticated: true };
  } catch {
    return { isAuthenticated: false };
  }
}

/**
 * Récupérer les informations utilisateur
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userInfoCookie = cookieStore.get('user_info');
  
  if (!userInfoCookie) {
    return null;
  }
  
  try {
    return JSON.parse(userInfoCookie.value);
  } catch {
    return null;
  }
}