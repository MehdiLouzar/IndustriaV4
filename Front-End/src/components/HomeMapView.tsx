'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Link from 'next/link'
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-markercluster/styles'
import '@/styles/map.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
import { fetchPublicApi } from '@/lib/publicApi'
import DynamicIcon from '@/components/DynamicIcon'
import { TrainFront, Ship, Plane, Factory, MapPin, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Données de démonstration pour les centres d'intérêt
const DEMO_POIS = [
  { id: 'casa-port', coordinates: [33.6022, -7.6324], type: 'port', name: 'Port de Casablanca' },
  { id: 'casa-airport', coordinates: [33.3665, -7.5897], type: 'airport', name: 'Aéroport Mohammed V' },
  { id: 'rabat-station', coordinates: [34.0209, -6.8417], type: 'station', name: 'Gare de Rabat' },
  { id: 'tanger-port', coordinates: [35.7595, -5.8330], type: 'port', name: 'Port Tanger Med' },
  { id: 'marrakech-airport', coordinates: [31.6056, -8.0361], type: 'airport', name: 'Aéroport Marrakech' },
  { id: 'agadir-port', coordinates: [30.4278, -9.5981], type: 'port', name: 'Port d\'Agadir' },
] as const

type ZoneFeature = {
  polygon: [number, number][]
  centroid: [number, number]
  properties: {
    id: string
    name: string
    status: string
    availableParcels: number
    activityIcons: string[]
    amenityIcons: string[]
    description?: string
    price?: string
    area?: string
    location?: string
  }
}

type ZoneFeatureResp = {
  coordinates: [number, number][]
  id: string
  name: string
  status: string
  availableParcels: number
  activityIcons: string[]
  amenityIcons: string[]
  description?: string
  price?: string
  area?: string
  location?: string
}

type Poi = { 
  id: string
  coordinates: [number, number]
  type: 'station' | 'port' | 'airport'
  name: string
}

// Constantes globales pour éviter les re-créations
const STATUS_COLORS: Record<string, string> = {
  'LIBRE': 'text-green-600',
  'DISPONIBLE': 'text-green-600', 
  'OCCUPE': 'text-industria-brown-gold',
  'RESERVE': 'text-industria-olive-light',
  'SHOWROOM': 'text-industria-yellow-gold'
}

const STATUS_LABELS: Record<string, string> = {
  'LIBRE': 'Disponible',
  'DISPONIBLE': 'Disponible',
  'OCCUPE': 'Occupé',
  'RESERVE': 'Réservé', 
  'SHOWROOM': 'Showroom'
}

const TYPE_LABELS = {
  station: 'Gare',
  port: 'Port',
  airport: 'Aéroport'
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
      activityIcons: ['Factory'],
      amenityIcons: ['Zap'],
      description: 'Zone de démonstration',
      price: '2,500 DH/m²',
      area: '10,000 m²',
      location: 'Casablanca'
    }
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
      activityIcons: ['Cpu'],
      amenityIcons: ['Wifi'],
      description: 'Zone technologique',
      price: '3,000 DH/m²',
      area: '8,000 m²',
      location: 'Rabat'
    }
  }
]

