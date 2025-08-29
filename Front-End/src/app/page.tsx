"use client";

import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import dynamic from 'next/dynamic';
import React, { useEffect, useState, Suspense } from 'react';
import { fetchPublicApi } from '@/lib/utils';
import Footer from '@/components/Footer';
import ViewToggle from '@/components/ViewToggle';

const ZONES_CACHE_KEY = 'zones-cache-v1';

const ZoneGrid = dynamic(() => import('@/components/ZoneGrid'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Chargement des zones industrielles...</p>
      <p className="text-sm text-gray-500 mt-2">Recherche des meilleures opportunités pour vous</p>
    </div>
  ),
});

const HomeMapView = dynamic(() => import('@/components/HomeMapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto"></div>
        <p className="text-gray-600 font-medium">Chargement de la carte...</p>
        <p className="text-sm text-gray-500">Localisation des zones et centres d'intérêt</p>
      </div>
    </div>
  ),
});

// Composant pour gérer les paramètres de recherche avec Suspense
function SearchParamsHandler({ onFiltersChange }: { onFiltersChange: (filters: any, hasFilters: boolean) => void }) {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();

  // Stabiliser les filtres avec useMemo pour éviter les re-renders multiples
  const searchFilters = React.useMemo(() => ({
    regionId: searchParams.get('regionId') || '',
    zoneTypeId: searchParams.get('zoneTypeId') || '',
    status: searchParams.get('status') || '',
    minArea: searchParams.get('minArea') || '',
    maxArea: searchParams.get('maxArea') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  }), [searchParams.toString()]);

  // Stabiliser hasSearchFilters
  const hasSearchFilters = React.useMemo(() => 
    Object.values(searchFilters).some(value => value !== ''), 
    [searchFilters]
  );

  React.useEffect(() => {
    onFiltersChange(searchFilters, hasSearchFilters);
  }, [onFiltersChange, searchFilters, hasSearchFilters]);

  return null;
}

