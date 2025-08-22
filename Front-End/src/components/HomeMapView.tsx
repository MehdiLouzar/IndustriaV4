/**
 * Composant HomeMapView - Carte interactive avancée pour la page d'accueil
 * 
 * Carte interactive sophistiquée affichant les zones industrielles avec :
 * - Polygones de zones avec remplissage selon le statut
 * - Marqueurs clusterés avec popups détaillées
 * - Couches de transport (aéroports, ports, gares)
 * - Icônes dynamiques pour activités et équipements
 * - Actions rapides (appel, visite, détail)
 * - Optimisations de performance avec mémorisation
 * 
 * Intègre :
 * - Leaflet pour la cartographie
 * - Clustering intelligent des marqueurs
 * - Géométries vectorielles (polygones)
 * - API publique pour les données
 * - Styles CSS personnalisés
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

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
  useMap,
  type LatLngTuple,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/map.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { TrainFront, Ship, Plane, MapPin, Building2, Grid3X3, Ruler, DollarSign, MapPinned, Factory, Phone, Eye, Zap, Wifi, Car, Wrench, Cpu, Settings, Shield, Droplets, Droplet, Coffee, Truck, Users, Package, Globe, Cog, Tool, Gauge, Settings2, Power, Battery, Monitor, Server, Database, HardDrive, Briefcase, Home, Shirt, Pill } from 'lucide-react'
import type { FeatureCollection } from 'geojson'

import DynamicIcon from '@/components/DynamicIcon'
import { Button } from '@/components/ui/button'
import { fetchPublicApi } from '@/lib/publicApi'
import { useOverpassPOI, type OverpassPOI } from '@/hooks/useOverpassPOI'

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

/*************************
 *  Types & Constantes   *
 *************************/

/**
 * Composant de légende intégré à la carte
 */
function MapLegend() {
  const map = useMap()

  useEffect(() => {
    const legend = L.control({ position: 'bottomleft' })

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-control-legend')
      div.style.backgroundColor = 'white'
      div.style.padding = '12px'
      div.style.borderRadius = '8px'
      div.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      div.style.border = '1px solid #e5e7eb'
      div.style.maxWidth = '200px'
      div.style.fontSize = '12px'
      
      // Créer les icônes SVG avec renderToStaticMarkup
      const factoryIcon = renderToStaticMarkup(<Factory width={10} height={10} stroke="white" />)
      const shipIcon = renderToStaticMarkup(<Ship width={10} height={10} stroke="white" />)
      const planeIcon = renderToStaticMarkup(<Plane width={10} height={10} stroke="white" />)
      const trainIcon = renderToStaticMarkup(<TrainFront width={10} height={10} stroke="white" />)
      
      div.innerHTML = `
        <h4 style="font-weight: 600; color: #374151; margin: 0 0 8px 0;">Légende</h4>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; background: #d4a574; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              ${factoryIcon}
            </div>
            <span style="color: #4b5563;">Zones industrielles</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              ${shipIcon}
            </div>
            <span style="color: #4b5563;">Ports</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; background: #22c55e; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              ${planeIcon}
            </div>
            <span style="color: #4b5563;">Aéroports</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; background: #f97316; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              ${trainIcon}
            </div>
            <span style="color: #4b5563;">Gares</span>
          </div>
        </div>
      `

      return div
    }

    legend.addTo(map)

    return () => {
      legend.remove()
    }
  }, [map])

  return null
}

