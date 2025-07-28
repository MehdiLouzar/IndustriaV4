"use client";
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import dynamicLib from 'next/dynamic';
import React from 'react';
import ZoneGrid from '@/components/ZoneGrid';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

const MapViewLazy = dynamicLib(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <p>Chargement de la carte...</p>,
});

function LazyMapView() {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setShow(true)
        obs.disconnect()
      }
    }, { rootMargin: '200px' })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return <div ref={ref} style={{ minHeight: 600 }}>{show && <MapViewLazy />}</div>
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero section with search */}
      <section className="relative bg-gradient-to-br from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Plateforme B2B Zones Industrielles
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez et réservez des zones industrielles, parcs logistiques et zones franches
              à travers le Maroc. Votre partenaire pour l'implantation industrielle.
            </p>
          </div>

          <SearchBar />
        </div>
      </section>

      {/* Map section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Carte Interactive des Zones
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explorez géographiquement les zones industrielles disponibles.
              Cliquez sur les marqueurs pour voir les détails et tracer vos parcelles.
            </p>
          </div>

          <LazyMapView />
        </div>
      </section>

      {/* Zones grid section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <ZoneGrid />
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Notre Plateforme B2B ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Localisation Stratégique</h3>
              <p className="text-gray-600">
                Zones implantées dans les régions industrielles clés du Maroc avec accès privilégié aux infrastructures.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Infrastructure Complète</h3>
              <p className="text-gray-600">
                Électricité, eau, assainissement, télécommunications et routes d'accès déjà disponibles.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Accompagnement B2B</h3>
              <p className="text-gray-600">
                Service dédié aux entreprises avec accompagnement personnalisé pour votre projet d'implantation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
