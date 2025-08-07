"use client";

import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import L from "leaflet";
import maplibregl from "maplibre-gl";
import "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import proj4 from "proj4";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/AppointmentForm";
import type { Feature, FeatureCollection } from "geojson";

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
  const mapRef = useRef<L.Map | null>(null);
  const glLayerRef = useRef<{
    getMaplibreMap(): maplibregl.Map;
    remove(): void;
  } | null>(null);
  const glMapRef = useRef<maplibregl.Map | null>(null);

  const isParcelWrapper = (data: unknown): data is { items: Parcel[] } =>
    typeof data === 'object' && data !== null && Array.isArray((data as { items?: unknown }).items);

  useEffect(() => {
    if (Array.isArray(zone.parcels)) setZoneParcels(zone.parcels);
    else if (isParcelWrapper(zone.parcels)) setZoneParcels(zone.parcels.items);
    else setZoneParcels([]);
  }, [zone.parcels]);

  useEffect(() => {
    if (!mapRef.current) return;
    // Ensure Leaflet calculates dimensions correctly when the component mounts
    const t = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const LMaplibre = L as unknown as typeof L & {
      maplibreGL: (opts: {
        style: maplibregl.StyleSpecification | string;
        interactive: boolean;
      }) => {
        addTo(map: L.Map): { getMaplibreMap(): maplibregl.Map; remove(): void };
      };
    };
    const layer = LMaplibre
      .maplibreGL({ style: { version: 8, sources: {}, layers: [] }, interactive: false })
      .addTo(mapRef.current);
    glLayerRef.current = layer;
    const mlMap = layer.getMaplibreMap();
    glMapRef.current = mlMap;

    const colorExpr = [
      "match",
      ["get", "status"],
      "AVAILABLE",
      "green",
      "RESERVED",
      "orange",
      "OCCUPIED",
      "red",
      "SHOWROOM",
      "blue",
      "gray",
    ] as maplibregl.Expression;

    const handleLoad = () => {
      mlMap.addSource("zones", { type: "geojson", data: geojsonData });
      mlMap.addLayer({
        id: "zones-fill",
        type: "fill",
        source: "zones",
        paint: { "fill-color": colorExpr, "fill-opacity": 0.4 },
      });
      mlMap.addLayer({
        id: "zones-outline",
        type: "line",
        source: "zones",
        paint: { "line-color": colorExpr, "line-width": 2 },
      });
    };
    mlMap.on("load", handleLoad);

    return () => {
      mlMap.off("load", handleLoad);
      try {
        mlMap.remove();
      } catch {}
      glMapRef.current = null;
      try {
        layer.remove();
      } catch {}
      glLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (glMapRef.current?.getSource("zones")) {
      (glMapRef.current.getSource("zones") as maplibregl.GeoJSONSource).setData(
        geojsonData
      );
    }
  }, [geojsonData]);

  // Use parameters matching EPSG:26191 so parcels align with database values
  const lambertMA =
    '+proj=lcc +lat_1=33.3 +lat_0=33.3 +lon_0=-5.4 +k_0=0.999625769 +x_0=500000 +y_0=300000 +ellps=clrk80ign +towgs84=31,146,47,0,0,0,0 +units=m +no_defs';
  const toLatLng = (x: number, y: number): [number, number] => {
    const [lon, lat] = proj4(lambertMA, proj4.WGS84, [x, y]);
    return [lon, lat];
  };

  const center: [number, number] =
    zone.latitude != null && zone.longitude != null
      ? [zone.latitude, zone.longitude]
      : zone.lambertX != null && zone.lambertY != null
        ? (() => { const [lon, lat] = toLatLng(zone.lambertX, zone.lambertY); return [lat, lon] })()
        : [31.7, -6.5]

  const zonePolygon: [number, number][] = zone.vertices && zone.vertices.length
    ? zone.vertices
        .sort((a, b) => a.seq - b.seq)
        .map((v) =>
          v.lat != null && v.lon != null
            ? [v.lat, v.lon]
            : (() => {
                const [lon, lat] = toLatLng(v.lambertX, v.lambertY);
                return [lat, lon];
              })()
        )
    : (() => {
        const [lat, lon] = center;
        return [
          [lat + 0.01, lon - 0.01],
          [lat + 0.01, lon + 0.01],
          [lat - 0.01, lon + 0.01],
          [lat - 0.01, lon - 0.01],
        ];
      })();

  const zonePolygonGL = useMemo(
    () => zonePolygon.map(([lat, lon]) => [lon, lat]),
    [zonePolygon]
  );

  const parcelPoly = useCallback(
    (p: Parcel): [number, number][] =>
      p.vertices && p.vertices.length
        ? p.vertices
            .sort((a, b) => a.seq - b.seq)
            .map((v) =>
              v.lat != null && v.lon != null
                ? [v.lat, v.lon]
                : (() => {
                    const [lon, lat] = toLatLng(v.lambertX, v.lambertY);
                    return [lat, lon];
                  })()
            )
        : (() => {
            const size = 100; // meters in Lambert units
            const baseX = p.lambertX ?? zone.lambertX ?? 0;
            const baseY = p.lambertY ?? zone.lambertY ?? 0;
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
          })(),
    [zone.lambertX, zone.lambertY]
  );

  const geojsonData = useMemo<FeatureCollection>(() => {
    const features: Feature[] = [];
    if (zonePolygonGL.length) {
      features.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [zonePolygonGL] },
        properties: { id: zone.id, status: zone.status },
      });
    }
    for (const p of _zone_parcels) {
      if (p.lambertX != null && p.lambertY != null) {
        const coords = parcelPoly(p).map(([lat, lon]) => [lon, lat]);
        features.push({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [coords] },
          properties: { id: p.id, status: p.status },
        });
      }
    }
    return { type: "FeatureCollection", features } as FeatureCollection;
  }, [_zone_parcels, zone.id, zone.status, zonePolygonGL, parcelPoly]);

  const zoneColor: Record<string, string> = {
    AVAILABLE: "green",
    RESERVED: "orange",
    OCCUPIED: "red",
    SHOWROOM: "blue",
  };

  const parcelColor = (s: string) => {
    switch (s) {
      case "AVAILABLE":
        return "green";
      case "RESERVED":
        return "red";
      case "OCCUPIED":
        return "gray";
      case "SHOWROOM":
        return "blue";
      default:
        return "gray";
    }
  };

  return (
    <div className="relative overflow-hidden" style={{ height: 350 }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(m) => {
          mapRef.current = m
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polygon
          positions={zonePolygon}
          pathOptions={{
            color: zoneColor[zone.status] || "blue",
            opacity: 0,
            fillOpacity: 0,
            weight: 0,
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
        {(Array.isArray(_zone_parcels) ? _zone_parcels : []).map(
          (p) =>
            (p.lambertX != null && p.lambertY != null) && (
              <Polygon
                key={p.id}
                positions={parcelPoly(p)}
                pathOptions={{
                  color: parcelColor(p.status),
                  fillOpacity: 0,
                  opacity: 0,
                  weight: 0,
                }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <strong>{p.reference}</strong>
                    {p.area && <div>Surface: {p.area} m²</div>}
                    {p.price && <div>Prix: {p.price} DH</div>}
                    <div>Statut: {p.status}</div>
                    {p.latitude != null && p.longitude != null && (
                      <div>
                        Lat: {p.latitude.toFixed(5)}, Lon: {p.longitude.toFixed(5)}
                      </div>
                    )}
                    {p.status === "AVAILABLE" && p.isFree && (
                      <Button
                        size="sm"
                        className="mt-1"
                        onClick={() => setSelected(p)}
                      >
                        Réserver
                      </Button>
                    )}
                  </div>
                </Popup>
              </Polygon>
            ),
        )}
      </MapContainer>
      {selected && (
        <AppointmentForm parcel={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
