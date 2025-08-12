'use client'

/**
 * Composant MapView - Carte interactive des zones industrielles
 * 
 * Affiche une carte Leaflet interactive avec :
 * - Marqueurs clusterisés des zones industrielles
 * - Popups avec informations détaillées
 * - Icônes personnalisées selon le statut
 * - Intégration avec l'API backend pour les données géospatiales
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

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
// Imports MapLibre supprimés pour éviter les conflits
import { TrainFront, Ship, Plane } from 'lucide-react'

// Utilitaires simplifiés - suppression du cache Overpass qui causait des conflits


/**
 * Type représentant une zone au format GeoJSON Feature
 */
type ZoneFeature = {
  /** Géométrie de la zone (point avec coordonnées) */
  geometry: { type: string; coordinates: [number, number] }
  /** Propriétés métier de la zone */
  properties: {
    /** Identifiant unique */
    id: string
    /** Nom de la zone */
    name: string
    /** Statut (LIBRE, OCCUPE, etc.) */
    status: string
    /** Nombre de parcelles disponibles */
    availableParcels: number
    /** Icônes des activités autorisées */
    activityIcons: string[]
    /** Icônes des équipements disponibles */
    amenityIcons: string[]
  }
}

/**
 * Type représentant la réponse API pour une zone (format simplifié)
 */
type ZoneFeatureResp = {
  /** Coordonnées géographiques [longitude, latitude] */
  coordinates: [number, number]
  /** Identifiant unique */
  id: string
  /** Nom de la zone */
  name: string
  /** Statut actuel */
  status: string
  /** Nombre de parcelles disponibles */
  availableParcels: number
  /** Liste des icônes d'activités */
  activityIcons: string[]
  /** Liste des icônes d'équipements */
  amenityIcons: string[]
}


/**
 * Composant carte interactive principal
 * 
 * Affiche les zones industrielles sur une carte Leaflet avec clustering,
 * popups informatifs et marqueurs personnalisés selon le statut.
 * 
 * @returns Composant React de la carte
 */
export default function MapView() {
  const [zones, setZones] = useState<ZoneFeature[]>([])
  type Poi = { id: string; coordinates: [number, number]; type: 'station' | 'port' | 'airport' }
  const [pois] = useState<Poi[]>([]) // POIs statiques simples
  const mapRef = useRef<L.Map | null>(null)

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


  // Suppression de toute la logique Overpass qui causait les conflits

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
  }, [])

  // Suppression de la logique MapLibre GL complexe


  return (
    <div className="relative overflow-hidden">
      <MapContainer
        key="simple-map-view" // Clé unique pour éviter les conflits
        center={[31.7, -6.5]}
        zoom={6}
        preferCanvas={true}
        style={{ height: 600, width: '100%' }}
        whenCreated={(m) => {
          mapRef.current = m
          // Invalidation de taille simple
          setTimeout(() => m.invalidateSize(), 100)
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
            <ZoneMarker key={`simple-${z.properties.id}`} zone={z} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
