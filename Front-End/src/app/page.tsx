"use client";
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { fetchPublicApi } from '@/lib/publicApi';
import { Suspense } from 'react';
import Footer from '@/components/Footer';
import ViewToggle from '@/components/ViewToggle';

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
    <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto"></div>
        <p className="text-gray-600 font-medium">Chargement de la carte...</p>
        <p className="text-sm text-gray-500">Localisation des zones et centres d'intérêt</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [welcome, setWelcome] = useState('Bienvenue sur Industria');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

  // Chargement du message de bienvenue avec mise en cache
  useEffect(() => {
    const cacheKey = 'greeting-fr'; // Simplification sans i18n
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      setWelcome(cached);
      return;
    }

    fetchPublicApi<{ message: string }>("/api/public/greeting")
      .then((data) => {
        if (data?.message) {
          setWelcome(data.message);
          sessionStorage.setItem(cacheKey, data.message);
        }
      })
      .catch((err) => {
        console.warn('Erreur API greeting:', err?.message || 'Erreur inconnue');
        // Garde la valeur par défaut en cas d'erreur
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-industria-gray-light to-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {welcome || 'Bienvenue sur Industria'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Découvrez et réservez des zones industrielles, parcs logistiques et zones franches à travers le Maroc. 
              Votre partenaire de confiance pour l'implantation industrielle.
            </p>
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Section de la carte interactive */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Explorez nos zones industrielles
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl">
                Découvrez l'emplacement de toutes nos zones industrielles et les centres d'intérêt stratégiques du Maroc
              </p>
            </div>
            
            <ViewToggle 
              currentView={viewMode}
              onViewChange={setViewMode}
              className="flex-shrink-0"
            />
          </div>
          
          {viewMode === 'map' ? (
            <Suspense fallback={
              <div className="relative overflow-hidden" style={{ height: 500 }}>
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto"></div>
                    <p className="text-gray-600 font-medium">Chargement de la carte...</p>
                    <p className="text-sm text-gray-500 mt-2">Localisation des zones et centres d'intérêt</p>
                  </div>
                </div>
              </div>
            }>
              <HomeMapView />
            </Suspense>
          ) : (
            <Suspense fallback={
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Chargement des zones industrielles...</p>
                <p className="text-sm text-gray-500 mt-2">Recherche des meilleures opportunités pour vous</p>
              </div>
            }>
              <ZoneGrid />
            </Suspense>
          )}
        </div>
      </section>

      {/* Section d'appel à l'action */}
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


      {/* Section avantages */}
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
              <h3 className="font-semibold mb-2">Zones Certifiées</h3>
              <p className="text-gray-600 text-sm">Toutes nos zones respectent les normes internationales</p>
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
