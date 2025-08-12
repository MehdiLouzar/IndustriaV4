/**
 * Composant ZoneMap - Carte détaillée d'une zone industrielle
 * 
 * Affiche une carte précise d'une zone industrielle spécifique avec :
 * - Polygones de la zone et de ses parcelles
 * - Projection Lambert Maroc vers WGS84 pour géolocalisation précise
 * - Sélection interactive des parcelles disponibles
 * - Popups avec détails (superficie, prix, règlements COS/CUS)
 * - Intégration du formulaire de prise de rendez-vous
 * - Couleurs conditionnelles selon disponibilité
 * 
 * Utilise :
 * - Proj4js pour les transformations de coordonnées
 * - Leaflet pour le rendu cartographique
 * - Polygones vectoriels pour la précision
 * - Géométries stockées en base PostGIS
 * 
 * @param zone Zone industrielle à afficher avec ses parcelles
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

"use client";

import { MapContainer, TileLayer, Polygon, Popup, Marker } from "react-leaflet";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import L from "leaflet";
import proj4 from "proj4";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin, Square, Building2, Zap, Wifi, Car, Wrench, Factory, Cpu, Settings, Shield, Droplets, Droplet, Coffee, Truck, Users, Package, Globe, Power, Battery, Monitor, Server, Database, HardDrive, Briefcase, Home, Tool, Gauge, Settings2, Plane, Shirt, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/AppointmentForm";

/**
 * Représentation d'une parcelle avec géométrie et règlements
 */
interface Parcel {
  /** Identifiant unique */
  id: string;
  /** Référence cadastrale */
  reference: string;
  /** Statut de disponibilité */
  status: string;
  /** Indique si la parcelle est libre */
  isFree?: boolean;
  /** Coordonnée X en Lambert Maroc */
  lambertX?: number | null;
  /** Coordonnée Y en Lambert Maroc */
  lambertY?: number | null;
  /** Latitude en WGS84 */
  latitude?: number;
  /** Longitude en WGS84 */
  longitude?: number;
  /** Superficie en m² */
  area?: number | null;
  /** Prix au m² */
  price?: number | null;
  /** Sommets du polygone de la parcelle */
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[];
  /** Coefficient d'occupation du sol */
  cos?: number | null;
  /** Coefficient d'utilisation du sol */
  cus?: number | null;
  /** Limite de hauteur en mètres */
  heightLimit?: number | null;
  /** Recul obligatoire en mètres */
  setback?: number | null;
  /** Nom de la zone parente */
  zoneName?: string | null;
  /** Adresse de la zone */
  zoneAddress?: string | null;
  /** Prix de la zone */
  zonePrice?: number | null;
  /** Type de prix de la zone */
  zonePriceType?: string | null;
}

/**
 * Représentation d'une activité avec icône
 */
interface Activity {
  activity: {
    name: string;
    icon?: string;
  };
}

/**
 * Représentation d'un équipement avec icône
 */
interface Amenity {
  name: string;
  icon?: string;
}

/**
 * Représentation d'une zone industrielle avec ses parcelles
 */
interface Zone {
  /** Identifiant unique */
  id: string;
  /** Nom de la zone */
  name: string;
  /** Statut global */
  status: string;
  /** Coordonnée X du centroide en Lambert */
  lambertX?: number | null;
  /** Coordonnée Y du centroide en Lambert */
  lambertY?: number | null;
  /** Latitude du centroide en WGS84 */
  latitude?: number;
  /** Longitude du centroide en WGS84 */
  longitude?: number;
  /** Liste des parcelles de la zone */
  parcels?: Parcel[];
  /** Sommets du polygone de la zone */
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[];
  /** Activités autorisées dans cette zone */
  activities?: Activity[];
  /** Équipements disponibles dans cette zone */
  amenities?: Amenity[];
}

