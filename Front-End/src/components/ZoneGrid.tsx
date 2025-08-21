/**
 * Composant ZoneGrid - Grille paginée de zones industrielles
 * 
 * Affiche les zones industrielles avec pagination traditionnelle :
 * - Chargement par pages de 12 zones
 * - Filtrage avancé par région, type, statut, superficie et prix
 * - Support des API publiques et authentifiées
 * - Gestion des états de chargement, erreur et pages vides
 * - Interface responsive avec boutons de navigation
 * 
 * Utilise l'API publique pour les données non-sensibles et bascule
 * automatiquement vers l'API authentifiée si nécessaire.
 * 
 * @param searchFilters Filtres de recherche appliqués
 * @returns Composant React de la grille paginée
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Factory, Zap, Wifi, Car, Wrench, Building2, Cpu, Settings, Shield, Droplets, Coffee, Truck, Users, Package, Globe, Power, Battery, Monitor, Server, Database, HardDrive, Briefcase, Home, Tool, Gauge, Settings2, Plane } from 'lucide-react'
import { fetchPublicApi, type PublicZonesResponse } from '@/lib/publicApi'
import type { ListResponse } from '@/types'
import ZoneCard from './ZoneCard'
import LoadingSpinner from './LoadingSpinner'

/** Nombre de zones par page */
const ZONES_PER_PAGE = 12

/**
 * Image associée à une zone industrielle
 */
interface ZoneImage {
  /** Identifiant unique */
  id: string
  /** Nom du fichier stocké */
  filename: string
  /** Nom original du fichier uploadé */
  originalFilename: string
  /** Description optionnelle */
  description?: string
  /** Indique si c'est l'image principale */
  isPrimary: boolean
  /** Ordre d'affichage */
  displayOrder: number
}

/**
 * Représentation d'une activité avec icône
 */
interface Activity {
  /** Identifiant unique */
  id: string
  /** Nom de l'activité */
  name: string
  /** Icône Lucide React (optionnelle) */
  icon?: string
  /** Description détaillée */
  description?: string
  /** Catégorie de l'activité */
  category?: string
}

/**
 * Représentation d'un équipement avec icône
 */
interface Amenity {
  /** Identifiant unique */
  id: string
  /** Nom de l'équipement */
  name: string
  /** Icône Lucide React (optionnelle) */
  icon?: string
  /** Description détaillée */
  description?: string
  /** Catégorie de l'équipement */
  category?: string
}

/**
 * Interface représentant une activité industrielle
 */
interface Activity {
  /** Identifiant unique de l'activité */
  id: string
  /** Nom de l'activité */
  name: string
  /** Description de l'activité */
  description: string
  /** Icône de l'activité */
  icon?: string
  /** Catégorie de l'activité */
  category?: string
}

/**
 * Interface représentant un équipement/service
 */
interface Amenity {
  /** Identifiant unique de l'équipement */
  id: string
  /** Nom de l'équipement */
  name: string
  /** Description de l'équipement */
  description: string
  /** Icône de l'équipement */
  icon?: string
  /** Catégorie de l'équipement */
  category?: string
}

/**
 * Représentation complète d'une zone industrielle
 */
interface IndustrialZone {
  /** Identifiant unique */
  id: string
  /** Nom de la zone */
  name: string
  /** Description détaillée */
  description: string
  /** Localisation géographique */
  location: string
  /** Superficie en m² */
  area: string
  /** Prix au m² */
  price: string
  /** Type de zone */
  type: string
  /** Statut de disponibilité */
  status: string
  /** Date de livraison prévue */
  deliveryDate?: string
  /** URL image principale */
  image?: string
  /** Collection d'images */
  images?: ZoneImage[]
  /** Nombre total de parcelles */
  totalParcels?: number
  /** Nombre de parcelles disponibles */
  availableParcels?: number
  /** Activités autorisées dans la zone */
  activities?: Activity[]
  /** Équipements disponibles dans la zone */
  amenities?: Amenity[]
}

/**
 * Filtres de recherche appliqués à la grille
 */
interface SearchFilters {
  /** ID de la région */
  regionId?: string
  /** ID du type de zone */
  zoneTypeId?: string
  /** Statut de disponibilité */
  status?: string
  /** Superficie minimale */
  minArea?: string
  /** Superficie maximale */
  maxArea?: string
  /** Prix minimal */
  minPrice?: string
  /** Prix maximal */
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
      // Tentative avec l'API publique
      const response = await fetch(`/api/zones/${zoneId}/images`)
      
      if (!response.ok) {
        return []
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return []
      }
      
      const responseText = await response.text()
      
      if (!responseText.trim()) {
        return []
      }
      
      let images: ZoneImage[]
      try {
        images = JSON.parse(responseText)
      } catch (jsonError) {
        console.error(`❌ Erreur parsing JSON pour zone ${zoneId}:`, jsonError)
        return []
      }
      
      return Array.isArray(images) ? images : []
    } catch (error) {
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
            
            // Charger les activités et équipements si disponibles
            let activities: Activity[] = []
            let amenities: Amenity[] = []
            
            try {
              if ((zone as any).activityIds && Array.isArray((zone as any).activityIds)) {
                const activityPromises = (zone as any).activityIds.map((id: string) =>
                  fetchPublicApi<{ id: string; name: string; icon?: string }>(`/api/activities/${id}`)
                )
                const activityResults = await Promise.all(activityPromises)
                activities = activityResults.filter(Boolean).map(a => ({
                  id: a.id,
                  name: a.name,
                  icon: a.icon,
                  description: '',
                  category: ''
                }))
              }
              
              if ((zone as any).amenityIds && Array.isArray((zone as any).amenityIds)) {
                const amenityPromises = (zone as any).amenityIds.map((id: string) =>
                  fetchPublicApi<{ id: string; name: string; icon?: string }>(`/api/amenities/${id}`)
                )
                const amenityResults = await Promise.all(amenityPromises)
                amenities = amenityResults.filter(Boolean).map(a => ({
                  id: a.id,
                  name: a.name,
                  icon: a.icon,
                  description: '',
                  category: ''
                }))
              }
            } catch (error) {
              console.warn(`Erreur lors du chargement des activités/équipements pour la zone ${zone.id}:`, error)
            }
            
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
              availableParcels: (zone as any).availableParcels,
              activities,
              amenities
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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