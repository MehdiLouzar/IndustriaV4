"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getBaseUrl } from './utils';

/**
 * Get cookie domain from environment or request
 */
function getCookieDomain(): string | undefined {
  // In production, you might want to set cookies for .industria.ma
  // to work across subdomains
  if (process.env.COOKIE_DOMAIN) {
    return process.env.COOKIE_DOMAIN;
  }
  
  // Don't set domain for localhost/development
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }
  
  // For production, let the browser handle it
  return undefined;
}

/**
 * Stockage sécurisé des tokens dans des cookies httpOnly
 */
async function setSecureTokens(accessToken: string, refreshToken: string, expiresIn: number = 3600) {
  const cookieStore = await cookies();
  const domain = getCookieDomain();
  
  console.log('[Auth] Setting cookies with config:', {
    secure: process.env.NODE_ENV === 'production',
    domain,
    sameSite: 'lax',
    path: '/'
  });
  
  // Cookie httpOnly pour l'access token
  await cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: false, // Set to false if using HTTP, true for HTTPS
    sameSite: 'lax',
    maxAge: expiresIn,
    path: '/',
    ...(domain && { domain })
  });
  
  // Cookie httpOnly pour le refresh token (30 jours)
  await cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false, // Set to false if using HTTP, true for HTTPS
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    ...(domain && { domain })
  });
  
  // Verify cookies were set
  const verifyAccess = cookieStore.get('access_token');
  const verifyRefresh = cookieStore.get('refresh_token');
  
  console.log('[Auth] Cookies verification:', {
    accessTokenSet: !!verifyAccess,
    refreshTokenSet: !!verifyRefresh
  });
}

/**
 * Récupération des tokens depuis les cookies
 */
export async function getTokens() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  console.log('[Auth] Getting tokens:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken
  });
  
  return { accessToken, refreshToken };
}

/**
 * Connexion utilisateur avec stockage sécurisé des tokens
 */
export async function login(email: string, password: string) {
  console.log('[Auth] Login attempt for:', email);

  try {
    const API_URL = getBaseUrl();
    const loginUrl = API_URL ? `${API_URL}/api/auth/login` : '/api/auth/login';
    
    console.log('[Auth] Login URL:', loginUrl);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Login failed');
      console.error('[Auth] Login failed:', response.status);
      return { 
        success: false, 
        error: `Login failed: ${response.status}` 
      };
    }

    const data = await response.json();
    console.log('[Auth] Login response received, setting cookies...');
    
    // Stocker les tokens dans des cookies httpOnly
    await setSecureTokens(data.accessToken, data.refreshToken, data.expiresIn);
    
    // Stocker uniquement les infos utilisateur non sensibles dans un cookie lisible côté client
    const cookieStore = await cookies();
    const domain = getCookieDomain();
    
    await cookieStore.set('user_info', JSON.stringify({
      id: data.userInfo.id,
      email: data.userInfo.email,
      name: data.userInfo.name,
      roles: data.userInfo.roles
    }), {
      httpOnly: false, // Accessible côté client pour l'UI
      secure: false, // Set to false if using HTTP, true for HTTPS
      sameSite: 'lax',
      maxAge: data.expiresIn,
      path: '/',
      ...(domain && { domain })
    });
    
    console.log('[Auth] Login successful, all cookies should be set');

    return { success: true, user: data.userInfo };
  } catch (error) {
    console.error('[Auth] Login error:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion';
    return { 
      success: false, 
      error: message 
    };
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

    const API_URL = getBaseUrl();
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
      const domain = getCookieDomain();
      
      cookieStore.set('user_info', JSON.stringify(data.userInfo), {
        httpOnly: false,
        secure: false, // Set to false if using HTTP, true for HTTPS
        sameSite: 'lax',
        maxAge: data.expiresIn,
        path: '/',
        ...(domain && { domain })
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Auth] Refresh token error:', error);
    return { success: false };
  }
}

/**
 * Déconnexion utilisateur
 */
export async function logout() {
  try {
    const { accessToken } = await getTokens();
    const API_URL = getBaseUrl();
    
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
    const domain = getCookieDomain();
    
    // Delete with same options as set
    await cookieStore.delete({
      name: 'access_token',
      path: '/',
      ...(domain && { domain })
    });
    
    await cookieStore.delete({
      name: 'refresh_token', 
      path: '/',
      ...(domain && { domain })
    });
    
    await cookieStore.delete({
      name: 'user_info',
      path: '/',
      ...(domain && { domain })
    });
    
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
  const API_URL = getBaseUrl();
  
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
    const API_URL = getBaseUrl();
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