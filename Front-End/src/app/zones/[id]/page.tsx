"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
const ZoneMap = dynamic(() => import("@/components/ZoneMap"), {
  ssr: false,
  loading: () => <p>Chargement de la carte...</p>,
});
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppointmentForm from "@/components/AppointmentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/utils";

interface Vertex { seq: number; lat: number; lon: number }
interface Parcel {
  id: string;
  reference: string;
  status: string;
  latitude?: number;
  longitude?: number;
  area?: number | null;
  isShowroom?: boolean | null;
  vertices?: Vertex[];
}

interface Zone {
  id: string;
  name: string;
  description?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  totalArea?: number | null;
  price?: number | null;
  region?: { name: string } | null;
  zoneType?: { name: string } | null;
  activities?: string[];
  amenities?: string[];
  parcels: Parcel[];
  vertices?: Vertex[];
}

export default function ZonePage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [zone, setZone] = useState<Zone | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchApi<Zone>(`/api/zones/${id}`)
      .then((z) => z && setZone(z))
      .catch(console.error);
  }, [id]);

  if (!zone) return <p className="p-4">Chargement...</p>;

  return (
    <>
      <Header />
      <div className="p-4 space-y-6 max-w-5xl mx-auto">
        <Card className="shadow">
          <CardHeader>
            <CardTitle>{zone.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed">
          {zone.description && <p>{zone.description}</p>}
          <p className="text-muted-foreground">Statut: {zone.status}</p>
          {zone.region?.name && <p>Région: {zone.region.name}</p>}
          {zone.zoneType?.name && <p>Type: {zone.zoneType.name}</p>}
          {zone.totalArea && <p>Superficie: {zone.totalArea} m²</p>}
          {zone.price && <p>Prix: {zone.price} DH/m²</p>}
          {zone.latitude != null && zone.longitude != null && (
            <p>
              Coordonnées: {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
            </p>
          )}
          {zone.activities && zone.activities.length > 0 && (
            <p>
              Activités: {zone.activities.join(", ")}
            </p>
          )}
        </CardContent>
        </Card>
        {zone.amenities && zone.amenities.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Equipements de proximité</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {zone.amenities.map((name, i) => (
                <div key={i} className="flex flex-col items-center text-sm">
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="text-right">
          <Button onClick={() => setShowForm(true)}>Prendre rendez-vous</Button>
        </div>
        <div className="pt-4">
          <ZoneMap zone={zone} />
        </div>
      </div>
      <Footer />
      {showForm && zone.parcels[0] && (
        <AppointmentForm
          parcel={{ id: zone.parcels[0].id, reference: zone.parcels[0].reference }}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
