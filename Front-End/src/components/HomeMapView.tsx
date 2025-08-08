'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Link from 'next/link'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  type LatLngTuple,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/map.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { TrainFront, Ship, Plane, MapPin, Building2, Grid3X3, Ruler, DollarSign, MapPinned, Factory, Phone, Eye } from 'lucide-react'
import type { FeatureCollection } from 'geojson'

import DynamicIcon from '@/components/DynamicIcon'
import { Button } from '@/components/ui/button'
import { fetchPublicApi } from '@/lib/publicApi'

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

/*************************
 *  Types & Constants    *
 *************************/

type ZoneFeature = {
  polygon: [number, number][]
  centroid: [number, number]
  properties: {
    id: string
    name: string
    status: string
    availableParcels: number
    totalParcels?: number
    activityIcons: string[]
    amenityIcons: string[]
    description?: string
    price?: string
    area?: string
    location?: string
    type?: string
  }
}

type ZoneFeatureResp = {
  coordinates: [number, number][]
  id: string
  name: string
  status: string
  availableParcels: number
  totalParcels?: number
  activityIcons: string[]
  amenityIcons: string[]
  description?: string
  price?: string
  area?: string
  location?: string
  type?: string
}

type Poi = {
  id: string
  coordinates: [number, number]
  type: 'station' | 'port' | 'airport'
  name: string
}

const DEMO_POIS: readonly Poi[] = [
  {
    id: 'casa-port',
    coordinates: [33.6022, -7.6324],
    type: 'port',
    name: 'Port de Casablanca',
  },
  {
    id: 'casa-airport',
    coordinates: [33.3665, -7.5897],
    type: 'airport',
    name: 'Aéroport Mohammed V',
  },
  {
    id: 'rabat-station',
    coordinates: [34.0209, -6.8417],
    type: 'station',
    name: 'Gare de Rabat',
  },
  {
    id: 'tanger-port',
    coordinates: [35.7595, -5.833],
    type: 'port',
    name: 'Port Tanger Med',
  },
  {
    id: 'marrakech-airport',
    coordinates: [31.6056, -8.0361],
    type: 'airport',
    name: 'Aéroport Marrakech',
  },
  {
    id: 'agadir-port',
    coordinates: [30.4278, -9.5981],
    type: 'port',
    name: "Port d'Agadir",
  },
]

const TYPE_LABELS: Record<Poi['type'], string> = {
  station: 'Gare',
  port: 'Port',
  airport: 'Aéroport',
}

/**
 * Statut → label / couleur
 * (vous pouvez déplacer ces constantes dans un autre fichier si déjà existantes)
 */
const STATUS_LABELS: Record<string, string> = {
  LIBRE: 'Libre',
  RESERVE: 'Réservée',
  VENDU: 'Vendue',
  INDISPONIBLE: 'Indisponible',
  DEVELOPPEMENT: 'En développement',
}

const STATUS_COLORS: Record<string, string> = {
  LIBRE: 'text-green-600',
  RESERVE: 'text-yellow-600',
  VENDU: 'text-red-600',
  INDISPONIBLE: 'text-gray-600',
  DEVELOPPEMENT: 'text-blue-600',
}

// Données de fallback minimales pour éviter le lag
const FALLBACK_ZONES: ZoneFeature[] = [
  {
    polygon: [
      [33.5831, -7.5998],
      [33.5831, -7.5798],
      [33.5631, -7.5798],
      [33.5631, -7.5998],
    ],
    centroid: [33.5731, -7.5898],
    properties: {
      id: 'fallback-casa',
      name: 'Zone Demo Casablanca',
      status: 'LIBRE',
      availableParcels: 5,
      totalParcels: 10,
      activityIcons: ['Factory'],
      amenityIcons: ['Zap'],
      description: 'Zone de démonstration avec toutes les commodités nécessaires pour votre activité industrielle',
      price: '2 500 DH/m²',
      area: '10 000 m²',
      location: 'Casablanca',
      type: 'Zone Privée',
    },
  },
  {
    polygon: [
      [34.0309, -6.8517],
      [34.0309, -6.8317],
      [34.0109, -6.8317],
      [34.0109, -6.8517],
    ],
    centroid: [34.0209, -6.8417],
    properties: {
      id: 'fallback-rabat',
      name: 'Zone Demo Rabat',
      status: 'LIBRE',
      availableParcels: 3,
      totalParcels: 8,
      activityIcons: ['Cpu'],
      amenityIcons: ['Wifi'],
      description: 'Zone technologique moderne dédiée à l\'innovation avec infrastructures de pointe',
      price: '3 000 DH/m²',
      area: '8 000 m²',
      location: 'Rabat',
      type: 'Parc Technologique',
    },
  },
]

/*********************
 *  Composants carte  *
 *********************/

