"use client";

import { MapContainer, TileLayer, Polygon, Popup, Marker } from "react-leaflet";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import L from "leaflet";
import proj4 from "proj4";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin, Home, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/AppointmentForm";

interface Parcel {
  id: string;
  reference: string;
  status: string;
  isFree?: boolean;
  lambertX?: number | null;
  lambertY?: number | null;
  latitude?: number;
  longitude?: number;
  area?: number | null;
  price?: number | null;
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[];
}

interface Zone {
  id: string;
  name: string;
  status: string;
  lambertX?: number | null;
  lambertY?: number | null;
  latitude?: number;
  longitude?: number;
  parcels?: Parcel[];
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[];
}

export default function ZoneMap({ zone }: { zone: Zone }) {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [_zone_parcels, setZoneParcels] = useState<Parcel[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

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
        return "#A79059";
      case "RESERVEE":
      case "RESERVED":
        return "#C9A956";
      case "VENDU":
      case "OCCUPIED":
        return "#8C6B2F";
      case "SHOWROOM":
        return "#1C1C1C";
      default:
        return "#CCCCCC";
    }
  };

  // Icônes pour les marqueurs de parcelles
  const PARCEL_ICONS = useMemo(() => {
    const createParcelIcon = (color: string, status: string) => {
      const isShowroom = status === "SHOWROOM";
      const IconComponent = isShowroom ? Building2 : Home;
      
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
      LIBRE: createParcelIcon('#A79059', 'LIBRE'),
      AVAILABLE: createParcelIcon('#A79059', 'AVAILABLE'),
      RESERVEE: createParcelIcon('#C9A956', 'RESERVEE'),
      RESERVED: createParcelIcon('#C9A956', 'RESERVED'),
      VENDU: createParcelIcon('#8C6B2F', 'VENDU'),
      OCCUPIED: createParcelIcon('#8C6B2F', 'OCCUPIED'),
      SHOWROOM: createParcelIcon('#1C1C1C', 'SHOWROOM'),
      DEFAULT: createParcelIcon('#CCCCCC', 'DEFAULT'),
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
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(m) => {
          mapRef.current = m;
          setTimeout(() => {
            m.invalidateSize();
            if (zonePolygon && zonePolygon.length > 2) {
              try {
                const bounds = L.latLngBounds(zonePolygon);
                m.fitBounds(bounds, { padding: [20, 20] });
              } catch (e) {
                console.warn('Erreur lors du centrage:', e);
              }
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
            opacity: 0.8,
            fillColor: zoneColor[zone.status] || "#8C6B2F",
            fillOpacity: 0.2,
            weight: 3,
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <strong>{zone.name}</strong>
              <div>Statut: {zone.status}</div>
              {zone.latitude != null && zone.longitude != null && (
                <div>
                  Lat: {zone.latitude.toFixed(5)}, Lon: {zone.longitude.toFixed(5)}
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
                    opacity: 0.6,
                    fillColor: parcelColor(p.status),
                    fillOpacity: 0.1,
                    weight: 1,
                  }}
                />
                {/* Marqueur au centre de la parcelle */}
                <Marker
                  position={parcelCenter}
                  icon={parcelIcon}
                >
                  <Popup>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow"
                          style={{ backgroundColor: parcelColor(p.status) }}
                        />
                        <strong>{p.reference}</strong>
                      </div>
                      {p.area && <div><span className="font-medium">Surface:</span> {p.area} m²</div>}
                      {p.price && <div><span className="font-medium">Prix:</span> {p.price} DH</div>}
                      <div><span className="font-medium">Statut:</span> {p.status}</div>
                      {p.latitude != null && p.longitude != null && (
                        <div className="text-xs text-gray-600">
                          Lat: {p.latitude.toFixed(5)}, Lon: {p.longitude.toFixed(5)}
                        </div>
                      )}
                      {(p.status === "AVAILABLE" || p.status === "LIBRE") && p.isFree && (
                        <Button
                          size="sm"
                          className="mt-2 w-full bg-industria-brown-gold hover:bg-industria-olive-light"
                          onClick={() => setSelected(p)}
                        >
                          Prendre rendez-vous
                        </Button>
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