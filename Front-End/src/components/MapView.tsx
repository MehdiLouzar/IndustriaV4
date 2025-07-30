'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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

// Simple debounce utility to avoid excessive API calls
function debounce<Args extends unknown[]>(func: (...args: Args) => void, delay: number) {
  let timer: NodeJS.Timeout
  const debounced = (...args: Args) => {
    clearTimeout(timer)
    timer = setTimeout(() => func(...args), delay)
  }
  debounced.cancel = () => clearTimeout(timer)
  return debounced
}

// Small cache for Overpass results to reduce network usage
class OverpassCache {
  private cache = new Map<string, { data: FeatureCollection; ts: number }>()
  private readonly TTL = 3_600_000 // 1 hour
  private readonly MAX_SIZE = 20

  private key(bbox: string, zoom: number) {
    const precision = zoom > 12 ? 2 : 1
    return bbox
      .split(',')
      .map((n) => parseFloat(n).toFixed(precision))
      .join(',')
  }

  get(bbox: string, zoom: number) {
    const k = this.key(bbox, zoom)
    const item = this.cache.get(k)
    if (!item) return null
    if (Date.now() - item.ts > this.TTL) {
      this.cache.delete(k)
      return null
    }
    return item.data
  }

  set(bbox: string, zoom: number, data: FeatureCollection) {
    const k = this.key(bbox, zoom)
    this.cache.set(k, { data, ts: Date.now() })
    if (this.cache.size > this.MAX_SIZE) {
      const oldest = this.cache.keys().next().value
      this.cache.delete(oldest)
    }
  }
}

