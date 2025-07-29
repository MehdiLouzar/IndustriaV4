'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Link from 'next/link'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import 'leaflet/dist/leaflet.css'
// react-leaflet-markercluster exposes its CSS via the "styles" export
import 'react-leaflet-markercluster/styles'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
import { fetchApi } from '@/lib/utils'
import DynamicIcon from '@/components/DynamicIcon'
import maplibregl from 'maplibre-gl'
import '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
import osmtogeojson from 'osmtogeojson'
import type { FeatureCollection } from 'geojson'
import { TrainFront, Ship, Plane } from 'lucide-react'


type ZoneFeature = {
  geometry: { type: string; coordinates: [number, number] }
  properties: {
    id: string
    name: string
    status: string
    availableParcels: number
    activityIcons: string[]
    amenityIcons: string[]
  }
}

type ZoneFeatureResp = {
  coordinates: [number, number]
  id: string
  name: string
  status: string
  availableParcels: number
  activityIcons: string[]
  amenityIcons: string[]
}

type ParcelFeature = {
  geometry: { type: string; coordinates: [number, number] }
  properties: { id: string; reference: string; isShowroom: boolean; status: string }
}

type ParcelFeatureResp = {
  coordinates: [number, number]
  id: string
  reference: string
  isShowroom: boolean
  status: string
}

