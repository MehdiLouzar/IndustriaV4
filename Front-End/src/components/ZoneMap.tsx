"use client";

import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import { useState, useRef, useEffect } from "react";
import proj4 from "proj4";
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
  parcels: Parcel[];
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[];
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

  // Use parameters matching EPSG:26191 so parcels align with database values
  const lambertMA =
    '+proj=lcc +lat_1=33.3 +lat_0=33.3 +lon_0=-5.4 +k_0=0.999625769 +x_0=500000 +y_0=300000 +ellps=clrk80ign +towgs84=31,146,47,0,0,0,0 +units=m +no_defs';
  const toLatLng = (x: number, y: number): [number, number] => {
    const [lon, lat] = proj4(lambertMA, proj4.WGS84, [x, y]);
    return [lon, lat];
  };

  const centroid = (verts: { lambertX: number; lambertY: number }[]): [number, number] | null => {
    if (!verts.length) return null
    if (verts.length < 3) {
      const sum = verts.reduce((acc, v) => [acc[0] + v.lambertX, acc[1] + v.lambertY], [0,0])
      return [sum[0] / verts.length, sum[1] / verts.length]
    }
    let area = 0
    let cx = 0
    let cy = 0
    for (let i = 0; i < verts.length; i++) {
      const x1 = verts[i].lambertX
      const y1 = verts[i].lambertY
      const x2 = verts[(i+1)%verts.length].lambertX
      const y2 = verts[(i+1)%verts.length].lambertY
      const f = x1*y2 - x2*y1
      area += f
      cx += (x1 + x2) * f
      cy += (y1 + y2) * f
    }
    area *= 0.5
    if (area === 0) {
      const sum = verts.reduce((acc, v) => [acc[0] + v.lambertX, acc[1] + v.lambertY], [0,0])
      return [sum[0] / verts.length, sum[1] / verts.length]
    }
    cx /= (6*area)
    cy /= (6*area)
    return [cx, cy]
  }

  const center = zone.latitude != null && zone.longitude != null
    ? [zone.latitude, zone.longitude]
    : zone.vertices && zone.vertices.length
      ? (() => {
          const verts = [...zone.vertices].sort((a, b) => a.seq - b.seq)
          const c = centroid(verts)
          if (!c) return [31.7, -6.5]
          const [lon, lat] = toLatLng(c[0], c[1])
          return [lat, lon]
        })()
      : zone.lambertX != null && zone.lambertY != null
        ? (() => { const [lon, lat] = toLatLng(zone.lambertX, zone.lambertY); return [lat, lon] })()
        : [31.7, -6.5]

  const zonePolygon: [number, number][] = zone.vertices && zone.vertices.length
    ? zone.vertices
        .sort((a, b) => a.seq - b.seq)
        .map((v) =>
          v.lat != null && v.lon != null
            ? [v.lat, v.lon]
            : (() => { const [lon, lat] = toLatLng(v.lambertX, v.lambertY); return [lat, lon] })()
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

  const parcelPoly = (p: Parcel): [number, number][] =>
    p.vertices && p.vertices.length
      ? p.vertices
          .sort((a, b) => a.seq - b.seq)
          .map((v) =>
            v.lat != null && v.lon != null
              ? [v.lat, v.lon]
              : (() => { const [lon, lat] = toLatLng(v.lambertX, v.lambertY); return [lat, lon] })()
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
        })();

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
            (p.lambertX != null && p.lambertY != null) && (
              <Polygon
                key={p.id}
                positions={parcelPoly(p)}
                pathOptions={{ color: parcelColor(p.status), fillOpacity: 0.5 }}
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
