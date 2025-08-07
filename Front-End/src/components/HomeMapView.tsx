'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/map.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import type { FeatureCollection } from 'geojson'
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
import { fetchPublicApi } from '@/lib/publicApi'
import { TrainFront, Ship, Plane } from 'lucide-react'

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

const TYPE_LABELS = {
  station: 'Gare',
  port: 'Port',
  airport: 'Aéroport',
}

export default function HomeMapView() {
  const [zones, setZones] = useState<FeatureCollection | null>(null)
  const [pois] = useState<Poi[]>(DEMO_POIS)
  const [error, setError] = useState<string | null>(null)

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
    }),
    []
  )

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

  const loadZones = useCallback(
    async (bbox: string) => {
      setError(null)
      try {
        const data = await fetchPublicApi<FeatureCollection>(`/api/map/zones?bbox=${bbox}`)
        setZones(data)
      } catch {
        setError('Impossible de charger les zones.')
        setZones(null)
      }
    },
    []
  )

  function MapEventHandler() {
    const map = useMapEvents({
      moveend: handle,
      zoomend: handle,
    })

    useEffect(() => {
      handle()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handle() {
      const zoom = map.getZoom()
      if (zoom < 10) {
        setZones(null)
        return
      }
      const bounds = map.getBounds()
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
      loadZones(bbox)
    }

    return null
  }

  return (
    <div className="relative overflow-hidden" style={{ height: 500 }}>
      <MapContainer
        center={[31.7917, -7.0926]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEventHandler />
        {zones && <GeoJSON data={zones} style={{ color: '#B87333', weight: 2, fillOpacity: 0.2 }} />}
        {pois.length > 0 && pois.map((poi) => <PoiMarker key={poi.id} poi={poi} />)}
      </MapContainer>

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-100 border border-orange-300 text-orange-700 px-4 py-2 rounded-lg text-sm z-10">
          {error}
        </div>
      )}

      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-lg z-10">
        <div className="text-sm font-semibold text-gray-900">
          {(zones?.features.length || 0)} zone{(zones?.features.length || 0) > 1 ? 's' : ''} visible{(zones?.features.length || 0) > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