export default function Home() {
  const [welcome, setWelcome] = useState('Bienvenue sur Industria');
  const [searchFilters, setSearchFilters] = useState({
    regionId: '',
    zoneTypeId: '',
    status: '',
    minArea: '',
    maxArea: '',
    minPrice: '',
    maxPrice: '',
  });
  const [hasSearchFilters, setHasSearchFilters] = useState(false);

  // Stabiliser searchFilters avec useMemo pour éviter les re-renders multiples
  const stableSearchFilters = React.useMemo(() => searchFilters, [
    searchFilters.regionId,
    searchFilters.zoneTypeId,
    searchFilters.status,
    searchFilters.minArea,
    searchFilters.maxArea,
    searchFilters.minPrice,
    searchFilters.maxPrice,
  ]);

  const handleFiltersChange = React.useCallback((filters: any, hasFilters: boolean) => {
    setSearchFilters(prevFilters => {
      // Ne pas mettre à jour si les filtres sont identiques
      if (JSON.stringify(prevFilters) === JSON.stringify(filters)) {
        return prevFilters;
      }
      return filters;
    });
    
    setHasSearchFilters(prevHas => {
      if (prevHas === hasFilters) return prevHas;
      return hasFilters;
    });
    
    setViewMode(prevMode => {
      const newMode = hasFilters ? 'grid' : 'map';
      if (prevMode === newMode) return prevMode;
      return newMode;
    });
  }, []);

  // Si des filtres de recherche sont actifs, commencer en vue grille, sinon vue carte
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

  // Keep the map mounted after first display to avoid remount/fetch loops
  const [mapEverShown, setMapEverShown] = useState(viewMode === 'map');
  useEffect(() => {
    if (viewMode === 'map') setMapEverShown(true);
  }, [viewMode]);

  // Prefetch zones once so "Carte" opens instantly
  useEffect(() => {
    if (sessionStorage.getItem(ZONES_CACHE_KEY)) return;
    (async () => {
      try {
        const resp = await fetchPublicApi<any>('/api/map/zones/simplified?zoom=8');
        if (resp?.features) {
          sessionStorage.setItem(ZONES_CACHE_KEY, JSON.stringify(resp.features));
        }
      } catch {
        // ignore – HomeMapView has its own fallback
      }
    })();
  }, []);

  // Greeting (cached)
  useEffect(() => {
    const cacheKey = 'greeting-fr';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setWelcome(cached);
      return;
    }
    fetchPublicApi<{ message: string }>('/api/public/greeting')
      .then((data) => {
        if (data?.message) {
          setWelcome(data.message);
          sessionStorage.setItem(cacheKey, data.message);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <SearchParamsHandler onFiltersChange={handleFiltersChange} />
      </Suspense>
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-industria-gray-light to-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {welcome || 'Bienvenue sur Industria'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez et réservez des zones industrielles, parcs logistiques et zones franches à travers le Maroc.
            </p>
          </div>
        </div>
      </section>

      {/* Search + Map/Grid côte à côte */}
      <section className="py-8 bg-white min-h-screen">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-6 h-full">
            {/* Panneau de recherche - 4 colonnes */}
            <div className="lg:col-span-4">
              <div className="sticky top-4">
                <SearchBar />
              </div>
            </div>
            
            {/* Contenu carte/grille - 8 colonnes */}
            <div className="lg:col-span-8">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Explorez nos zones industrielles
                  </h2>
                  <p className="text-gray-600">
                    Découvrez l&apos;emplacement de toutes nos zones industrielles
                  </p>
                </div>

                <ViewToggle
                  currentView={viewMode}
                  onViewChange={setViewMode}
                  className="flex-shrink-0"
                />
              </div>

              <div className="relative">
                {/* Keep map mounted after the first time, give it real height */}
                <div className={viewMode === 'map' ? 'block' : 'hidden'} aria-hidden={viewMode !== 'map'}>
                  <div className="h-[700px] rounded-lg overflow-hidden border border-gray-200">
                <Suspense
                  fallback={
                    <div className="relative overflow-hidden h-[600px]">
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
                        <div className="text-center space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto"></div>
                          <p className="text-gray-600 font-medium">Chargement de la carte...</p>
                          <p className="text-sm text-gray-500 mt-2">Localisation des zones et centres d&apos;intérêt</p>
                        </div>
                      </div>
                    </div>
                  }
                >
                  {mapEverShown ? <HomeMapView searchFilters={stableSearchFilters} hasSearchFilters={hasSearchFilters} /> : null}
                  </Suspense>
                  </div>
                </div>

                <div className={viewMode === 'map' ? 'hidden' : 'block'} aria-hidden={viewMode === 'map'}>
                  <Suspense
                    fallback={
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Chargement des zones industrielles...</p>
                        <p className="text-sm text-gray-500 mt-2">Recherche des meilleures opportunités pour vous</p>
                      </div>
                    }
                  >
                    <div className="max-h-[700px] overflow-y-auto">
                      <ZoneGrid searchFilters={stableSearchFilters} />
                    </div>
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-industria-brown-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Zones Industrielles</h3>
              <p className="text-gray-600">Espaces dédiés à la production industrielle avec toutes les infrastructures nécessaires</p>
            </div>
            <div className="text-center bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-industria-olive-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Parcs Logistiques</h3>
              <p className="text-gray-600">Solutions optimisées pour le stockage et la distribution de marchandises</p>
            </div>
            <div className="text-center bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-industria-olive-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Zones Franches</h3>
              <p className="text-gray-600">Avantages fiscaux et douaniers pour développer votre activité export</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Industria ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Notre expertise au service de votre réussite industrielle
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-industria-gray-light rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-industria-brown-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Zones Vérifiées</h3>
              <p className="text-gray-600 text-sm">Les données de toutes nos zones sont vérifiées</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-industria-gray-light rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-industria-olive-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Support 24/7</h3>
              <p className="text-gray-600 text-sm">Accompagnement personnalisé à chaque étape</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-industria-gray-light rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-industria-yellow-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Procédures Rapides</h3>
              <p className="text-gray-600 text-sm">Réservation et installation accélérées</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-industria-gray-light rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-industria-brown-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Couverture Nationale</h3>
              <p className="text-gray-600 text-sm">Présent dans toutes les régions du Maroc</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