export default function HomeMapView() {
  /** ÉTAT */
  const [zones, setZones] = useState<ZoneFeature[]>([])
  const [pois] = useState<Poi[]>(DEMO_POIS)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  /** RÉFÉRENCES */
  const mapRef = useRef<L.Map | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const zoneCache = useRef<Map<number, ZoneFeature[]>>(new Map())
  const lastLoad = useRef(0)
  
  /** CONSTANTES DE CACHE */
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /** ICONES MEMO */
  const ICONS = useMemo(() => {
    return {
      station: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-industria-olive-light p-1 rounded-full border-2 border-white shadow-lg">
            <TrainFront width={14} height={14} stroke="white" />
          </div>,
        ),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      port: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-industria-black p-1 rounded-full border-2 border-white shadow-lg">
            <Ship width={14} height={14} stroke="white" />
          </div>,
        ),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      airport: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-industria-yellow-gold p-1 rounded-full border-2 border-white shadow-lg">
            <Plane width={14} height={14} stroke="white" />
          </div>,
        ),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      // Icône pour le centre d'une zone (pin plus grand avec icône)
      zone: L.divIcon({
        html: renderToStaticMarkup(
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-industria-brown-gold border-2 border-white shadow-lg flex items-center justify-center">
              <MapPin width={16} height={16} stroke="white" fill="white" />
            </div>
          </div>
        ),
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    } as const
  }, [])

  /*************************
   *  Composants internes  *
   *************************/

  /** Fonction pour obtenir la couleur du statut */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible':
      case 'LIBRE':
        return 'bg-green-100 text-green-800'
      case 'Occupé':
      case 'OCCUPE':
        return 'bg-industria-gray-light text-industria-brown-gold'
      case 'Réservé':
      case 'RESERVE':
        return 'bg-orange-100 text-orange-800'
      case 'VENDU':
        return 'bg-red-100 text-red-800'
      case 'INDISPONIBLE':
        return 'bg-gray-100 text-gray-800'
      case 'DEVELOPPEMENT':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  /** Marqueur d'une zone */
  const ZoneMarker = React.memo(function ZoneMarker({ zone }: { zone: ZoneFeature }) {
    return (
      <Marker position={zone.centroid} icon={ICONS.zone}>
        <Popup maxWidth={456} className="zone-popup" closeButton={false}>
          {/* Popup de zone avec contenu spécifique */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 m-0">
            {/* Contenu de la popup */}
            <div className="p-4 space-y-3">
              {/* 1. Nom de la zone (titre en gras) */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg leading-tight text-gray-900 flex-1">
                  {zone.properties.name}
                </h3>
                {/* 2. Badge de statut coloré */}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(zone.properties.status)}`}>
                  {STATUS_LABELS[zone.properties.status] || zone.properties.status}
                </span>
              </div>

              {/* 3. Courte description */}
              {zone.properties.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {zone.properties.description}
                </p>
              )}

              {/* Informations organisées */}
              <div className="space-y-2 text-sm">
                {/* 4. Localisation (ville ou région) */}
                {zone.properties.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
                    <span>{zone.properties.location}</span>
                  </div>
                )}
                
                {/* 5. Superficie */}
                {zone.properties.area && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Ruler className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
                    <span>{zone.properties.area}</span>
                  </div>
                )}
                
                {/* 6. Type de zone */}
                {zone.properties.type && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building2 className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
                    <span>{zone.properties.type}</span>
                  </div>
                )}
                
                {/* 7. Parcelles disponibles / totales */}
                {(zone.properties.totalParcels !== undefined && zone.properties.availableParcels !== undefined) && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Grid3X3 className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
                    <span>
                      {zone.properties.availableParcels} / {zone.properties.totalParcels} parcelles disponibles
                    </span>
                  </div>
                )}
              </div>

              {/* 8. Prix (s'il est fourni) */}
              {zone.properties.price && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-industria-brown-gold" />
                    <span className="font-semibold text-gray-900">{zone.properties.price}</span>
                  </div>
                </div>
              )}

              {/* 9. Boutons d'action */}
              <div className="flex gap-2 pt-2">
                {zone.properties.id.startsWith('demo-') ||
                zone.properties.id.startsWith('fallback-') ? (
                  <Button size="sm" className="flex-1 bg-gray-400 text-white cursor-not-allowed" disabled>
                    <Eye className="w-4 h-4 mr-1" /> Démonstration
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 bg-industria-brown-gold hover:bg-industria-olive-light text-white"
                    >
                      <Link href={`/zones/${zone.properties.id}`}>
                        <Eye className="w-4 h-4 mr-1" /> Voir
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover:bg-industria-gray-light hover:border-industria-brown-gold"
                    >
                      <Phone className="w-4 h-4 mr-1" /> Contact
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Popup>
      </Marker>
    )
  })

  /** Marqueur d'un POI (port, gare, aéroport) */
  const PoiMarker = React.memo(function PoiMarker({ poi }: { poi: Poi }) {
    return (
      <Marker position={poi.coordinates} icon={ICONS[poi.type]}>
        <Popup>
          <div className="text-center space-y-1 p-1">
            <div className="font-semibold text-sm">{TYPE_LABELS[poi.type]}</div>
            <div className="text-xs text-gray-600">{poi.name}</div>
          </div>
        </Popup>
      </Marker>
    )
  })

// ————————————————————————————————————————————————————————
//  Data loading (LOD + WebWorker)
// ————————————————————————————————————————————————————————
const loadZones = useCallback(async (precision: number, force = false) => {
  // Simple time-based cache
  if (!force && Date.now() - lastLoad.current < CACHE_DURATION) {
    const cached = zoneCache.current.get(precision);
    if (cached) {
      setZones(cached);
      return;
    }
  }
  
  // Abort previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();
  setLoading(true);
  setError(null);

  try {
    // Simplified timeout without AbortSignal.any
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 8000); // 8 seconds timeout

    const resp = await fetchPublicApi<{ features: ZoneFeatureResp[] }>(
      `/api/map/zones/simplified?zoom=${precision}`,
      { signal: abortControllerRef.current.signal }
    );
    
    clearTimeout(timeoutId);
    let data: ZoneFeature[] = []
    if (resp?.features) {
      data = resp.features.map((f) => {
        const poly = f.coordinates.map((c) => [c[0], c[1]] as LatLngTuple)
        const centroid: LatLngTuple = [
          poly.reduce((sum, p) => sum + p[0], 0) / poly.length,
          poly.reduce((sum, p) => sum + p[1], 0) / poly.length,
        ]
        return {
          polygon: poly,
          centroid,
          properties: {
            id: f.id,
            name: f.name,
            status: f.status,
            availableParcels: f.availableParcels,
            totalParcels: f.totalParcels,
            activityIcons: f.activityIcons || [],
            amenityIcons: f.amenityIcons || [],
            description: f.description,
            price: f.price,
            area: f.area,
            location: f.location,
            type: f.type,
          },
        }
      })
    }
    zoneCache.current.set(precision, data)
    setZones(data.length ? data : FALLBACK_ZONES)
    lastLoad.current = Date.now()
  } catch (err) {
    // Ignorer seulement les erreurs d'annulation explicites
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.log('Requête annulée normalement');
      return;
    }
    
    console.error('Erreur de chargement des zones:', {
      error: err,
      message: err instanceof Error ? err.message : 'Unknown error',
      name: err instanceof Error ? err.name : 'Unknown',
      stack: err instanceof Error ? err.stack : 'No stack'
    });
    setError('Impossible de charger les zones, utilisation des données de démonstration');
    setZones(FALLBACK_ZONES);
  } finally {
    setLoading(false);
  }
}, [])

  // Chargement initial des zones simplifié
  useEffect(() => {
    loadZones(10) // Chargement unique au montage
  }, [loadZones])

  // Nettoyage des AbortController au démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute top-4 right-4 z-50 bg-industria-brown-gold text-white px-3 py-1 rounded-md shadow-lg">
          Chargement des zones...
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 right-4 z-50 bg-red-500 text-white px-3 py-1 rounded-md shadow-lg">
          {error}
        </div>
      )}

      <MapContainer
        key="home-map-view" // Clé unique pour éviter les conflits
        center={[31.7917, -7.0926]} // Centre du Maroc
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance
          // Invalidation de taille pour s'assurer du bon rendu
          setTimeout(() => mapInstance.invalidateSize(), 100)
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Affichage des zones avec clustering personnalisé */}
        <MarkerClusterGroup
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount()
            let size = 'small'
            let bgColor = '#A79059' // industria-brown-gold
            
            if (count >= 100) {
              size = 'large'
              bgColor = '#8C6B2F'
            } else if (count >= 10) {
              size = 'medium'
              bgColor = '#9B8B46'
            }
            
            const sizeClasses = {
              small: 'w-8 h-8 text-xs',
              medium: 'w-10 h-10 text-sm',
              large: 'w-12 h-12 text-base'
            }
            
            return L.divIcon({
              html: renderToStaticMarkup(
                <div 
                  className={`rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-white ${sizeClasses[size as keyof typeof sizeClasses]}`}
                  style={{ backgroundColor: bgColor }}
                >
                  {count}
                </div>
              ),
              className: '',
              iconSize: size === 'large' ? [48, 48] : size === 'medium' ? [40, 40] : [32, 32],
              iconAnchor: size === 'large' ? [24, 24] : size === 'medium' ? [20, 20] : [16, 16],
            })
          }}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {zones.map((zone) => (
            <ZoneMarker key={`home-zone-${zone.properties.id}`} zone={zone} />
          ))}
        </MarkerClusterGroup>

        {/* Affichage des POIs (ports, gares, aéroports) */}
        {pois.map((poi) => (
          <PoiMarker key={`home-poi-${poi.id}`} poi={poi} />
        ))}
      </MapContainer>
    </div>
  )
}