const overpassCache = new OverpassCache()


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
  const overpassAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    const t = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 100)
    return () => {
      clearTimeout(t)
    }
  }, [])

  const ICONS = useMemo(
    () => ({
      parcel: L.divIcon({
        html: '<div style="background:#3388ff;border-radius:50%;width:12px;height:12px;border:2px solid white"></div>',
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
      showroom: L.divIcon({
        html: '<div style="background:#e53e3e;border-radius:50%;width:12px;height:12px;border:2px solid white"></div>',
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
      station: L.divIcon({
        html: renderToStaticMarkup(<TrainFront width={16} height={16} stroke="#0066ff" />),
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
      port: L.divIcon({
        html: renderToStaticMarkup(<Ship width={16} height={16} stroke="#333" />),
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
      airport: L.divIcon({
        html: renderToStaticMarkup(<Plane width={16} height={16} stroke="#0a0" />),
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }),
    []
  )

  const ZoneMarker = React.memo(function ZoneMarker({ zone }: { zone: ZoneFeature }) {
    return (
      <Marker position={zone.geometry.coordinates}>
        <Popup>
          <div className="space-y-1 text-sm p-1">
            <strong className="block mb-1">{zone.properties.name}</strong>
            <div>Statut: {zone.properties.status}</div>
            <div>Parcelles disponibles: {zone.properties.availableParcels}</div>
            <div>
              Lat: {zone.geometry.coordinates[0].toFixed(5)}, Lon:{' '}
              {zone.geometry.coordinates[1].toFixed(5)}
            </div>
            {zone.properties.activityIcons.length > 0 && (
              <div className="flex gap-1 text-xl">
                {zone.properties.activityIcons.map((ic, i) => (
                  <DynamicIcon key={i} name={ic} className="w-5 h-5" />
                ))}
              </div>
            )}
            {zone.properties.amenityIcons.length > 0 && (
              <div className="flex gap-1 text-xl">
                {zone.properties.amenityIcons.map((ic, i) => (
                  <DynamicIcon key={i} name={ic} className="w-5 h-5" />
                ))}
              </div>
            )}
            <Link href={`/zones/${zone.properties.id}`} className="text-blue-600 underline block mt-1">
              Voir la zone
            </Link>
          </div>
        </Popup>
      </Marker>
    )
  })

  const ParcelMarker = React.memo(function ParcelMarker({ parcel }: { parcel: ParcelFeature }) {
    return (
      <Marker
        position={parcel.geometry.coordinates}
        icon={parcel.properties.isShowroom ? ICONS.showroom : ICONS.parcel}
      >
        <Popup>
          <div className="space-y-1 text-sm">
            <strong>{parcel.properties.reference}</strong>
            <div>Statut: {parcel.properties.status}</div>
            <div>
              Lat: {parcel.geometry.coordinates[0].toFixed(5)}, Lon:{' '}
              {parcel.geometry.coordinates[1].toFixed(5)}
            </div>
            {parcel.properties.isShowroom && <div>Showroom</div>}
          </div>
        </Popup>
      </Marker>
    )
  })

  const visibleZones = useMemo(() => {
    if (!mapRef.current || zones.length < 100) return zones
    try {
      const b = mapRef.current.getBounds()
      return zones.filter((z) =>
        b.contains(L.latLng(z.geometry.coordinates[0], z.geometry.coordinates[1]))
      )
    } catch {
      return zones
    }
  }, [zones])

  const visibleParcels = useMemo(() => {
    if (!mapRef.current || parcels.length < 100) return parcels
    try {
      const b = mapRef.current.getBounds()
      return parcels.filter((p) =>
        b.contains(L.latLng(p.geometry.coordinates[0], p.geometry.coordinates[1]))
      )
    } catch {
      return parcels
    }
  }, [parcels])

  const applyOverpassData = useCallback(
    (geojson: FeatureCollection) => {
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

      if (glMapRef.current?.getSource('overpass')) {
        ;(glMapRef.current.getSource('overpass') as maplibregl.GeoJSONSource).setData(geojson)
      } else if (glMapRef.current) {
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
    },
    []
  )

  const fetchOverpassData = useCallback(async (bbox: string, zoom: number) => {
    overpassAbort.current?.abort()
    const ctrl = new AbortController()
    overpassAbort.current = ctrl
    const elements =
      zoom > 10
        ? 'way["highway"~"motorway|trunk"];' +
          'node["railway"="station"];node["public_transport"="station"];' +
          'node["harbour"];node["aeroway"="aerodrome"];'
        : 'way["highway"="motorway"];node["aeroway"="aerodrome"];'
    const query = `[out:json][timeout:25];(${elements})(${bbox});out geom;`
    try {
      const res = await fetch(
        'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query),
        { signal: ctrl.signal }
      )
      if (!res.ok) {
        console.error('Overpass HTTP error', res.status, res.statusText)
        return
      }
      const osm = await res.json()
      if (ctrl.signal.aborted) return
      const geojson = osmtogeojson(osm) as FeatureCollection
      overpassCache.set(bbox, zoom, geojson)
      applyOverpassData(geojson)
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Overpass fetch failed', err)
      }
    } finally {
      if (overpassAbort.current === ctrl) overpassAbort.current = null
    }
  }, [applyOverpassData])

  const loadOverpassData = useCallback(
    debounce(() => {
      if (!mapRef.current || !glMapRef.current || !glLoaded.current) return
      const zoom = mapRef.current.getZoom()
      if (zoom < 11) return
      const b = mapRef.current.getBounds()
      const bbox = `${b.getSouth().toFixed(2)},${b.getWest().toFixed(2)},${b.getNorth().toFixed(2)},${b.getEast().toFixed(2)}`
      if (bbox === lastBbox.current) return
      lastBbox.current = bbox
      const cached = overpassCache.get(bbox, zoom)
      if (cached) {
        applyOverpassData(cached)
        return
      }
      fetchOverpassData(bbox, zoom)
    }, 5000),
    [fetchOverpassData, applyOverpassData]
  ) as ReturnType<typeof debounce>

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
    const abortController = new AbortController()
    const mapInstance = mapRef.current
    let loadTimeout: NodeJS.Timeout | null = null
    let isDestroyed = false

    const LMaplibre = L as unknown as typeof L & {
      maplibreGL: (opts: { style: string; interactive: boolean }) => {
        addTo(map: L.Map): { getMaplibreMap(): maplibregl.Map; remove(): void }
      }
    }
    const layer = LMaplibre
      .maplibreGL({ style: 'https://demotiles.maplibre.org/style.json', interactive: false })
      .addTo(mapInstance)
    glLayerRef.current = layer
    const mlMap = layer.getMaplibreMap() as maplibregl.Map
    glMapRef.current = mlMap

    const handleLoad = () => {
      if (isDestroyed) return
      glLoaded.current = true
      loadTimeout = setTimeout(() => {
        if (!isDestroyed && !abortController.signal.aborted) {
          loadOverpassData()
          mapInstance?.on('moveend', loadOverpassData)
        }
      }, 500)
    }

    mlMap.on('load', handleLoad)

    return () => {
      console.log('🧹 MapView cleanup START')
      isDestroyed = true
      abortController.abort()
      overpassAbort.current?.abort()
      overpassAbort.current = null
      if (loadTimeout) {
        clearTimeout(loadTimeout)
        loadTimeout = null
      }
      loadOverpassData.cancel()
      try {
        mapInstance?.off('moveend', loadOverpassData)
        mlMap.off('load', handleLoad)
      } catch (e: unknown) {
        console.warn('Listener cleanup error:', e)
      }
      if (glMapRef.current) {
        try {
          glMapRef.current.remove()
        } catch (e: unknown) {
          console.warn('MapLibre destruction error:', e)
        }
        glMapRef.current = null
      }
      if (glLayerRef.current) {
        try {
          glLayerRef.current.remove()
        } catch (e: unknown) {
          console.warn('Layer destruction error:', e)
        }
        glLayerRef.current = null
      }
      glLoaded.current = false
      if (typeof window !== 'undefined' && 'gc' in window) {
        try {
          ;((window as unknown) as { gc?: () => void }).gc?.()
        } catch {
          /* noop */
        }
      }
      console.log('✅ MapView cleanup COMPLETE')
    }
  }, [loadOverpassData])


  return (
    <div className="relative overflow-hidden">
      <MapContainer
        center={[31.7, -6.5]}
        zoom={6}
        preferCanvas={true}
        style={{ height: 600, width: '100%' }}
        whenCreated={(m) => {
          mapRef.current = m
        }}
      >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {/* Cluster pour zones industrielles */}
      <MarkerClusterGroup
        maxClusterRadius={60}
        disableClusteringAtZoom={14}
        spiderfyOnMaxZoom={false}
        showCoverageOnHover={false}
        chunkedLoading
      >
        {visibleZones.map((z) => (
          <ZoneMarker key={z.properties.id} zone={z} />
        ))}
      </MarkerClusterGroup>
      {/* Cluster séparé pour parcelles */}
      <MarkerClusterGroup
        maxClusterRadius={30}
        disableClusteringAtZoom={16}
        showCoverageOnHover={false}
        chunkedLoading
      >
        {visibleParcels.map((p) => (
          <ParcelMarker key={p.properties.id} parcel={p} />
        ))}
      </MarkerClusterGroup>
      {/* Points d'intérêt sans clustering */}
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          position={poi.coordinates}
          icon={
            poi.type === 'station'
              ? ICONS.station
              : poi.type === 'port'
              ? ICONS.port
              : ICONS.airport
          }
        />
      ))}
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
