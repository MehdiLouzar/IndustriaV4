"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Ruler, Factory, Phone, Eye } from 'lucide-react'
import { fetchApi } from '@/lib/utils'

const ZONES_PER_PAGE = 12 // Réduit pour éviter surcharge

interface IndustrialZone {
  id: string
  name: string
  description: string
  location: string
  area: string
  price: string
  type: string
  status: string
  deliveryDate?: string
  image?: string
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Disponible':
      return 'bg-green-100 text-green-800'
    case 'Showroom':
      return 'bg-blue-100 text-blue-800'
    case 'Occupé':
      return 'bg-gray-100 text-gray-800'
    case 'Réservé':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function ZoneGrid() {
  const [zones, setZones] = useState<IndustrialZone[]>([]) // ✅ Initialisé avec un tableau vide
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memoryStart, setMemoryStart] = useState(0)
  const [memoryCurrent, setMemoryCurrent] = useState(0)

  // 🔍 Monitoring mémoire
  useEffect(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const startMem = Math.round((performance as any).memory.usedJSHeapSize / 1048576)
      setMemoryStart(startMem)
      console.log(`🧪 ZoneGrid - Mémoire au démarrage: ${startMem}MB`)
    }

    const monitor = setInterval(() => {
      if (typeof window !== 'undefined' && 'memory' in performance) {
        const currentMem = Math.round((performance as any).memory.usedJSHeapSize / 1048576)
        setMemoryCurrent(currentMem)
        const delta = currentMem - memoryStart
        console.log(`🔍 ZoneGrid - Mémoire: ${currentMem}MB (Δ${delta >= 0 ? '+' : ''}${delta}MB)`)
      }
    }, 3000)

    return () => clearInterval(monitor)
  }, [memoryStart])

  const loadZones = async (page: number) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 Chargement zones page ${page}...`)
      const response = await fetchApi<{ zones: IndustrialZone[]; totalPages: number }>(
        `/api/zones?page=${page}&limit=${ZONES_PER_PAGE}`
      )
      
      if (response) {
        // ✅ Vérification plus robuste des données reçues
        let zonesData: IndustrialZone[] = []
        
        if (response.zones && Array.isArray(response.zones)) {
          zonesData = response.zones
        } else if (Array.isArray(response)) {
          // Si response est directement un tableau
          zonesData = response as unknown as IndustrialZone[]
        } else {
          console.warn('⚠️ Format de données inattendu:', response)
          zonesData = []
        }
        
        console.log(`✅ ${zonesData.length} zones chargées`)
        setZones(zonesData)
        setTotalPages(response.totalPages || Math.ceil(zonesData.length / ZONES_PER_PAGE) || 1)
      } else {
        console.warn('⚠️ Pas de données reçues, utilisation données de fallback')
        // Données de fallback pour éviter page vide
        setZones([
          {
            id: 'demo-1',
            name: 'Zone Industrielle Demo',
            description: 'Zone de démonstration avec toutes commodités',
            location: 'Casablanca, Maroc',
            area: '10,000 m²',
            price: '2,500 DH/m²',
            type: 'Zone Privée',
            status: 'Disponible'
          }
        ])
        setTotalPages(1)
      }
    } catch (err) {
      console.error('❌ Erreur chargement zones:', err)
      setError('Erreur de chargement des zones')
      // ✅ Même en cas d'erreur, on s'assure que zones reste un tableau
      setZones([
        {
          id: 'fallback-1',
          name: 'Zone Exemple',
          description: 'Données de démonstration (erreur API)',
          location: 'Exemple, Maroc',
          area: '5,000 m²',
          price: 'Prix sur demande',
          type: 'Zone Exemple',
          status: 'Disponible'
        }
      ])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadZones(currentPage)
  }, [currentPage])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div>🧪 Test chargement ZoneGrid...</div>
        <div className="text-sm text-gray-500 mt-2">
          {memoryStart > 0 && `Mémoire: ${memoryCurrent || memoryStart}MB`}
        </div>
      </div>
    )
  }

  // ✅ Vérification de sécurité supplémentaire avant le rendu
  const safeZones = Array.isArray(zones) ? zones : []

  return (
    <div className="space-y-6">
      {/* 🧪 Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <div>
            <strong>🧪 ZoneGrid Sans react-window:</strong> {safeZones.length} zones
            {!Array.isArray(zones) && <span className="text-red-600 ml-2">⚠️ ZONES PAS ARRAY!</span>}
          </div>
          <div className="space-x-4">
            <span>Départ: {memoryStart}MB</span>
            <span>Actuel: {memoryCurrent}MB</span>
            <span className={memoryCurrent - memoryStart > 30 ? 'text-red-600 font-bold' : 'text-green-600'}>
              Δ{memoryCurrent - memoryStart >= 0 ? '+' : ''}{memoryCurrent - memoryStart}MB
            </span>
          </div>
        </div>
        {error && (
          <div className="text-red-600 text-sm mt-2">⚠️ {error}</div>
        )}
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{safeZones.length} zones industrielles</h2>
        <div className="text-sm text-gray-500">
          Version simplifiée sans react-window pour éviter les crashs
        </div>
      </div>

      {/* 🎯 GRILLE SIMPLE CSS (sans react-window) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {safeZones.map((zone) => (
          <Card key={zone.id} className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              {zone.image ? (
                <Image
                  src={zone.image}
                  alt={zone.name}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Factory className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <Badge className={getStatusColor(zone.status)}>{zone.status}</Badge>
              </div>
              {zone.deliveryDate && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-white/90 text-gray-700">
                    Livraison {zone.deliveryDate}
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader className="pb-3">
              <h3 className="font-bold text-lg leading-tight text-gray-900 hover:text-red-600 transition-colors">
                {zone.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">{zone.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="truncate">{zone.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Ruler className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{zone.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Factory className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="truncate">{zone.type}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="font-semibold text-gray-900">{zone.price}</p>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  <Link href={`/zones/${zone.id}`}>
                    <Eye className="w-4 h-4 mr-1" /> Voir
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="w-4 h-4 mr-1" /> Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si pas de zones */}
      {safeZones.length === 0 && !loading && (
        <div className="text-center py-12">
          <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 mb-4">Aucune zone disponible</div>
          <Button onClick={() => loadZones(currentPage)}>
            Réessayer
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            ← Précédent
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="px-3 py-2 bg-gray-100 rounded text-sm">
              Page {currentPage} / {totalPages}
            </span>
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Debug final */}
      <div className="text-center text-xs text-gray-500 pt-4">
        🧪 Version sans react-window - Impact mémoire: {memoryCurrent - memoryStart}MB
        {memoryCurrent - memoryStart > 30 && (
          <span className="text-red-600 font-bold"> - CRITIQUE!</span>
        )}
        {memoryCurrent - memoryStart <= 10 && (
          <span className="text-green-600"> - EXCELLENT ✅</span>
        )}
      </div>
    </div>
  )
}