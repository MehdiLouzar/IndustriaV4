import { useState, useEffect, useRef, useCallback } from 'react';

export interface OverpassPOI {
  id: string;
  name: string;
  type: 'airport' | 'port' | 'station';
  coordinates: [number, number]; // [lat, lon]
}

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    aeroway?: string;
    amenity?: string;
    harbour?: string;
    railway?: string;
    public_transport?: string;
    [key: string]: any;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const DEBOUNCE_DELAY = 1000; // 1 seconde

/**
 * Hook personnalisé pour récupérer les Points d'Intérêt depuis l'API Overpass d'OpenStreetMap.
 * 
 * Fonctionnalités :
 * - Récupération automatique des POI selon les bounds de la carte
 * - Cache avec expiration pour éviter les appels répétés
 * - Debouncing pour optimiser les performances lors du zoom/pan
 * - Gestion d'erreurs avec fallback
 */
export const useOverpassPOI = (bounds: Bounds | null, enabled: boolean = true) => {
  const [pois, setPois] = useState<OverpassPOI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<Map<string, { data: OverpassPOI[], timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Construit la requête Overpass pour récupérer les POI
   */
  const buildOverpassQuery = useCallback((bounds: Bounds): string => {
    const { south, west, north, east } = bounds;
    
    return `
      [out:json][timeout:15];
      (
        node["aeroway"~"^(aerodrome|airport)$"]["name"](${south},${west},${north},${east});
        node["amenity"="ferry_terminal"]["name"](${south},${west},${north},${east});
        node["harbour"="yes"]["name"](${south},${west},${north},${east});
        node["railway"="station"]["name"](${south},${west},${north},${east});
        node["public_transport"="station"]["railway"="station"]["name"](${south},${west},${north},${east});
      );
      out center;
    `;
  }, []);

  /**
   * Détermine le type de POI basé sur les tags OpenStreetMap
   */
  const determinePoiType = useCallback((tags: OverpassElement['tags']): OverpassPOI['type'] | null => {
    if (tags.aeroway === 'aerodrome' || tags.aeroway === 'airport') {
      return 'airport';
    }
    
    if (tags.amenity === 'ferry_terminal' || tags.harbour === 'yes') {
      return 'port';
    }
    
    if (tags.railway === 'station' || tags.public_transport === 'station') {
      return 'station';
    }
    
    return null;
  }, []);

  /**
   * Parse la réponse de l'API Overpass
   */
  const parseOverpassResponse = useCallback((response: OverpassResponse): OverpassPOI[] => {
    if (!response.elements) {
      return [];
    }

    return response.elements
      .filter(element => element.tags?.name && element.lat && element.lon)
      .map(element => {
        const type = determinePoiType(element.tags);
        if (!type) return null;

        return {
          id: `osm_${element.id}`,
          name: element.tags.name!,
          type,
          coordinates: [element.lat, element.lon] as [number, number]
        };
      })
      .filter((poi): poi is OverpassPOI => poi !== null);
  }, [determinePoiType]);

  /**
   * Génère une clé de cache basée sur les bounds arrondies
   */
  const getCacheKey = useCallback((bounds: Bounds): string => {
    // Arrondir les coordonnées pour améliorer le cache hit
    const precision = 2; // ~1km de précision
    const roundedBounds = {
      south: Math.floor(bounds.south * Math.pow(10, precision)) / Math.pow(10, precision),
      west: Math.floor(bounds.west * Math.pow(10, precision)) / Math.pow(10, precision),
      north: Math.ceil(bounds.north * Math.pow(10, precision)) / Math.pow(10, precision),
      east: Math.ceil(bounds.east * Math.pow(10, precision)) / Math.pow(10, precision)
    };
    
    return `${roundedBounds.south}_${roundedBounds.west}_${roundedBounds.north}_${roundedBounds.east}`;
  }, []);

  /**
   * Récupère les POI depuis l'API Overpass
   */
  const fetchPOIs = useCallback(async (bounds: Bounds) => {
    const cacheKey = getCacheKey(bounds);
    const cached = cacheRef.current.get(cacheKey);
    
    // Vérifier le cache
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached POIs for bounds:', bounds);
      setPois(cached.data);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const query = buildOverpassQuery(bounds);
      
      console.log('Fetching POIs for bounds:', bounds);
      
      const response = await fetch(OVERPASS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: query,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OverpassResponse = await response.json();
      const parsedPois = parseOverpassResponse(data);
      
      console.log(`Found ${parsedPois.length} POIs`);
      
      // Mettre à jour le cache
      cacheRef.current.set(cacheKey, {
        data: parsedPois,
        timestamp: Date.now()
      });
      
      setPois(parsedPois);
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('POI fetch aborted');
        return;
      }
      
      console.error('Error fetching POIs:', err);
      setError('Erreur lors du chargement des centres d\'intérêt');
      
      // Garder les POI existants en cas d'erreur
      // Ne pas vider la liste pour une meilleure UX
      
    } finally {
      setLoading(false);
    }
  }, [buildOverpassQuery, getCacheKey, parseOverpassResponse]);

  /**
   * Effet principal pour charger les POI quand les bounds changent
   */
  useEffect(() => {
    if (!enabled || !bounds) {
      return;
    }

    // Annuler le timeout précédent
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debouncer les appels pour éviter trop de requêtes lors du zoom/pan
    debounceTimeoutRef.current = setTimeout(() => {
      fetchPOIs(bounds);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [bounds, enabled, fetchPOIs]);

  /**
   * Nettoyage lors du démontage
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Fonction pour forcer le rechargement des POI
   */
  const refresh = useCallback(() => {
    if (bounds) {
      const cacheKey = getCacheKey(bounds);
      cacheRef.current.delete(cacheKey);
      fetchPOIs(bounds);
    }
  }, [bounds, getCacheKey, fetchPOIs]);

  /**
   * Fonction pour vider le cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    pois,
    loading,
    error,
    refresh,
    clearCache
  };
};