"use client";

import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/AppointmentForm";

interface Vertex { seq: number; lat: number; lon: number }
interface Parcel {
  id: string;
  reference: string;
  status: string;
  isFree?: boolean;
  latitude?: number;
  longitude?: number;
  area?: number | null;
  isShowroom?: boolean | null;
  vertices?: Vertex[];
}

interface Zone {
  id: string;
  name: string;
  status: string;
  latitude?: number;
  longitude?: number;
  parcels: Parcel[];
  vertices?: Vertex[];
}

export default function ZoneMap({ zone }: { zone: Zone }) {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // Ensure Leaflet calculates dimensions correctly when the component mounts
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
  }, []);


  const centroid = (verts: Vertex[]): [number, number] | null => {
    if (!verts.length) return null
    let sumX = 0
    let sumY = 0
    for (const v of verts) {
      sumX += v.lon
      sumY += v.lat
    }
    return [sumX / verts.length, sumY / verts.length]
  }

  const center = zone.latitude != null && zone.longitude != null
    ? [zone.latitude, zone.longitude]
    : zone.vertices && zone.vertices.length
      ? (() => {
          const verts = [...zone.vertices].sort((a, b) => a.seq - b.seq)
          const c = centroid(verts)
          if (!c) return [31.7, -6.5]
          return [c[1], c[0]]
        })()
      : [31.7, -6.5]

  const zonePolygon: [number, number][] = zone.vertices && zone.vertices.length
    ? zone.vertices
        .sort((a, b) => a.seq - b.seq)
        .map((v) => [v.lat, v.lon])
    : (() => {
        const [lat, lon] = center;
        return [
          [lat + 0.01, lon - 0.01],
          [lat + 0.01, lon + 0.01],
          [lat - 0.01, lon + 0.01],
          [lat - 0.01, lon - 0.01],
        ];
      })();

  const parcelPoly = (p: Parcel): [number, number][] =>
    p.vertices && p.vertices.length
      ? p.vertices
          .sort((a, b) => a.seq - b.seq)
          .map((v) => [v.lat, v.lon])
      : []

  const zoneColor: Record<string, string> = {
    LIBRE: "green",
    RESERVEE: "orange",
    INDISPONIBLE: "red",
    VENDU: "blue",
    EN_DEVELOPPEMENT: "gray",
  };

  const parcelColor = (s: string) => {
    switch (s) {
      case "LIBRE":
        return "green";
      case "RESERVEE":
        return "red";
      case "INDISPONIBLE":
        return "gray";
      case "VENDU":
        return "blue";
      case "EN_DEVELOPPEMENT":
        return "orange";
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
          pathOptions={{ color: zoneColor[zone.status] || "blue" }}
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
        {zone.parcels.map(
          (p) =>
            (p.vertices && p.vertices.length > 0) && (
              <Polygon
                key={p.id}
                positions={parcelPoly(p)}
                pathOptions={{ color: parcelColor(p.status), fillOpacity: 0.5 }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <strong>{p.reference}</strong>
                    {p.area && <div>Surface: {p.area} m²</div>}
                    <div>Statut: {p.status}</div>
                    {p.latitude != null && p.longitude != null && (
                      <div>
                        Lat: {p.latitude.toFixed(5)}, Lon: {p.longitude.toFixed(5)}
                      </div>
                    )}
                    {p.status === "LIBRE" && p.isFree && (
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
