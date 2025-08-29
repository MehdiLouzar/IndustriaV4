// app/hooks/use-api.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { secureApiRequest } from '@/lib/auth-actions';
import { fetchPublicApi } from '@/lib/utils';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour les requêtes API sécurisées
 * Utilise les Server Actions pour gérer l'authentification
 */
export function useSecureApi<T>(
  endpoint: string,
  options?: RequestInit
): ApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await secureApiRequest<T>(endpoint, options);
      
      if (result.error) {
        setState({ data: null, loading: false, error: result.error });
      } else {
        setState({ data: result.data || null, loading: false, error: null });
      }
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  }, [endpoint, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook pour les requêtes API publiques (sans authentification)
 */
export function usePublicApi<T>(
  endpoint: string,
  options?: RequestInit
): ApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetchPublicApi<T>(endpoint, options);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  }, [endpoint, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook pour les mutations API sécurisées
 */
export function useSecureMutation<TData = any, TResponse = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (
    endpoint: string,
    data?: TData,
    options?: RequestInit
  ): Promise<TResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await secureApiRequest<TResponse>(endpoint, {
        ...options,
        method: options?.method || 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
      });
      
      if (result.error) {
        setError(result.error);
        return null;
      }
      
      return result.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mutation failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error,
  };
}