export default function ZoneMap({ zone }: { zone: Zone }) {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [_zone_parcels, setZoneParcels] = useState<Parcel[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

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
      'Building2': Building2,
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
      
      // Icônes spécifiques à la carte
      'MapPin': MapPin,
      'Square': Square
    }
    
    return iconMap[iconName] || Factory
  }

  const isParcelWrapper = (data: unknown): data is { items: Parcel[] } =>
    typeof data === 'object' && data !== null && Array.isArray((data as { items?: unknown }).items);

  useEffect(() => {
    if (Array.isArray(zone.parcels)) setZoneParcels(zone.parcels);
    else if (isParcelWrapper(zone.parcels)) setZoneParcels(zone.parcels.items);
    else setZoneParcels([]);
  }, [zone.parcels]);

  // Use parameters matching EPSG:26191 so parcels align with database values
  const lambertMA =
    '+proj=lcc +lat_1=33.3 +lat_0=33.3 +lon_0=-5.4 +k_0=0.999625769 +x_0=500000 +y_0=300000 +ellps=clrk80ign +towgs84=31,146,47,0,0,0,0 +units=m +no_defs';
  const toLatLng = (x: number, y: number): [number, number] => {
    const [lon, lat] = proj4(lambertMA, proj4.WGS84, [x, y]);
    return [lon, lat];
  };

  const center: [number, number] = useMemo(() => {
    if (zone.latitude != null && zone.longitude != null) {
      return [zone.latitude, zone.longitude];
    }
    if (zone.lambertX != null && zone.lambertY != null) {
      const [lon, lat] = toLatLng(zone.lambertX, zone.lambertY);
      return [lat, lon];
    }
    return [31.7, -6.5];
  }, [zone.latitude, zone.longitude, zone.lambertX, zone.lambertY]);

  const zonePolygon: [number, number][] = useMemo(() => {
    if (zone.vertices && zone.vertices.length > 2) {
      try {
        const polygon = zone.vertices
          .sort((a, b) => a.seq - b.seq)
          .map((v) => {
            if (v.lat != null && v.lon != null) {
              return [v.lat, v.lon] as [number, number];
            }
            const [lon, lat] = toLatLng(v.lambertX, v.lambertY);
            return [lat, lon] as [number, number];
          });
        return polygon;
      } catch (error) {
        console.error('Erreur lors du calcul du polygone de zone:', error);
      }
    }
    
    // Fallback
    const [lat, lon] = center;
    return [
      [lat + 0.01, lon - 0.01],
      [lat + 0.01, lon + 0.01],
      [lat - 0.01, lon + 0.01],
      [lat - 0.01, lon - 0.01],
    ];
  }, [zone.vertices, center]);

  const parcelPoly = useCallback(
    (p: Parcel): [number, number][] => {
      if (p.vertices && p.vertices.length > 2) {
        try {
          const polygon = p.vertices
            .sort((a, b) => a.seq - b.seq)
            .map((v) => {
              if (v.lat != null && v.lon != null) {
                return [v.lat, v.lon] as [number, number];
              }
              const [lon, lat] = toLatLng(v.lambertX, v.lambertY);
              return [lat, lon] as [number, number];
            });
          return polygon;
        } catch (error) {
          console.error('Erreur polygone parcelle:', error);
        }
      }

      // Fallback
      const size = 100;
      const baseX = p.lambertX ?? zone.lambertX ?? 0;
      const baseY = p.lambertY ?? zone.lambertY ?? 0;
      try {
        const [lon1, lat1] = toLatLng(baseX - size, baseY - size);
        const [lon2, lat2] = toLatLng(baseX - size, baseY + size);
        const [lon3, lat3] = toLatLng(baseX + size, baseY + size);
        const [lon4, lat4] = toLatLng(baseX + size, baseY - size);
        return [
          [lat1, lon1],
          [lat2, lon2],
          [lat3, lon3],
          [lat4, lon4],
        ];
      } catch (error) {
        console.error('Erreur fallback parcelle:', error);
        const [lat, lon] = center;
        return [
          [lat + 0.001, lon - 0.001],
          [lat + 0.001, lon + 0.001],
          [lat - 0.001, lon + 0.001],
          [lat - 0.001, lon - 0.001],
        ];
      }
    },
    [zone.lambertX, zone.lambertY, center]
  );

  const isDataReady = useMemo(() => {
    return zone && zone.id && zonePolygon && zonePolygon.length > 2;
  }, [zone, zonePolygon]);

  useEffect(() => {
    if (isDataReady && !isMapReady) {
      const timer = setTimeout(() => {
        setIsMapReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDataReady, isMapReady]);

  useEffect(() => {
    setIsMapReady(false);
  }, [zone.id]);

  const zoneColor: Record<string, string> = {
    LIBRE: "#8C6B2F",
    AVAILABLE: "#8C6B2F",
    RESERVE: "#C9A956",
    RESERVED: "#C9A956", 
    VENDU: "#CCCCCC",
    OCCUPIED: "#CCCCCC",
    DEVELOPPEMENT: "#A79059",
    SHOWROOM: "#1C1C1C",
  };

  const parcelColor = (s: string) => {
    switch (s) {
      case "LIBRE":
      case "AVAILABLE":
        return "#4CAF50"; // Vert vif pour les disponibles
      case "RESERVEE":
      case "RESERVED":
        return "#FF9800"; // Orange vif pour les réservées
      case "VENDU":
      case "OCCUPIED":
        return "#F44336"; // Rouge vif pour les vendues/occupées
      case "SHOWROOM":
        return "#9C27B0"; // Violet vif pour les showrooms
      default:
        return "#757575"; // Gris foncé pour les autres statuts
    }
  };

  // Icônes pour les marqueurs de parcelles
  const PARCEL_ICONS = useMemo(() => {
    const createParcelIcon = (color: string, status: string) => {
      const isShowroom = status === "SHOWROOM";
      const IconComponent = isShowroom ? Building2 : Square;
      
      return L.divIcon({
        html: renderToStaticMarkup(
          <div className="relative">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <IconComponent width={14} height={14} stroke="white" fill="white" />
            </div>
          </div>
        ),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    return {
      LIBRE: createParcelIcon('#4CAF50', 'LIBRE'), // Vert vif pour les disponibles
      AVAILABLE: createParcelIcon('#4CAF50', 'AVAILABLE'), // Vert vif pour les disponibles
      RESERVEE: createParcelIcon('#FF9800', 'RESERVEE'), // Orange vif pour les réservées
      RESERVED: createParcelIcon('#FF9800', 'RESERVED'), // Orange vif pour les réservées
      VENDU: createParcelIcon('#F44336', 'VENDU'), // Rouge vif pour les vendues
      OCCUPIED: createParcelIcon('#F44336', 'OCCUPIED'), // Rouge vif pour les occupées
      SHOWROOM: createParcelIcon('#9C27B0', 'SHOWROOM'), // Violet vif pour les showrooms
      DEFAULT: createParcelIcon('#757575', 'DEFAULT'), // Gris foncé pour les autres
    };
  }, []);

  // Calculer le centre d'une parcelle pour le marqueur
  const getParcelCenter = useCallback(
    (p: Parcel): [number, number] => {
      // Si on a des coordonnées WGS84 directes
      if (p.latitude != null && p.longitude != null) {
        return [p.latitude, p.longitude];
      }
      
      // Si on a des vertices, calculer le centroide
      if (p.vertices && p.vertices.length > 0) {
        const validVertices = p.vertices.filter(v => 
          (v.lat != null && v.lon != null) || 
          (v.lambertX != null && v.lambertY != null)
        );
        
        if (validVertices.length > 0) {
          let totalLat = 0;
          let totalLon = 0;
          
          validVertices.forEach(v => {
            if (v.lat != null && v.lon != null) {
              totalLat += v.lat;
              totalLon += v.lon;
            } else {
              const [lon, lat] = toLatLng(v.lambertX, v.lambertY);
              totalLat += lat;
              totalLon += lon;
            }
          });
          
          return [totalLat / validVertices.length, totalLon / validVertices.length];
        }
      }
      
      // Fallback avec coordonnées Lambert
      if (p.lambertX != null && p.lambertY != null) {
        const [lon, lat] = toLatLng(p.lambertX, p.lambertY);
        return [lat, lon];
      }
      
      // Dernier fallback - centre de la zone
      return center;
    },
    [center]
  );

  if (!isDataReady) {
    return (
      <div className="relative overflow-hidden h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-industria-brown-gold mx-auto"></div>
          <p className="text-gray-600">Chargement des données de la zone...</p>
        </div>
      </div>
    );
  }

  if (!isMapReady) {
    return (
      <div className="relative overflow-hidden h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="animate-pulse rounded-full h-8 w-8 bg-industria-brown-gold mx-auto"></div>
          <p className="text-gray-600">Préparation de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden h-full w-full">
      <MapContainer
        key={`map-${zone.id}-${zone.vertices?.length || 0}-${isMapReady}`}
        center={center}
        zoom={14} /* Zoom modéré pour un bon équilibre */
        style={{ height: "100%", width: "100%" }}
        whenCreated={(m) => {
          mapRef.current = m;
          setTimeout(() => {
            m.invalidateSize();
            if (zonePolygon && zonePolygon.length > 2) {
              try {
                const bounds = L.latLngBounds(zonePolygon);
                m.fitBounds(bounds, { padding: [20, 20] });
                // Force un zoom modéré après fitBounds
                setTimeout(() => {
                  const currentZoom = m.getZoom();
                  if (currentZoom < 13) {
                    m.setZoom(13);
                  }
                }, 100);
              } catch (e) {
                console.warn('Erreur lors du centrage:', e);
              }
            } else {
              // Fallback: force zoom modéré si pas de polygone
              m.setZoom(14);
            }
          }, 200);
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polygon
          key={`zone-polygon-${zone.id}-${zone.vertices?.length || 0}`}
          positions={zonePolygon}
          pathOptions={{
            color: zoneColor[zone.status] || "#8C6B2F",
            opacity: 1.0, // Opacité maximale pour une meilleure visibilité
            fillColor: zoneColor[zone.status] || "#8C6B2F",
            fillOpacity: 0.1, // Réduit pour ne pas masquer les parcelles
            weight: 4, // Augmenté pour des bordures plus visibles
          }}
        >
          <Popup maxWidth={400}>
            <div className="space-y-3 text-sm max-w-sm">
              {/* Titre de la zone */}
              <div className="bg-gradient-to-r from-industria-brown-gold/10 to-industria-olive-light/10 -m-3 p-3 mb-3 rounded-t-lg">
                <strong className="text-lg text-industria-brown-gold">{zone.name}</strong>
                <div className="text-gray-600 mt-1">Statut: {zone.status}</div>
              </div>
              
              {/* Coordonnées si disponibles */}
              {zone.latitude != null && zone.longitude != null && (
                <div className="text-xs text-gray-500">
                  Coordonnées: {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
                </div>
              )}
              
              {/* Activités autorisées */}
              {zone.activities && zone.activities.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">Activités autorisées</h5>
                  <div className="flex flex-wrap gap-1">
                    {zone.activities.slice(0, 4).map((activity, i) => {
                      const IconComponent = getLucideIcon(activity.activity.icon)
                      return (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                          <IconComponent className="w-3 h-3" />
                          <span>{activity.activity.name}</span>
                        </span>
                      )
                    })}
                    {zone.activities.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">
                        +{zone.activities.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Équipements disponibles */}
              {zone.amenities && zone.amenities.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">Équipements</h5>
                  <div className="flex flex-wrap gap-1">
                    {zone.amenities.slice(0, 4).map((amenity, i) => {
                      const IconComponent = getLucideIcon(amenity.icon)
                      return (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                          <IconComponent className="w-3 h-3" />
                          <span>{amenity.name}</span>
                        </span>
                      )
                    })}
                    {zone.amenities.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">
                        +{zone.amenities.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Popup>
        </Polygon>
        {/* Affichage des parcelles avec des polygones semi-transparents ET des marqueurs */}
        {(Array.isArray(_zone_parcels) ? _zone_parcels : []).map(
          (p) => {
            const hasValidCoords = (p.lambertX != null && p.lambertY != null) || (p.vertices && p.vertices.length > 2);
            const parcelCenter = getParcelCenter(p);
            const parcelIcon = PARCEL_ICONS[p.status as keyof typeof PARCEL_ICONS] || PARCEL_ICONS.DEFAULT;
            
            return hasValidCoords && (
              <React.Fragment key={`parcel-${p.id}-${p.vertices?.length || 0}`}>
                {/* Polygone semi-transparent pour délimiter la parcelle */}
                <Polygon
                  positions={parcelPoly(p)}
                  pathOptions={{
                    color: parcelColor(p.status),
                    opacity: 0.9, // Augmenté pour des bordures plus visibles
                    fillColor: parcelColor(p.status),
                    fillOpacity: 0.15, // Légèrement augmenté pour une meilleure distinction
                    weight: 2, // Augmenté pour des bordures plus épaisses
                  }}
                />
                {/* Marqueur au centre de la parcelle */}
                <Marker
                  position={parcelCenter}
                  icon={parcelIcon}
                >
                  <Popup>
                    <div className="space-y-3 text-sm max-w-sm">
                      {/* En-tête avec statut et design amélioré */}
                      <div className="bg-gradient-to-r from-industria-brown-gold/10 to-industria-olive-light/10 -m-3 p-3 mb-3 rounded-t-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: parcelColor(p.status) }}
                          />
                          <strong className="text-lg text-industria-brown-gold">{p.reference}</strong>
                        </div>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'LIBRE' || p.status === 'AVAILABLE' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : p.status === 'RESERVEE' || p.status === 'RESERVED'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {p.status === 'LIBRE' || p.status === 'AVAILABLE' ? '✓ Disponible' :
                           p.status === 'RESERVEE' || p.status === 'RESERVED' ? '⏳ Réservée' :
                           p.status === 'VENDU' || p.status === 'OCCUPIED' ? '✗ Vendue' :
                           p.status}
                        </div>
                      </div>
                      
                      {/* Informations générales avec design amélioré */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <Square className="w-4 h-4 text-industria-brown-gold" />
                          Informations
                        </h4>
                        <div className="grid grid-cols-1 gap-2 ml-6">
                          {p.area && (
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">Surface</span>
                              <span className="font-bold text-industria-brown-gold">{p.area.toLocaleString()} m²</span>
                            </div>
                          )}
                          {p.price && (
                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                              <span className="text-gray-600">Prix parcelle</span>
                              <span className="font-bold text-blue-600">{p.price.toLocaleString()} DH</span>
                            </div>
                          )}
                          {p.zoneName && (
                            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                              <span className="text-gray-600">Zone</span>
                              <span className="font-medium text-green-600">{p.zoneName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contraintes techniques avec meilleur design */}
                      {(p.cos || p.cus || p.heightLimit || p.setback) && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-industria-olive-light" />
                            Contraintes
                          </h4>
                          <div className="grid grid-cols-2 gap-2 ml-6">
                            {p.cos && (
                              <div className="text-center p-2 bg-orange-50 rounded">
                                <div className="text-xs text-gray-500">COS</div>
                                <div className="font-bold text-orange-600">{p.cos}</div>
                              </div>
                            )}
                            {p.cus && (
                              <div className="text-center p-2 bg-purple-50 rounded">
                                <div className="text-xs text-gray-500">CUS</div>
                                <div className="font-bold text-purple-600">{p.cus}</div>
                              </div>
                            )}
                            {p.heightLimit && (
                              <div className="text-center p-2 bg-red-50 rounded">
                                <div className="text-xs text-gray-500">Hauteur max</div>
                                <div className="font-bold text-red-600">{p.heightLimit}m</div>
                              </div>
                            )}
                            {p.setback && (
                              <div className="text-center p-2 bg-yellow-50 rounded">
                                <div className="text-xs text-gray-500">Recul</div>
                                <div className="font-bold text-yellow-600">{p.setback}m</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}


                      {/* Adresse si disponible */}
                      {p.zoneAddress && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-industria-brown-gold">
                          📍 {p.zoneAddress}
                        </div>
                      )}

                      {/* Bouton de réservation amélioré */}
                      {(p.status === "AVAILABLE" || p.status === "LIBRE") && (
                        <div className="pt-3 border-t">
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-industria-brown-gold to-industria-olive-light hover:from-industria-olive-light hover:to-industria-brown-gold text-white font-semibold py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={() => setSelected(p)}
                          >
                            <span className="mr-2">📅</span>
                            Réserver cette parcelle
                          </Button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          }
        )}
      </MapContainer>
      {selected && (
        <AppointmentForm parcel={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}