/**
 * Représentation d'une zone avec géométrie
 */
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
  // AÉROPORTS PRINCIPAUX
  {
    id: 'casa-airport',
    coordinates: [33.3665, -7.5897],
    type: 'airport',
    name: 'Aéroport Mohammed V Casablanca',
  },
  {
    id: 'marrakech-airport',
    coordinates: [31.6056, -8.0361],
    type: 'airport',
    name: 'Aéroport Marrakech Menara',
  },
  {
    id: 'rabat-airport',
    coordinates: [34.0515, -6.7562],
    type: 'airport',
    name: 'Aéroport Rabat-Salé',
  },
  {
    id: 'fes-airport',
    coordinates: [33.9273, -4.9778],
    type: 'airport',
    name: 'Aéroport Fès-Saïs',
  },
  {
    id: 'agadir-airport',
    coordinates: [30.3755, -9.5464],
    type: 'airport',
    name: 'Aéroport Agadir Al Massira',
  },
  {
    id: 'tanger-airport',
    coordinates: [35.7269, -5.9167],
    type: 'airport',
    name: 'Aéroport Tanger Ibn Battouta',
  },
  {
    id: 'oujda-airport',
    coordinates: [34.7872, -1.9239],
    type: 'airport',
    name: 'Aéroport Oujda Angads',
  },
  {
    id: 'tetouan-airport',
    coordinates: [35.5944, -5.3203],
    type: 'airport',
    name: 'Aéroport Tétouan Sania Ramel',
  },
  {
    id: 'nador-airport',
    coordinates: [34.9889, -3.0289],
    type: 'airport',
    name: 'Aéroport Nador Al Aroui',
  },
  {
    id: 'ouarzazate-airport',
    coordinates: [30.9392, -6.9094],
    type: 'airport',
    name: 'Aéroport Ouarzazate',
  },
  {
    id: 'essaouira-airport',
    coordinates: [31.3975, -9.6817],
    type: 'airport',
    name: 'Aéroport Essaouira Mogador',
  },
  {
    id: 'errachidia-airport',
    coordinates: [31.9472, -4.3983],
    type: 'airport',
    name: 'Aéroport Errachidia Moulay Ali Cherif',
  },
  {
    id: 'laayoune-airport',
    coordinates: [27.1517, -13.2128],
    type: 'airport',
    name: 'Aéroport Laâyoune Hassan 1er',
  },
  {
    id: 'dakhla-airport',
    coordinates: [23.7183, -15.9322],
    type: 'airport',
    name: 'Aéroport Dakhla',
  },

  // PORTS PRINCIPAUX
  {
    id: 'casa-port',
    coordinates: [33.6022, -7.6324],
    type: 'port',
    name: 'Port de Casablanca',
  },
  {
    id: 'tanger-port',
    coordinates: [35.7595, -5.833],
    type: 'port',
    name: 'Port Tanger Med',
  },
  {
    id: 'tanger-ville-port',
    coordinates: [35.7667, -5.8167],
    type: 'port',
    name: 'Port de Tanger Ville',
  },
  {
    id: 'agadir-port',
    coordinates: [30.4278, -9.5981],
    type: 'port',
    name: "Port d'Agadir",
  },
  {
    id: 'mohammedia-port',
    coordinates: [33.6878, -7.3928],
    type: 'port',
    name: 'Port de Mohammedia',
  },
  {
    id: 'kenitra-port',
    coordinates: [34.2433, -6.6156],
    type: 'port',
    name: 'Port de Kénitra',
  },
  {
    id: 'safi-port',
    coordinates: [32.2994, -9.2372],
    type: 'port',
    name: 'Port de Safi',
  },
  {
    id: 'essaouira-port',
    coordinates: [31.5125, -9.7697],
    type: 'port',
    name: "Port d'Essaouira",
  },
  {
    id: 'nador-port',
    coordinates: [35.1833, -2.9333],
    type: 'port',
    name: 'Port de Nador West Med',
  },
  {
    id: 'jorf-lasfar-port',
    coordinates: [33.1167, -8.6333],
    type: 'port',
    name: 'Port de Jorf Lasfar',
  },
  {
    id: 'laayoune-port',
    coordinates: [27.1289, -13.1842],
    type: 'port',
    name: 'Port de Laâyoune',
  },
  {
    id: 'dakhla-port',
    coordinates: [23.7106, -15.9414],
    type: 'port',
    name: 'Port de Dakhla',
  },

  // GARES PRINCIPALES
  {
    id: 'casa-port-station',
    coordinates: [33.6069, -7.6194],
    type: 'station',
    name: 'Gare Casa Port',
  },
  {
    id: 'casa-voyageurs-station',
    coordinates: [33.5906, -7.6131],
    type: 'station',
    name: 'Gare Casa Voyageurs',
  },
  {
    id: 'rabat-ville-station',
    coordinates: [34.0209, -6.8417],
    type: 'station',
    name: 'Gare Rabat Ville',
  },
  {
    id: 'rabat-agdal-station',
    coordinates: [33.9722, -6.8594],
    type: 'station',
    name: 'Gare Rabat Agdal',
  },
  {
    id: 'sale-station',
    coordinates: [34.0531, -6.7944],
    type: 'station',
    name: 'Gare Salé',
  },
  {
    id: 'kenitra-station',
    coordinates: [34.2617, -6.5711],
    type: 'station',
    name: 'Gare Kénitra',
  },
  {
    id: 'tanger-ville-station',
    coordinates: [35.7756, -5.8114],
    type: 'station',
    name: 'Gare Tanger Ville',
  },
  {
    id: 'fes-station',
    coordinates: [34.0958, -5.0022],
    type: 'station',
    name: 'Gare Fès',
  },
  {
    id: 'meknes-station',
    coordinates: [33.8828, -5.5572],
    type: 'station',
    name: 'Gare Meknès',
  },
  {
    id: 'oujda-station',
    coordinates: [34.6889, -1.9089],
    type: 'station',
    name: 'Gare Oujda',
  },
  {
    id: 'marrakech-station',
    coordinates: [31.6294, -7.9925],
    type: 'station',
    name: 'Gare Marrakech',
  },
  {
    id: 'settat-station',
    coordinates: [33.0014, -7.6161],
    type: 'station',
    name: 'Gare Settat',
  },
  {
    id: 'benguerir-station',
    coordinates: [32.2356, -7.9547],
    type: 'station',
    name: 'Gare Benguerir',
  },
  {
    id: 'mohammedia-station',
    coordinates: [33.6881, -7.3831],
    type: 'station',
    name: 'Gare Mohammedia',
  },
  {
    id: 'temara-station',
    coordinates: [33.9289, -6.9075],
    type: 'station',
    name: 'Gare Témara',
  },
  {
    id: 'skhirate-station',
    coordinates: [33.8494, -7.0356],
    type: 'station',
    name: 'Gare Skhirate',
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

interface HomeMapViewProps {
  searchFilters?: any;
  hasSearchFilters?: boolean;
}

export default function HomeMapView({ searchFilters, hasSearchFilters }: HomeMapViewProps) {
  console.log('🏗️ COMPOSANT HomeMapView MONTE/RE-RENDER avec hasSearchFilters:', hasSearchFilters)
  
  /** ÉTAT */
  const [zones, setZones] = useState<ZoneFeature[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [mapBounds, setMapBounds] = useState<{ south: number; west: number; north: number; east: number } | null>(null)

  /** RÉFÉRENCES */
  const mapRef = useRef<L.Map | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const zoneCache = useRef<Map<number, ZoneFeature[]>>(new Map())
  const lastLoad = useRef(0)
  
  /** HOOK POI DYNAMIQUE */
  const { pois: overpassPois, loading: poisLoading, error: poisError } = useOverpassPOI(mapBounds, true)
  
  /** POI COMBINÉS (fallback + dynamiques) */
  const allPois = useMemo(() => {
    const fallbackPois = DEMO_POIS.map(poi => ({
      ...poi,
      source: 'fallback' as const
    }));
    
    const dynamicPois = overpassPois.map(poi => ({
      id: poi.id,
      coordinates: poi.coordinates,
      type: poi.type,
      name: poi.name,
      source: 'overpass' as const
    }));
    
    // Combiner les deux listes en évitant les doublons proches (même nom dans un rayon de 1km)
    const combined = [...fallbackPois];
    
    dynamicPois.forEach(dynamicPoi => {
      const isDuplicate = fallbackPois.some(fallbackPoi => {
        const distance = Math.sqrt(
          Math.pow(dynamicPoi.coordinates[0] - fallbackPoi.coordinates[0], 2) +
          Math.pow(dynamicPoi.coordinates[1] - fallbackPoi.coordinates[1], 2)
        );
        return distance < 0.01 && // ~1km
               dynamicPoi.name.toLowerCase().includes(fallbackPoi.name.toLowerCase().split(' ')[0]);
      });
      
      if (!isDuplicate) {
        combined.push(dynamicPoi);
      }
    });
    
    return combined;
  }, [overpassPois])
  
  /** CONSTANTES DE CACHE */
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /** ICONES MEMO */
  const ICONS = useMemo(() => {
    return {
      station: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-orange-500 p-1 rounded-full border-2 border-white shadow-md opacity-80">
            <TrainFront width={12} height={12} stroke="white" />
          </div>,
        ),
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
      port: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-blue-500 p-1 rounded-full border-2 border-white shadow-md opacity-80">
            <Ship width={12} height={12} stroke="white" />
          </div>,
        ),
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
      airport: L.divIcon({
        html: renderToStaticMarkup(
          <div className="bg-green-500 p-1 rounded-full border-2 border-white shadow-md opacity-80">
            <Plane width={12} height={12} stroke="white" />
          </div>,
        ),
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
      // Icône pour le centre d'une zone (pin plus grand avec icône)
      zone: L.divIcon({
        html: renderToStaticMarkup(
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-industria-brown-gold to-industria-olive-light border-3 border-white shadow-xl flex items-center justify-center ring-2 ring-industria-brown-gold ring-opacity-30">
              <Factory width={20} height={20} stroke="white" fill="white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-industria-brown-gold rounded-full border border-white shadow-lg"></div>
          </div>
        ),
        className: '',
        iconSize: [48, 54],
        iconAnchor: [24, 48],
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

              {/* 8. Activités et équipements avec icônes */}
              {(zone.properties.activityIcons.length > 0 || zone.properties.amenityIcons.length > 0) && (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  {/* Activités */}
                  {zone.properties.activityIcons.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-1">Activités</h5>
                      <div className="flex flex-wrap gap-1">
                        {zone.properties.activityIcons.slice(0, 3).map((iconName, i) => {
                          const IconComponent = getLucideIcon(iconName)
                          return (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                              <IconComponent className="w-3 h-3" />
                              <span>Activité {i + 1}</span>
                            </span>
                          )
                        })}
                        {zone.properties.activityIcons.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">
                            +{zone.properties.activityIcons.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Équipements */}
                  {zone.properties.amenityIcons.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-1">Équipements</h5>
                      <div className="flex flex-wrap gap-1">
                        {zone.properties.amenityIcons.slice(0, 3).map((iconName, i) => {
                          const IconComponent = getLucideIcon(iconName)
                          return (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                              <IconComponent className="w-3 h-3" />
                              <span>Équipement {i + 1}</span>
                            </span>
                          )
                        })}
                        {zone.properties.amenityIcons.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">
                            +{zone.properties.amenityIcons.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 9. Prix (s'il est fourni) */}
              {zone.properties.price && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-industria-brown-gold" />
                    <span className="font-semibold text-gray-900">{zone.properties.price}</span>
                  </div>
                </div>
              )}

              {/* 10. Boutons d'action */}
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
                      asChild
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover:bg-industria-gray-light hover:border-industria-brown-gold"
                    >
                      <Link href={`/contact?zone=${zone.properties.id}`}>
                        <Phone className="w-4 h-4 mr-1" /> Contact
                      </Link>
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
  const PoiMarker = React.memo(function PoiMarker({ poi }: { poi: (Poi & { source?: string }) | (OverpassPOI & { source?: string }) }) {
    return (
      <Marker position={poi.coordinates} icon={ICONS[poi.type]}>
        <Popup>
          <div className="text-center space-y-1 p-1">
            <div className="font-semibold text-sm">{TYPE_LABELS[poi.type]}</div>
            <div className="text-xs text-gray-600">{poi.name}</div>
            {poi.source === 'overpass' && (
              <div className="text-xs text-blue-500 mt-1">📍 OpenStreetMap</div>
            )}
          </div>
        </Popup>
      </Marker>
    )
  })

// ————————————————————————————————————————————————————————
//  Data loading (LOD + WebWorker)
// ————————————————————————————————————————————————————————
const loadZones = useCallback(async (precision: number, force = false) => {
  console.log('⚡ loadZones APPELÉ avec precision:', precision, 'force:', force, 'hasSearchFilters:', hasSearchFiltersRef.current)
  
  // Ne pas utiliser le cache si on a des filtres de recherche
  const useCache = !hasSearchFiltersRef.current && !force && Date.now() - lastLoad.current < CACHE_DURATION;
  
  if (useCache) {
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

    // Construire l'URL avec les filtres de recherche
    let apiUrl = `/api/map/zones/simplified?zoom=${precision}`;
    
    if (hasSearchFiltersRef.current && searchFiltersRef.current) {
      const params = new URLSearchParams();
      const filters = searchFiltersRef.current;
      if (filters.regionId) params.append('regionId', filters.regionId);
      if (filters.zoneTypeId) params.append('zoneTypeId', filters.zoneTypeId);
      if (filters.status) params.append('status', filters.status);
      if (filters.minArea) params.append('minArea', filters.minArea);
      if (filters.maxArea) params.append('maxArea', filters.maxArea);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      
      const paramString = params.toString();
      if (paramString) {
        apiUrl += '&' + paramString;
      }
    }

    const resp = await fetchPublicApi<{ features: ZoneFeatureResp[] }>(
      apiUrl,
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
    
    // Seulement mettre en cache si pas de filtres
    if (!hasSearchFiltersRef.current) {
      zoneCache.current.set(precision, data)
    }
    
    console.log(`📊 setZones appelé avec ${data.length} zones:`, data.map(z => z.properties.id))
    setZones(data) // Utiliser les données de l'API même si vides
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
}, []) // Pas de dépendances car utilise des refs

  // Refs pour les searchFilters et hasSearchFilters actuels
  const searchFiltersRef = useRef(searchFilters);
  const hasSearchFiltersRef = useRef(hasSearchFilters);
  searchFiltersRef.current = searchFilters;
  hasSearchFiltersRef.current = hasSearchFilters;

  // Chargement initial des zones
  useEffect(() => {
    console.log('🚀 useEffect INITIAL - loadZones(10, false)')
    loadZones(10, false)
  }, []) // Une seule fois au montage

  // Rechargement quand les filtres changent
  useEffect(() => {
    console.log('🔄 useEffect FILTERS - hasSearchFilters:', hasSearchFilters, 'loadZones(10, true)')
    loadZones(10, true) // Force le rechargement
  }, [hasSearchFilters]) // Seulement quand hasSearchFilters change

  // Générer une clé unique basée sur les zones actuelles
  const zonesKey = useMemo(() => {
    return `${zones.length}-${zones.map(z => z.properties.id).sort().join(',').slice(0, 50)}`
  }, [zones])

  // Nettoyage des AbortController au démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Fonction pour obtenir l'icône Lucide React appropriée
  const getLucideIcon = (iconName?: string) => {
    if (!iconName) return Factory
    
    const iconMap: { [key: string]: any } = {
      // Électricité et énergie
      'Zap': Zap,
      'Power': Power,
      'Battery': Battery,
      'Lightbulb': Zap,
      'Sun': Power,
      'Flame': Zap,
      
      // Internet et communication
      'Wifi': Wifi,
      'Globe': Globe,
      'Mail': Globe,
      'Server': Server,
      'Database': Database,
      'HardDrive': HardDrive,
      'Monitor': Monitor,
      
      // Transport et parking
      'Car': Car,
      'Truck': Truck,
      'Plane': Plane,
      'ParkingCircle': Car,
      
      // Bâtiments et infrastructure
      'Building': Building2,
      'Factory': Factory,
      'Home': Home,
      'Briefcase': Briefcase,
      'Hospital': Building2,
      'CreditCard': Package,
      
      // Technologie et outils
      'Cpu': Cpu,
      'Wrench': Wrench,
      'Settings': Settings,
      'Cog': Settings,
      'Tool': Tool,
      'Gauge': Gauge,
      'Settings2': Settings2,
      
      // Sécurité et services
      'Shield': Shield,
      'shield': Shield,
      'Droplets': Droplets,
      'droplet': Droplet,
      'droplets': Droplets,
      'Coffee': Coffee,
      'Users': Users,
      'Package': Package,
      'package': Package,
      'UtensilsCrossed': Coffee,
      
      // Icônes spécifiques de la base
      'car': Car,
      'zap': Zap,
      'wifi': Wifi,
      'shirt': Shirt,
      'pill': Pill,
      
      // Icônes génériques
      'MapPin': MapPin,
      'Ruler': Ruler,
      'Phone': Phone,
      'Eye': Eye,
      'Grid3X3': Grid3X3
    }
    
    return iconMap[iconName] || Factory
  }

  return (
    <div className="w-full h-full relative">
      {(loading || poisLoading) && (
        <div className="absolute top-4 right-4 z-50 bg-industria-brown-gold text-white px-3 py-1 rounded-md shadow-lg">
          {loading && poisLoading ? 'Chargement zones et POI...' :
           loading ? 'Chargement des zones...' :
           'Chargement des centres d\'intérêt...'}
        </div>
      )}
      
      {(error || poisError) && (
        <div className="absolute top-4 right-4 z-50 bg-red-500 text-white px-3 py-1 rounded-md shadow-lg">
          {error || poisError}
        </div>
      )}

      <MapContainer
        key="home-map-view" // Clé unique pour éviter les conflits
        center={[31.7917, -7.0926]} // Centre du Maroc
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance
          
          // Fonction pour mettre à jour les bounds
          const updateBounds = () => {
            const bounds = mapInstance.getBounds();
            setMapBounds({
              south: bounds.getSouth(),
              west: bounds.getWest(), 
              north: bounds.getNorth(),
              east: bounds.getEast()
            });
          };
          
          // Écouter les événements de déplacement/zoom
          mapInstance.on('moveend', updateBounds);
          mapInstance.on('zoomend', updateBounds);
          
          // Initialiser les bounds
          updateBounds();
          
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
          key={zonesKey}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount()
            let size = 'small'
            let bgGradient = 'from-industria-brown-gold to-industria-olive-light'
            let ringColor = 'ring-industria-brown-gold'
            
            if (count >= 100) {
              size = 'large'
              bgGradient = 'from-red-600 to-red-800'
              ringColor = 'ring-red-500'
            } else if (count >= 10) {
              size = 'medium'
              bgGradient = 'from-orange-500 to-orange-700'
              ringColor = 'ring-orange-400'
            }
            
            const sizeClasses = {
              small: 'w-14 h-14 text-sm font-black',
              medium: 'w-16 h-16 text-base font-black',
              large: 'w-20 h-20 text-xl font-black'
            }
            
            return L.divIcon({
              html: renderToStaticMarkup(
                <div className="relative">
                  <div 
                    className={`rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white bg-gradient-to-br ${bgGradient} ${sizeClasses[size as keyof typeof sizeClasses]} ring-4 ring-opacity-30 ${ringColor} animate-pulse`}
                  >
                    <div className="relative z-10">{count}</div>
                    <div className="absolute inset-0 rounded-full bg-white opacity-20"></div>
                  </div>
                  {/* Petit indicateur factory */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Factory className="w-3 h-3 text-industria-brown-gold" />
                  </div>
                </div>
              ),
              className: '',
              iconSize: size === 'large' ? [80, 80] : size === 'medium' ? [64, 64] : [56, 56],
              iconAnchor: size === 'large' ? [40, 40] : size === 'medium' ? [32, 32] : [28, 28],
            })
          }}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {zones.map((zone, index) => {
            console.log(`🎯 Rendu zone ${index + 1}/${zones.length}: ${zone.properties.id} - ${zone.properties.name}`)
            return <ZoneMarker key={`home-zone-${zone.properties.id}`} zone={zone} />
          })}
        </MarkerClusterGroup>

        {/* Affichage des POIs (ports, gares, aéroports) */}
        {allPois.map((poi) => (
          <PoiMarker key={`home-poi-${poi.id}`} poi={poi} />
        ))}

        {/* Légende intégrée à la carte */}
        <MapLegend />
      </MapContainer>
    </div>
  )
}
