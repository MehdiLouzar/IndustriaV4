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

import DynamicIcon from '@/components/DynamicIcon'
import { Button } from '@/components/ui/button'
import { fetchPublicApi } from '@/lib/publicApi'

// ————————————————————————————————————————————————————————
//  Leaflet default icon fix
// ————————————————————————————————————————————————————————
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

// ————————————————————————————————————————————————————————
//  Types & constants
// ————————————————————————————————————————————————————————

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
  { id: 'casa-port', coordinates: [33.6022, -7.6324], type: 'port', name: 'Port de Casablanca' },
  { id: 'casa-airport', coordinates: [33.3665, -7.5897], type: 'airport', name: 'Aéroport Mohammed V' },
  { id: 'rabat-station', coordinates: [34.0209, -6.8417], type: 'station', name: 'Gare de Rabat' },
  { id: 'tanger-port', coordinates: [35.7595, -5.833], type: 'port', name: 'Port Tanger Med' },
  { id: 'marrakech-airport', coordinates: [31.6056, -8.0361], type: 'airport', name: 'Aéroport Marrakech' },
  { id: 'agadir-port', coordinates: [30.4278, -9.5981], type: 'port', name: "Port d'Agadir" },
]

const TYPE_LABELS: Record<Poi['type'], string> = {
  station: 'Gare',
  port: 'Port',
  airport: 'Aéroport',
}

// ————————————————————————————————————————————————————————
//  Status helpers (ideally move to shared file)
// ————————————————————————————————————————————————————————

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

// Fallback minimal if API KO
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
      price: '2 500 DH/m²',
      area: '10 000 m²',
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
      price: '3 000 DH/m²',
      area: '8 000 m²',
      location: 'Rabat',
    },
  },
]

// ————————————————————————————————————————————————————————
//  Component
// ————————————————————————————————————————————————————————

export default function HomeMapView() {
  // ——— state ———
  const [zones, setZones] = useState<ZoneFeature[]>([])
  const [pois] = useState<Poi[]>(DEMO_POIS)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ——— refs ———
  const mapRef = useRef<L.Map | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const zoneCache = useRef<Map<number, ZoneFeature[]>>(new Map())
  const precisionRef = useRef(-1)
  const lastLoad = useRef(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 min

  // ——— icons ———
  const ICONS = useMemo(() => ({
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
    zone: L.divIcon({ html: '<div class="w-3 h-3 rounded-full bg-[#B1936D] shadow-lg"></div>', className: '', iconSize: [14, 14], iconAnchor: [7, 7] }),
  }), [])

  // ————————————————————————————————————————————————————————
  //  Inner components
  // ————————————————————————————————————————————————————————

  const ZoneMarker = React.memo(({ zone }: { zone: ZoneFeature }) => (
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
              <span className={`ml-1 font-semibold ${STATUS_COLORS[zone.properties.status] ?? 'text-gray-600'}`}>{STATUS_LABELS[zone.properties.status] ?? zone.properties.status}</span>
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
          {(zone.properties.activityIcons.length || zone.properties.amenityIcons.length) > 0 && (
            <div className="flex flex-wrap gap-2">
              {zone.properties.activityIcons.map((icon, i) => <DynamicIcon key={`a-${i}`} name={icon} className="w-5 h-5 text-industria-brown-gold" />)}
              {zone.properties.amenityIcons.map((icon, i) => <DynamicIcon key={`m-${i}`} name={icon} className="w-5 h-5 text-industria-olive-light" />)}
            </div>
          )}
          <div className="flex gap-2 pt-2 border-t">
            {(zone.properties.id.startsWith('demo-') || zone.properties.id.startsWith('fallback-')) ? (
              <Button size="sm" className="flex-1 bg-gray-400 text-white" disabled>Zone de démonstration</Button>
            ) : (
              <Button asChild size="sm" className="flex-1 bg-industria-brown-gold hover:bg-industria-olive-light text-white">
                <Link href={`/zones/${zone.properties.id}`}>Voir les détails</Link>
              </Button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  ))

  const PoiMarker = React.memo(({ poi }: { poi: Poi }) => (
    <Marker position={poi.coordinates} icon={ICONS[poi.type]}>
      <Popup>
        <div className="text-center space-y-1 p-1">
          <div className="font-semibold text-sm">{TYPE_LABELS[poi.type]}</div>
          <div className="text-xs text-gray-600">{poi.name}</div>
        </div>
      </Popup>
    </Marker>
  ))

  // ————————————————————————————————————————————————————————
  //  Data loading (LOD + WebWorker)
  // ————————————————————————————————————————————————————————

  const loadZones = useCallback(async (precision: number, force = false) => {
    // Time‑based cache to avoid frequent reloads
    if (!force && Date.now() - lastLoad.current < CACHE_DURATION && zoneCache.current.has(precision)) {
      setZones(zoneCache.current.get(precision)!)