export default function MapView() {
  const [zones, setZones] = useState<ZoneFeature[]>([])
  const [parcels, setParcels] = useState<ParcelFeature[]>([])
  type Poi = { id: string; coordinates: [number, number]; type: 'station' | 'port' | 'airport' }
  const [pois, setPois] = useState<Poi[]>([])
  const mapRef = useRef<L.Map | null>(null)
  const glLayerRef = useRef<{ getMaplibreMap(): maplibregl.Map; remove(): void } | null>(null)
  const glMapRef = useRef<maplibregl.Map | null>(null)
  const glLoaded = useRef(false)
  const lastBbox = useRef('')
  const debounceRef = useRef<number>()

  useEffect(() => {
    if (!mapRef.current) return
    // when dynamically loaded, Leaflet may calculate size before the element is
    // visible; invalidateSize fixes overflow issues
    setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 100)
  }, [])

  const parcelIcon = L.divIcon({
    html: '<div style="background:#3388ff;border-radius:50%;width:12px;height:12px;border:2px solid white"></div>',
    className: ''
  })
  const showroomIcon = L.divIcon({
    html: '<div style="background:#e53e3e;border-radius:50%;width:12px;height:12px;border:2px solid white"></div>',
    className: ''
  })

  const stationIcon = L.divIcon({
    html: renderToStaticMarkup(<TrainFront width={20} height={20} stroke="#0066ff" />),
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
  const portIcon = L.divIcon({
    html: renderToStaticMarkup(<Ship width={20} height={20} stroke="#333" />),
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
  const airportIcon = L.divIcon({
    html: renderToStaticMarkup(<Plane width={20} height={20} stroke="#0a0" />),
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  const fetchOverpassData = useCallback(async (bbox: string) => {
    const query = `[out:json][timeout:25];(
      way["highway"~"motorway|trunk"](${bbox});
      node["railway"="station"](${bbox});
      node["public_transport"="station"](${bbox});
      node["harbour"](${bbox});
      node["aeroway"="aerodrome"](${bbox});
    );out geom;`
    try {
      const res = await fetch(
        'https://overpass-api.de/api/interpreter?data=' +
          encodeURIComponent(query)
      )
      if (!res.ok) {
        console.error('Overpass HTTP error', res.status, res.statusText)
        return
      }
      const osm = await res.json()
      const geojson = osmtogeojson(osm) as FeatureCollection
      console.log('Overpass features', geojson.features.length)

      const newPois: Poi[] = []
      for (const f of geojson.features) {
        if (f.geometry.type === 'Point') {
          const [lon, lat] = f.geometry.coordinates as [number, number]
          const props = f.properties as Record<string, unknown>
          if (props.railway === 'station' || props.public_transport === 'station') {
            newPois.push({ id: String(props['@id'] ?? `${lon}-${lat}`), coordinates: [lat, lon], type: 'station' })
          } else if (props.harbour != null) {
            newPois.push({ id: String(props['@id'] ?? `${lon}-${lat}`), coordinates: [lat, lon], type: 'port' })
          } else if (props.aeroway === 'aerodrome') {
            newPois.push({ id: String(props['@id'] ?? `${lon}-${lat}`), coordinates: [lat, lon], type: 'airport' })
          }
        }
      }
      setPois(newPois)

      if (glMapRef.current.getSource('overpass')) {
        ;(glMapRef.current.getSource('overpass') as maplibregl.GeoJSONSource).setData(geojson)
      } else {
        glMapRef.current.addSource('overpass', { type: 'geojson', data: geojson })
        glMapRef.current.addLayer({
          id: 'highways',
          type: 'line',
          source: 'overpass',
          filter: ['match', ['get', 'highway'], ['motorway', 'trunk'], true, false],
          minzoom: 0,
          paint: {
            'line-color': '#0000ff',
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 4, 12, 8, 16, 10],
          },
        })
      }
    } catch (err) {
      console.error('Overpass fetch failed', err)
    }
  }, [])

  const loadOverpassData = useCallback(() => {
    if (!mapRef.current || !glMapRef.current || !glLoaded.current) return
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      if (!mapRef.current) return
      const b = mapRef.current.getBounds()
      const bbox = `${b.getSouth().toFixed(2)},${b.getWest().toFixed(2)},${b.getNorth().toFixed(2)},${b.getEast().toFixed(2)}`
      if (bbox === lastBbox.current) return
      lastBbox.current = bbox
      fetchOverpassData(bbox)
    }, 300)
  }, [fetchOverpassData])

  useEffect(() => {
    fetchApi<{ features: ZoneFeatureResp[] }>("/api/map/zones")
      .then((d) => {
        if (!d) return
        const conv: ZoneFeature[] = d.features.map((f) => ({
          geometry: { type: "Point", coordinates: [f.coordinates[0], f.coordinates[1]] },
          properties: {
            id: f.id,
            name: f.name,
            status: f.status,
            availableParcels: f.availableParcels,
            activityIcons: f.activityIcons,
            amenityIcons: f.amenityIcons,
          },
        }))
        setZones(conv)
      })
      .catch(console.error)
    fetchApi<{ features: ParcelFeatureResp[] }>("/api/map/parcels")
      .then((d) => {
        if (!d) return
        const conv: ParcelFeature[] = d.features.map((f) => ({
          geometry: { type: "Point", coordinates: [f.coordinates[0], f.coordinates[1]] },
          properties: {
            id: f.id,
            reference: f.reference,
            isShowroom: f.isShowroom,
            status: f.status,
          },
        }))
        setParcels(conv)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    const LMaplibre = L as unknown as typeof L & {
      maplibreGL: (opts: { style: string; interactive: boolean }) => {
        addTo(map: L.Map): { getMaplibreMap(): maplibregl.Map; remove(): void }
      }
    }
    const layer = LMaplibre
      .maplibreGL({ style: 'https://demotiles.maplibre.org/style.json', interactive: false })
      .addTo(mapRef.current)
    glLayerRef.current = layer
    const mlMap = layer.getMaplibreMap() as maplibregl.Map
    glMapRef.current = mlMap

    const handleLoad = () => {
      glLoaded.current = true
      setTimeout(() => {
        loadOverpassData()
        mapRef.current?.on('moveend', loadOverpassData)
      }, 300)
    }

    mlMap.on('load', handleLoad)

    return () => {
      mapRef.current?.off('moveend', loadOverpassData)
      mlMap.off('load', handleLoad)
      glMapRef.current = null
      glLayerRef.current?.remove()
    }
  }, [loadOverpassData])


  return (
    <div className="relative overflow-hidden">
      <MapContainer
        center={[31.7, -6.5]}
        zoom={6}
        style={{ height: 600, width: '100%' }}
        whenCreated={(m) => {
          mapRef.current = m
        }}
      >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup
        showCoverageOnHover={false}
        chunkedLoading
      >
        {zones.map(z => (
          <Marker
            key={z.properties.id}
            position={z.geometry.coordinates}
          >
            <Popup>
              <div className="space-y-1 text-sm p-1">
                <strong className="block mb-1">{z.properties.name}</strong>
                <div>Statut: {z.properties.status}</div>
                <div>Parcelles disponibles: {z.properties.availableParcels}</div>
                <div>
                  Lat: {z.geometry.coordinates[0].toFixed(5)}, Lon:{' '}
                  {z.geometry.coordinates[1].toFixed(5)}
                </div>
                {z.properties.activityIcons.length > 0 && (
                  <div className="flex gap-1 text-xl">
                    {z.properties.activityIcons.map((ic, i) => (
                      <DynamicIcon key={i} name={ic} className="w-5 h-5" />
                    ))}
                  </div>
                )}
                {z.properties.amenityIcons.length > 0 && (
                  <div className="flex gap-1 text-xl">
                    {z.properties.amenityIcons.map((ic, i) => (
                      <DynamicIcon key={i} name={ic} className="w-5 h-5" />
                    ))}
                  </div>
                )}
                <Link
                  href={`/zones/${z.properties.id}`}
                  className="text-blue-600 underline block mt-1"
                >
                  Voir la zone
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        {parcels.map(p => (
          <Marker
            key={p.properties.id}
            position={p.geometry.coordinates}
            icon={p.properties.isShowroom ? showroomIcon : parcelIcon}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <strong>{p.properties.reference}</strong>
                <div>Statut: {p.properties.status}</div>
                <div>
                  Lat: {p.geometry.coordinates[0].toFixed(5)}, Lon:{' '}
                  {p.geometry.coordinates[1].toFixed(5)}
                </div>
                {p.properties.isShowroom && <div>Showroom</div>}
              </div>
            </Popup>
          </Marker>
        ))}
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            position={poi.coordinates}
            icon={poi.type === 'station' ? stationIcon : poi.type === 'port' ? portIcon : airportIcon}
          />
        ))}
      </MarkerClusterGroup>
      </MapContainer>
      <div className="absolute bottom-2 right-2 bg-white/80 p-2 text-xs rounded shadow space-y-1 z-10">
        <div>
          <span className="inline-block w-6 border-b-8 border-blue-600 align-middle mr-1"></span>
          Autoroutes
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-blue-600 rounded-full align-middle mr-1"></span>
          Gares
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-gray-700 rounded-full align-middle mr-1"></span>
          Ports
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-green-700 rounded-full align-middle mr-1"></span>
          Aéroports
        </div>
      </div>
    </div>
  )
}
