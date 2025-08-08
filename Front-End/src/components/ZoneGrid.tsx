"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Factory } from 'lucide-react'
import { fetchPublicApi, type PublicZonesResponse } from '@/lib/publicApi'
import type { ListResponse } from '@/types'
import ZoneCard from './ZoneCard'
import LoadingSpinner from './LoadingSpinner'

const ZONES_PER_PAGE = 12

interface ZoneImage {
  id: string
  filename: string
  originalFilename: string
  description?: string
  isPrimary: boolean
  displayOrder: number
}

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
  images?: ZoneImage[]
  totalParcels?: number
  availableParcels?: number
}

interface SearchFilters {
  regionId?: string
  zoneTypeId?: string
  status?: string
  minArea?: string
  maxArea?: string
  minPrice?: string
  maxPrice?: string
}

export default function ZoneGrid({ searchFilters }: { searchFilters?: SearchFilters }) {
  const [zones, setZones] = useState<IndustrialZone[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fonction pour charger les images d'une zone
  const loadZoneImages = useCallback(async (zoneId: string): Promise<ZoneImage[]> => {
    try {
      const images = await fetchPublicApi<ZoneImage[]>(`/api/zones/${zoneId}/images`)
      return images || []
    } catch (error) {
      console.warn(`Erreur chargement images zone ${zoneId}:`, error)
      return []
    }
  }, [])

  const loadZones = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)
    
    try {
      // Construire l'URL avec les filtres
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ZONES_PER_PAGE.toString()
      })

      // Ajouter les filtres s'ils existent
      if (searchFilters?.regionId) params.append('regionId', searchFilters.regionId)
      if (searchFilters?.zoneTypeId) params.append('zoneTypeId', searchFilters.zoneTypeId)
      if (searchFilters?.status) params.append('status', searchFilters.status)
      if (searchFilters?.minArea) params.append('minArea', searchFilters.minArea)
      if (searchFilters?.maxArea) params.append('maxArea', searchFilters.maxArea)
      if (searchFilters?.minPrice) params.append('minPrice', searchFilters.minPrice)
      if (searchFilters?.maxPrice) params.append('maxPrice', searchFilters.maxPrice)
      
      const response = await fetchPublicApi<PublicZonesResponse>(
        `/api/zones?${params.toString()}`
      )

      if (response?.items) {
        // Adapter les données publiques vers le format IndustrialZone avec formatage correct
        const zonesWithImages: IndustrialZone[] = await Promise.all(
          response.items.map(async (zone) => {
          // Formatter la superficie
          const formatArea = (area: any) => {
            if (!area) return 'Surface non spécifiée'
            const numArea = typeof area === 'string' ? parseFloat(area) : area
            return isNaN(numArea) ? 'Surface non spécifiée' : `${numArea.toLocaleString()} m²`
          }
          
          // Formatter le prix
          const formatPrice = (price: any) => {
            if (!price) return 'Prix sur demande'
            const numPrice = typeof price === 'string' ? parseFloat(price) : price
            return isNaN(numPrice) ? 'Prix sur demande' : `${numPrice} DH/m²`
          }
          
          // Récupérer le type depuis les propriétés de zone (ex: region, zoneType)
          const getZoneType = (zone: any) => {
            // Si on a directement le type
            if (zone.type) return zone.type
            // Mapper les IDs vers des noms lisibles
            if (zone.zoneTypeId) {
              const typeMap: { [key: string]: string } = {
                'zt-private': 'Zone Privée',
                'zt-public': 'Zone Publique', 
                'zt-free-zone': 'Zone Franche',
                'zt-logistics': 'Parc Logistique'
              }
              return typeMap[zone.zoneTypeId] || 'Zone Industrielle'
            }
            // Mapper les régions vers des noms lisibles  
            if (zone.regionId) {
              const regionMap: { [key: string]: string } = {
                'region-cas': 'Casablanca-Settat',
                'region-rab': 'Rabat-Salé-Kénitra', 
                'region-mar': 'Marrakech-Safi',
                'region-tan': 'Tanger-Tétouan-Al Hoceima'
              }
              return `Zone de ${regionMap[zone.regionId] || zone.regionId}`
            }
            return 'Zone Industrielle'
          }
            // Charger les images de la zone
            const zoneImages = await loadZoneImages(zone.id)
            
            return {
              id: zone.id,
              name: zone.name,
              description: zone.description || 'Description non disponible',
              location: (zone as any).address || zone.location || 'Localisation non disponible',
              area: formatArea((zone as any).totalArea || zone.area),
              price: formatPrice(zone.price),
              type: getZoneType(zone),
              status: zone.status === 'LIBRE' ? 'Disponible' : 
                     zone.status === 'RESERVE' ? 'Réservée' : 
                     zone.status === 'VENDU' ? 'Vendue' : 
                     zone.status === 'DEVELOPPEMENT' ? 'En développement' :
                     zone.status || 'Statut inconnu',
              deliveryDate: undefined,
              image: undefined,
              images: zoneImages,
              totalParcels: (zone as any).totalParcels,
              availableParcels: (zone as any).availableParcels
            }
          })
        )

        setZones(zonesWithImages)
        setTotalPages(response.totalPages || Math.ceil(zonesWithImages.length / ZONES_PER_PAGE) || 1)
      } else {
        // Données de fallback pour éviter page vide
        setZones([
          {
            id: 'demo-1',
            name: 'Zone Industrielle Demo',
            description: 'Zone de démonstration avec toutes les commodités nécessaires pour votre activité industrielle.',
            location: 'Casablanca, Maroc',
            area: '10,000 m²',
            price: '2,500 DH/m²',
            type: 'Zone Privée',
            status: 'Disponible'
          },
          {
            id: 'demo-2',
            name: 'Parc Technologique Rabat',
            description: 'Espace moderne dédié aux technologies et à l\'innovation avec infrastructures de pointe.',
            location: 'Rabat-Salé, Maroc',
            area: '15,000 m²',
            price: '3,200 DH/m²',
            type: 'Parc Technologique',
            status: 'Disponible'
          }
        ])
        setTotalPages(1)
      }
    } catch (err) {
      setError('Erreur de chargement des zones')
      setZones([
        {
          id: 'fallback-1',
          name: 'Zone Exemple',
          description: 'Données de démonstration - Contactez-nous pour plus d\'informations.',
          location: 'Maroc',
          area: '5,000 m²',
          price: 'Prix sur demande',
          type: 'Zone Industrielle',
          status: 'Disponible'
        }
      ])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [loadZoneImages, searchFilters])

  useEffect(() => {
    loadZones(currentPage)
  }, [currentPage, loadZones])

  // Reset to page 1 when search filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchFilters])

  const safeZones = useMemo(() => Array.isArray(zones) ? zones : [], [zones])

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
  }, [])

  const handleRetry = useCallback(() => {
    loadZones(currentPage)
  }, [currentPage, loadZones])

  if (loading) {
    return (
      <LoadingSpinner 
        size="lg"
        message="Chargement des zones industrielles..."
        className="py-16"
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header avec compteur */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {safeZones.length > 0 ? `${safeZones.length} zone${safeZones.length > 1 ? 's' : ''} disponible${safeZones.length > 1 ? 's' : ''}` : 'Zones industrielles'}
        </h2>
        <p className="text-gray-600">
          Trouvez l'espace idéal pour développer votre activité industrielle
        </p>
        {error && (
          <div className="mt-4 p-3 bg-industria-gray-light border border-industria-brown-gold rounded-lg text-industria-brown-gold text-sm">
            {error}. Les données affichées sont des exemples.
          </div>
        )}
      </div>

      {/* Grille de cartes optimisée */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {safeZones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}
      </div>

      {/* Message si pas de zones */}
      {safeZones.length === 0 && !loading && (
        <div className="text-center py-16">
          <Factory className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune zone disponible</h3>
          <p className="text-gray-500 mb-6">
            Nous n'avons trouvé aucune zone correspondant à vos critères.
          </p>
          <Button 
            onClick={handleRetry}
            className="bg-industria-brown-gold hover:bg-industria-olive-light text-white"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Pagination améliorée */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="hover:bg-industria-gray-light hover:border-industria-brown-gold"
          >
            ← Précédent
          </Button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={currentPage === pageNum ? "bg-industria-brown-gold hover:bg-industria-olive-light" : "hover:bg-industria-gray-light hover:border-industria-brown-gold"}
                >
                  {pageNum}
                </Button>
              )
            })}
            {totalPages > 5 && (
              <>
                <span className="text-gray-500">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className={currentPage === totalPages ? "bg-industria-brown-gold hover:bg-industria-olive-light" : "hover:bg-industria-gray-light hover:border-industria-brown-gold"}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="hover:bg-industria-gray-light hover:border-industria-brown-gold"
          >
            Suivant →
          </Button>
        </div>
      )}
    </div>
  )
}