export default function HomeMapView() {
  const [zones, setZones] = useState<ZoneFeature[]>([])
  const [pois] = useState<Poi[]>(DEMO_POIS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Styles des icônes pour les POI
  const ICONS = useMemo(
    () => ({
      station: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-industria-olive-light p-1 rounded-full border-2 border-white shadow-lg">
            <TrainFront width={14} height={14} stroke="white" />
          </div>
        ),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      port: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-industria-black p-1 rounded-full border-2 border-white shadow-lg">
            <Ship width={14} height={14} stroke="white" />
          </div>
        ),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      airport: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-industria-yellow-gold p-1 rounded-full border-2 border-white shadow-lg">
            <Plane width={14} height={14} stroke="white" />
          </div>
        ),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      zone: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-industria-brown-gold p-1 rounded-full border-2 border-white shadow-lg">
            <Building2 width={14} height={14} stroke="white" />
          </div>
        ),
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    }),
    []
  )

  // Composant mémorisé pour les marqueurs de zones
  const ZoneMarker = React.memo(function ZoneMarker({ zone }: { zone: ZoneFeature }) {

    return (
      <Marker position={zone.centroid} icon={ICONS.zone}>
        <Popup maxWidth={300} className="zone-popup">
          <div className="space-y-3 p-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{zone.properties.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{zone.properties.description}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-industria-brown-gold" />
                <span className="text-gray-600">{zone.properties.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Statut:</span>
                <span className={`ml-1 font-semibold ${STATUS_COLORS[zone.properties.status] || 'text-gray-600'}`}>
                  {STATUS_LABELS[zone.properties.status] || zone.properties.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Parcelles:</span>
                <span className="ml-1 text-gray-700">{zone.properties.availableParcels}</span>
              </div>
              {zone.properties.area && (
                <div>
                  <span className="font-medium">Surface:</span>
                  <span className="ml-1 text-gray-700">{zone.properties.area}</span>
                </div>
              )}
              {zone.properties.price && (
                <div>
                  <span className="font-medium">Prix:</span>
                  <span className="ml-1 text-gray-700">{zone.properties.price}</span>
                </div>
              )}
            </div>

            {(zone.properties.activityIcons.length > 0 || zone.properties.amenityIcons.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {zone.properties.activityIcons.map((icon, i) => (
                  <DynamicIcon key={`activity-${i}`} name={icon} className="w-5 h-5 text-industria-brown-gold" />
                ))}
                {zone.properties.amenityIcons.map((icon, i) => (
                  <DynamicIcon key={`amenity-${i}`} name={icon} className="w-5 h-5 text-industria-olive-light" />
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              {zone.properties.id.startsWith('demo-') || zone.properties.id.startsWith('fallback-') ? (
                <Button 
                  size="sm" 
                  className="flex-1 bg-gray-400 text-white cursor-not-allowed" 
                  disabled
                >
                  Zone de démonstration
                </Button>
              ) : (
                <Button asChild size="sm" className="flex-1 bg-industria-brown-gold hover:bg-industria-olive-light text-white">
                  <Link href={`/zones/${zone.properties.id}`}>
                    Voir les détails
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    )
  })

  // Composant mémorisé pour les POI
  const PoiMarker = React.memo(function PoiMarker({ poi }: { poi: Poi }) {

    return (
      <Marker 
        position={poi.coordinates} 
        icon={ICONS[poi.type]}
      >
        <Popup>
          <div className="text-center space-y-1 p-1">
            <div className="font-semibold text-sm">{TYPE_LABELS[poi.type]}</div>
            <div className="text-xs text-gray-600">{poi.name}</div>
          </div>
        </Popup>
      </Marker>
    )
  })

  const zoneCache = useRef(new Map<number, ZoneFeature[]>())
  const precisionRef = useRef(-1)

  const loadZones = useCallback(async (precision: number, force = false) => {
    if (!force && zoneCache.current.has(precision)) {
      setZones(zoneCache.current.get(precision) || [])
      setLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const response = await fetchPublicApi<{ features: ZoneFeatureResp[] }>(
        `/api/map/zones/simplified?zoom=${precision}`,
        { signal: abortControllerRef.current.signal }
      )

      if (response?.features) {
        const zonesData: ZoneFeature[] = response.features.map((f) => {
          const poly = f.coordinates.map((c) => [c[0], c[1]] as [number, number])
          const center = poly.reduce<[number, number]>((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0])
          center[0] /= poly.length
          center[1] /= poly.length
          return {
            polygon: poly,
            centroid: center,
            properties: {
              id: f.id,
              name: f.name,
              status: f.status,
              availableParcels: f.availableParcels,
              activityIcons: f.activityIcons || [],
              amenityIcons: f.amenityIcons || [],
              description: f.description,
              price: f.price,
              area: f.area,
              location: f.location,
            },
          }
        })
        zoneCache.current.set(precision, zonesData)
        setZones(zonesData)
      } else {
        setZones(FALLBACK_ZONES)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Erreur lors du chargement des zones:', err)
      setError('Impossible de charger les zones. Affichage des données de démonstration.')
      setZones(FALLBACK_ZONES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const precisionFromZoom = (z: number) => {
      if (z >= 14) return 3
      if (z >= 10) return 2
      if (z >= 8) return 1
      return 0
    }

    const handleZoom = () => {
      const p = precisionFromZoom(map.getZoom())
      if (precisionRef.current !== p) {
        precisionRef.current = p
        loadZones(p)
      }
    }

    map.on('zoomend', handleZoom)
    handleZoom()

    return () => {
      map.off('zoomend', handleZoom)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [loadZones])

  useEffect(() => {
    if (!mapRef.current) return
    
    // Débouncer le resize pour éviter les appels excessifs
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 150)
    
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="relative overflow-hidden" style={{ height: 500 }}>
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto"></div>
            <p className="text-gray-600 font-medium">Chargement de la carte...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden" style={{ height: 500 }}>
      <MapContainer
        center={[31.7917, -7.0926]} // Centre du Maroc
        zoom={6}
        preferCanvas={true}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          mapRef.current = map
        }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {zones.map((z) => (
          <Polygon
            key={`poly-${z.properties.id}`}
            positions={z.polygon}
            pathOptions={{ color: '#B1936D', weight: 1, fillOpacity: 0.1 }}
          />
        ))}

        {/* Clustering optimisé pour les zones industrielles */}
        <MarkerClusterGroup
          maxClusterRadius={60}
          disableClusteringAtZoom={11}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          chunkedLoading={true}
          animate={false} // Désactiver l'animation pour améliorer les performances
        >
          {zones.length > 0 && zones.map((zone) => (
            <ZoneMarker key={zone.properties.id} zone={zone} />
          ))}
        </MarkerClusterGroup>
        
        {/* Points d'intérêt optimisés */}
        {pois.length > 0 && pois.map((poi) => (
          <PoiMarker key={poi.id} poi={poi} />
        ))}
      </MapContainer>

      {/* Légende */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg z-10 text-xs space-y-2">
        <div className="font-semibold text-gray-900 mb-2">Légende</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-industria-brown-gold rounded-full border border-white"></div>
          <span>Zones industrielles</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-industria-olive-light rounded-full border border-white"></div>
          <span>Gares</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-industria-black rounded-full border border-white"></div>
          <span>Ports</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-industria-yellow-gold rounded-full border border-white"></div>
          <span>Aéroports</span>
        </div>
      </div>

      {/* Message d'erreur si nécessaire */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-100 border border-orange-300 text-orange-700 px-4 py-2 rounded-lg text-sm z-10">
          {error}
        </div>
      )}

      {/* Compteur de zones */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-lg z-10">
        <div className="text-sm font-semibold text-gray-900">
          {zones.length} zone{zones.length > 1 ? 's' : ''} disponible{zones.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}