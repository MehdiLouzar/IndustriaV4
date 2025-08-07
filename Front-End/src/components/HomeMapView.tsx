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
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/map.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { TrainFront, Ship, Plane, MapPin } from 'lucide-react'
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
      activityIcons: ['Factory'],
      amenityIcons: ['Zap'],
      description: 'Zone de démonstration',
      price: '2 500 DH/m²',
      area: '10 000 m²',
      location: 'Casablanca',
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
      activityIcons: ['Cpu'],
      amenityIcons: ['Wifi'],
      description: 'Zone technologique',
      price: '3 000 DH/m²',
      area: '8 000 m²',
      location: 'Rabat',
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
      // Icône pour le centre d'une zone (simple pin bronze)
      zone: L.divIcon({
        html: '<div class="w-3 h-3 rounded-full bg-[#B1936D] shadow-lg"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    } as const
  }, [])

  /*************************
   *  Composants internes  *
   *************************/

  /** Marqueur d'une zone */
  const ZoneMarker = React.memo(function ZoneMarker({ zone }: { zone: ZoneFeature }) {
    return (
      <Marker position={zone.centroid} icon={ICONS.zone}>
        <Popup maxWidth={300} className="zone-popup">
          <div className="space-y-3 p-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {zone.properties.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {zone.properties.description}
              </p>
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
                <span
                  className={`ml-1 font-semibold ${
                    STATUS_COLORS[zone.properties.status] || 'text-gray-600'
                  }`}
                >
                  {STATUS_LABELS[zone.properties.status] || zone.properties.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Parcelles:</span>
                <span className="ml-1 text-gray-700">
                  {zone.properties.availableParcels}
                </span>
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

            {(zone.properties.activityIcons.length > 0 ||
              zone.properties.amenityIcons.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {zone.properties.activityIcons.map((icon, i) => (
                  <DynamicIcon
                    key={`activity-${i}`}
                    name={icon}
                    className="w-5 h-5 text-industria-brown-gold"
                  />
                ))}
                {zone.properties.amenityIcons.map((icon, i) => (
                  <DynamicIcon
                    key={`amenity-${i}`}
                    name={icon}
                    className="w-5 h-5 text-industria-olive-light"
                  />
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              {zone.properties.id.startsWith('demo-') ||
              zone.properties.id.startsWith('fallback-') ? (
                <Button
                  size="sm"
                  className="flex-1 bg-gray-400 text-white cursor-not-allowed"
                  disabled
                >
                  Zone de démonstration
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="flex-1 bg-industria-brown-gold hover:bg-industria-olive-light text-white"
                >
                  <Link href={`/zones/${zone.properties.id}`}>Voir les détails</Link>
                </Button>
              )}
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

  /*****************************
   *  Chargement des données  *
   *****************************/

  /** Cache (LOD) des zones selon la précision */
  const zoneCache = useRef<Map<number, ZoneFeature[]>>(new Map())
  const precisionRef = useRef<number>(-1)

  const loadZones = useCallback(
    async (precision: number, force = false) => {
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
          { signal: abortControllerRef.current.signal },
        )

        if (response?.features) {
          const zonesData: ZoneFeature[] = response.features.map((f) => {
            const poly = f.coordinates.map((c) => [c[0], c[1]] as [number, number])
            const center = poly.reduce<[number, number]>(
              (acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]],
              [0, 0],
            )
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
        setError(
          "Impossible de charger les zones. Affichage des données de démonstration.",
        )
        setZones(FALLBACK_ZONES)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  /** Synchronise le chargement des données avec le zoom de la carte */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    /** Convertit un niveau de zoom en "précision" pour l'API (de 0 à 3) */
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
    // Premier chargement
    handleZoom()

    return () => {
      map.off('zoomend', handleZoom)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [loadZones])

  /*****************
   *  Rendu carte  *
   *****************/

  return (
    <div className="relative overflow-hidden" style={{ height: 500 }}>
      <MapContainer
        center={[31.7917, -7.0926]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        whenCreated={(map) => {
          mapRef.current = map
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Polygones */}
        {zones.map((z) => (
          <Polygon
            key={`poly-${z.properties.id}`}
            positions={z.polygon}
            pathOptions={{ color: '#B1936D', weight: 1, fillOpacity: 0.1 }}
          />
        ))}

        {/* Clustering optimisé pour les zones */}
        <MarkerClusterGroup
          maxClusterRadius={60}
          disableClusteringAtZoom={11}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          chunkedLoading
          animate={false}
        >
          {zones.map((zone) => (
            <ZoneMarker key={zone.properties.id} zone={zone} />
          ))}
        </MarkerClusterGroup>

        {/* Points d'intérêt */}
        {pois.map((poi) => (
          <PoiMarker key={poi.id} poi={poi} />
        ))}
      </MapContainer>

      {/* Alerte d'erreur */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-100 border border-orange-300 text-orange-700 px-4 py-2 rounded-lg text-sm z-10">
          {error}
        </div>
      )}

      {/* Compteur de zones visibles */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-lg z-10">
        <div className="text-sm font-semibold text-gray-900">
          {loading ? 'Chargement…' : `${zones.length} zone${zones.length > 1 ? 's' : ''} visible${zones.length > 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  )
}
