"use server";

import { cookies } from 'next/headers';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Server Action pour téléchargement sécurisé de fichiers
 * 
 * Cette fonction s'exécute côté serveur et utilise automatiquement
 * les cookies httpOnly pour l'authentification
 */
export async function secureDownloadFile(
  endpoint: string,
  params?: Record<string, string>
): Promise<{ 
  blob?: ArrayBuffer; 
  filename?: string; 
  contentType?: string;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token');
    
    if (!token) {
      return { error: 'Non authentifié' };
    }

    // Construire l'URL avec les paramètres
    const url = new URL(`${API_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      // Si 401, essayer de rafraîchir le token
      if (response.status === 401) {
        // Réutiliser la logique de refresh de auth-actions
        const refreshToken = cookieStore.get('refresh_token');
        if (refreshToken) {
          const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshToken.value })
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            // Les cookies seront mis à jour par auth-actions
            // Réessayer le téléchargement
            const retryResponse = await fetch(url.toString(), {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${data.accessToken}`,
                'Accept': '*/*'
              }
            });

            if (retryResponse.ok) {
              const arrayBuffer = await retryResponse.arrayBuffer();
              const contentDisposition = retryResponse.headers.get('content-disposition');
              let filename = 'download';
              
              if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches && matches[1]) {
                  filename = matches[1].replace(/['"]/g, '');
                }
              }

              return {
                blob: arrayBuffer,
                filename,
                contentType: retryResponse.headers.get('content-type') || 'application/octet-stream'
              };
            }
          }
        }
        return { error: 'Session expirée. Veuillez vous reconnecter.' };
      }
      
      return { error: `Erreur HTTP: ${response.status}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Extraire le nom de fichier depuis les headers
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'download';
    
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    return {
      blob: arrayBuffer,
      filename,
      contentType: response.headers.get('content-type') || 'application/octet-stream'
    };

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    return { error: 'Erreur lors du téléchargement du fichier' };
  }
}

