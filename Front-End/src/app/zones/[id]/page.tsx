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
import DynamicIcon from "@/components/DynamicIcon";
import { fetchApi } from "@/lib/utils";
import { fetchPublicApi } from "@/lib/publicApi";
import type { ListResponse } from "@/types";

interface Parcel {
  id: string;
  reference: string;
  status: string;
  isShowroom?: boolean
  area?: number | null;
  zoneId?: string | null
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[]
  latitude?: number | null
  longitude?: number | null
}

interface ZoneResponse {
  id: string
  name: string
  description?: string | null
  address?: string | null
  status: string
  totalArea?: number | null
  price?: number | null
  regionId?: string | null
  zoneTypeId?: string | null
  activityIds?: string[]
  amenityIds?: string[]
  vertices?: { seq: number; lambertX: number; lambertY: number }[]
  latitude?: number | null
  longitude?: number | null
}

interface Zone {
  id: string
  name: string
  description?: string | null
  status: string
  totalArea?: number | null
  price?: number | null
  region?: { name: string } | null
  zoneType?: { name: string } | null
  activities?: { activity: { name: string } }[]
  amenities?: string[]
  parcels?: Parcel[]
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[]
  latitude?: number | null
  longitude?: number | null
}

export default function ZonePage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [zone, setZone] = useState<Zone | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function load() {
      const z = await fetchPublicApi<ZoneResponse>(`/api/zones/${id}`)
      if (!z) return

      const region = z.regionId ? await fetchPublicApi<{ name: string }>(`/api/regions/${z.regionId}`) : null
      const zoneType = z.zoneTypeId ? await fetchPublicApi<{ name: string }>(`/api/zone-types/${z.zoneTypeId}`) : null

      const [activities, amenities, parcelsRes] = await Promise.all([
        Promise.all((z.activityIds || []).map(aid => fetchPublicApi<{ name: string }>(`/api/activities/${aid}`))),
        Promise.all((z.amenityIds || []).map(aid => fetchPublicApi<{ name: string }>(`/api/amenities/${aid}`))),
        fetchPublicApi<ListResponse<Parcel>>(`/api/parcels?zoneId=${id}`),
      ])

      const parcels = parcelsRes && Array.isArray(parcelsRes.items) ? parcelsRes.items : []
      if (parcelsRes && !Array.isArray((parcelsRes as any).items) && !Array.isArray(parcelsRes)) {
        console.warn('⚠️ Format de données inattendu:', parcelsRes)
      }

      const zone: Zone = {
        id: z.id,
        name: z.name,
        description: z.description ?? null,
        status: z.status,
        totalArea: z.totalArea ?? null,
        price: z.price ?? null,
        region: region ? { name: region.name } : null,
        zoneType: zoneType ? { name: zoneType.name } : null,
        activities: Array.isArray(activities) ? activities.map(a => ({ activity: { name: a?.name || '' } })) : [],
        amenities: Array.isArray(amenities) ? amenities.map(a => a?.name || '') : [],
        parcels,
        vertices: z.vertices,
        latitude: z.latitude ?? null,
        longitude: z.longitude ?? null,
      }
      setZone(zone)
    }
    load()
  }, [id])

  if (!zone) return <p className="p-4">Chargement...</p>;

  return (
    <>
      <Header />
      <div className="p-4 space-y-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-industria-brown-gold to-industria-olive-light text-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{zone.name}</h1>
                {zone.description && (
                  <p className="text-white/90 text-lg mb-4 leading-relaxed">{zone.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="font-semibold text-white/80">Statut</div>
                    <div className="text-lg font-bold">{zone.status}</div>
                  </div>
                  
                  {zone.region?.name && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="font-semibold text-white/80">Région</div>
                      <div className="text-lg font-bold">{zone.region.name}</div>
                    </div>
                  )}
                  
                  {zone.zoneType?.name && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="font-semibold text-white/80">Type</div>
                      <div className="text-lg font-bold">{zone.zoneType.name}</div>
                    </div>
                  )}
                  
                  {zone.totalArea && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="font-semibold text-white/80">Superficie</div>
                      <div className="text-lg font-bold">{zone.totalArea.toLocaleString()} m²</div>
                    </div>
                  )}
                  
                  {zone.price && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="font-semibold text-white/80">Prix</div>
                      <div className="text-lg font-bold">{zone.price} DH/m²</div>
                    </div>
                  )}
                  
                  {zone.latitude != null && zone.longitude != null && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="font-semibold text-white/80">Coordonnées</div>
                      <div className="text-sm font-mono">{zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}</div>
                    </div>
                  )}
                </div>
                
                {Array.isArray(zone.activities) && zone.activities.length > 0 && (
                  <div className="mt-4">
                    <div className="font-semibold text-white/80 mb-2">Activités</div>
                    <div className="flex flex-wrap gap-2">
                      {zone.activities.map((a, i) => (
                        <span key={i} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                          {a.activity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="lg:w-auto flex-shrink-0">
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-white text-industria-brown-gold hover:bg-industria-gray-light transition-colors px-8 py-3 text-lg font-semibold"
                >
                  Prendre rendez-vous
                </Button>
              </div>
            </div>
          </div>
        </div>
        {Array.isArray(zone.amenities) && zone.amenities.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="bg-industria-gray-light">
              <CardTitle className="text-industria-brown-gold flex items-center gap-2">
                <DynamicIcon name="Settings" className="w-5 h-5" />
                Équipements de proximité
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {zone.amenities.map((name, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-industria-gray-light rounded-lg">
                    <div className="w-2 h-2 bg-industria-olive-light rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="shadow-md ">
          <CardHeader className="bg-industria-gray-light">
            <CardTitle className="text-industria-brown-gold flex items-center gap-2">
              <DynamicIcon name="Map" className="w-5 h-5" />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] min-h-[500px] overflow-visible">
              <ZoneMap zone={zone} />
            </div>
          </CardContent>
        </Card>

        {Array.isArray(zone.parcels) && zone.parcels.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="bg-industria-gray-light">
              <CardTitle className="text-industria-brown-gold flex items-center gap-2">
                <DynamicIcon name="Grid" className="w-5 h-5" />
                Parcelles disponibles ({zone.parcels.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zone.parcels.map((parcel, i) => (
                  <div key={parcel.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-industria-gray-light p-4 border-b">
                      <h3 className="font-semibold text-industria-brown-gold text-lg">{parcel.reference}</h3>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        parcel.status === 'LIBRE' ? 'bg-industria-olive-light/20 text-industria-olive-light' :
                        parcel.status === 'RESERVEE' ? 'bg-industria-yellow-gold/20 text-industria-yellow-gold' :
                        parcel.status === 'VENDU' ? 'bg-industria-brown-gold/20 text-industria-brown-gold' :
                        'bg-industria-gray-light text-industria-black'
                      }`}>
                        {parcel.status}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {parcel.area && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Superficie</span>
                          <span className="font-semibold">{parcel.area.toLocaleString()} m²</span>
                        </div>
                      )}
                      {parcel.isShowroom && (
                        <div className="flex items-center gap-2">
                          <DynamicIcon name="Eye" className="w-4 h-4 text-industria-olive-light" />
                          <span className="text-sm font-medium text-industria-olive-light">Showroom disponible</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
      {showForm && Array.isArray(zone.parcels) && zone.parcels[0] && (
        <AppointmentForm
          parcel={{ id: zone.parcels[0].id, reference: zone.parcels[0].reference }}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
