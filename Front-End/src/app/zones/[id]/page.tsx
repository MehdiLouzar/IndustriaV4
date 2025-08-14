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
import { Zap, Wifi, Car, Wrench, Factory, Building2, Cpu, Settings, Shield, Droplets, Droplet, Coffee, Truck, Users, Package, Globe, Power, Battery, Monitor, Server, Database, HardDrive, Briefcase, Home, Tool, Gauge, Settings2, Plane, Shirt, Pill } from "lucide-react";
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
  cos?: number | null        // Coefficient d'occupation du sol
  cus?: number | null        // Coefficient d'utilisation du sol
  heightLimit?: number | null // Limite de hauteur en mètres
  setback?: number | null     // Recul en mètres
  price?: number | null       // Prix de la parcelle
}

interface ZoneResponse {
  id: string
  name: string
  description?: string | null
  address?: string | null
  status: string
  totalArea?: number | null
  price?: number | null
  priceType?: string | null
  constructionType?: string | null
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
  priceType?: string | null
  constructionType?: string | null
  region?: { name: string } | null
  zoneType?: { name: string } | null
  activities?: { activity: { name: string; icon?: string } }[]
  amenities?: { name: string; icon?: string }[]
  parcels?: Parcel[]
  vertices?: { seq: number; lambertX: number; lambertY: number; lat?: number; lon?: number }[]
  latitude?: number | null
  longitude?: number | null
}

// Fonction pour obtenir l'icône Lucide React appropriée
function getLucideIcon(iconName?: string) {
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
    'pill': Pill
  }
  
  return iconMap[iconName] || Factory
}

export default function ZonePage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [zone, setZone] = useState<Zone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  useEffect(() => {
    async function load() {
      const z = await fetchPublicApi<ZoneResponse>(`/api/zones/${id}`)
      if (!z) return

      const region = z.regionId ? await fetchPublicApi<{ name: string }>(`/api/regions/${z.regionId}`) : null
      const zoneType = z.zoneTypeId ? await fetchPublicApi<{ name: string }>(`/api/zone-types/${z.zoneTypeId}`) : null

      const [activities, amenities, parcelsRes] = await Promise.all([
        Promise.all((z.activityIds || []).map(aid => fetchPublicApi<{ id: string; name: string; icon?: string }>(`/api/activities/${aid}`))),
        Promise.all((z.amenityIds || []).map(aid => fetchPublicApi<{ id: string; name: string; icon?: string }>(`/api/amenities/${aid}`))),
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
        priceType: z.priceType ?? null,
        constructionType: z.constructionType ?? null,
        region: region ? { name: region.name } : null,
        zoneType: zoneType ? { name: zoneType.name } : null,
        activities: Array.isArray(activities) ? activities.map(a => ({ activity: { name: a?.name || '', icon: a?.icon } })) : [],
        amenities: Array.isArray(amenities) ? amenities.map(a => ({ name: a?.name || '', icon: a?.icon })) : [],
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
                      <div className="font-semibold text-white/80">A partir de</div>
                      <div className="text-lg font-bold">
                        {zone.price.toLocaleString()} {zone.countryCurrency || 'DH'}
                        {zone.priceType === 'PER_SQUARE_METER' && '/m²'}
                        {zone.priceType === 'FIXED_PRICE' && ' (prix fixe)'}
                      </div>
                    </div>
                  )}
                  
                  {zone.constructionType && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="font-semibold text-white/80">Type de construction</div>
                      <div className="text-lg font-bold">
                        {zone.constructionType === 'CUSTOM_BUILD' ? 'Construction sur mesure' :
                         zone.constructionType === 'OWNER_BUILT' ? 'Construction par le propriétaire' :
                         zone.constructionType === 'LAND_LEASE_ONLY' ? 'Location de terrain uniquement' :
                         zone.constructionType === 'TURNKEY' ? 'Clé en main' :
                         zone.constructionType}
                      </div>
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
                      {zone.activities.map((a, i) => {
                        const IconComponent = getLucideIcon(a.activity.icon)
                        return (
                          <span key={i} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            {a.activity.icon && (
                              <IconComponent className="w-4 h-4" />
                            )}
                            {a.activity.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="lg:w-auto flex-shrink-0">
                <Button 
                  onClick={() => {
                    // Sélectionner la première parcelle disponible
                    const availableParcel = zone.parcels?.find(p => 
                      p.status === 'LIBRE' || p.status === 'AVAILABLE'
                    );
                    if (availableParcel) {
                      setSelectedParcel(availableParcel);
                      setShowForm(true);
                    }
                  }}
                  disabled={!zone.parcels?.some(p => p.status === 'LIBRE' || p.status === 'AVAILABLE')}
                  className="bg-white text-industria-brown-gold hover:bg-industria-gray-light transition-colors px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DynamicIcon name="Calendar" className="w-5 h-5 mr-2" />
                  {zone.parcels?.some(p => p.status === 'LIBRE' || p.status === 'AVAILABLE') 
                    ? 'Prendre rendez-vous' 
                    : 'Aucune parcelle disponible'}
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
                {zone.amenities.map((amenity, i) => {
                  const IconComponent = getLucideIcon(amenity.icon)
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-industria-gray-light rounded-lg">
                      {amenity.icon ? (
                        <IconComponent className="w-5 h-5 flex-shrink-0 text-industria-olive-light" />
                      ) : (
                        <div className="w-2 h-2 bg-industria-olive-light rounded-full flex-shrink-0"></div>
                      )}
                      <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="shadow-md" data-map-card>
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
              {/* Statistiques des parcelles */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const stats = zone.parcels.reduce((acc, parcel) => {
                    const status = parcel.status;
                    if (status === 'LIBRE' || status === 'AVAILABLE') acc.available++;
                    else if (status === 'RESERVEE' || status === 'RESERVED') acc.reserved++;
                    else if (status === 'VENDU' || status === 'OCCUPIED') acc.sold++;
                    else acc.other++;
                    
                    if (parcel.area) acc.totalArea += parcel.area;
                    return acc;
                  }, { available: 0, reserved: 0, sold: 0, other: 0, totalArea: 0 });
                  
                  return (
                    <>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-green-700 font-bold text-lg">{stats.available}</div>
                        <div className="text-green-600 text-xs font-medium">Disponibles</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <div className="text-yellow-700 font-bold text-lg">{stats.reserved}</div>
                        <div className="text-yellow-600 text-xs font-medium">Réservées</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="text-red-700 font-bold text-lg">{stats.sold}</div>
                        <div className="text-red-600 text-xs font-medium">Vendues</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-blue-700 font-bold text-lg">{Math.round(stats.totalArea / 10000)} ha</div>
                        <div className="text-blue-600 text-xs font-medium">Surface totale</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zone.parcels.map((parcel, i) => (
                  <div key={parcel.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
                    {/* En-tête avec dégradé */}
                    <div className="bg-gradient-to-r from-industria-gray-light to-industria-brown-gold/10 p-4 border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-industria-brown-gold text-xl">{parcel.reference}</h3>
                          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mt-2 shadow-sm ${
                            parcel.status === 'LIBRE' ? 'bg-green-100 text-green-700 border border-green-200' :
                            parcel.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 border border-green-200' :
                            parcel.status === 'RESERVEE' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            parcel.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            parcel.status === 'VENDU' ? 'bg-red-100 text-red-700 border border-red-200' :
                            parcel.status === 'OCCUPIED' ? 'bg-red-100 text-red-700 border border-red-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {parcel.status === 'LIBRE' || parcel.status === 'AVAILABLE' ? 'Disponible' :
                             parcel.status === 'RESERVEE' || parcel.status === 'RESERVED' ? 'Réservée' :
                             parcel.status === 'VENDU' || parcel.status === 'OCCUPIED' ? 'Vendue' :
                             parcel.status}
                          </div>
                        </div>
                        {parcel.isShowroom && (
                          <div className="bg-industria-olive-light/20 p-2 rounded-full">
                            <DynamicIcon name="Eye" className="w-5 h-5 text-industria-olive-light" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenu principal */}
                    <div className="p-6 space-y-4">
                      {/* Informations principales */}
                      <div className="space-y-3">
                        {parcel.area && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DynamicIcon name="Square" className="w-4 h-4 text-industria-brown-gold" />
                              <span className="text-sm font-medium text-gray-700">Superficie</span>
                            </div>
                            <span className="font-bold text-industria-brown-gold text-lg">{parcel.area.toLocaleString()} m²</span>
                          </div>
                        )}

                        {/* Coordonnées GPS si disponibles */}
                        {parcel.latitude != null && parcel.longitude != null && (
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DynamicIcon name="MapPin" className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Coordonnées</span>
                            </div>
                            <span className="font-mono text-xs text-blue-600">
                              {parcel.latitude.toFixed(4)}, {parcel.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}

                        {/* Contraintes techniques si disponibles */}
                        {(parcel.cos || parcel.cus || parcel.heightLimit || parcel.setback) && (
                          <div className="grid grid-cols-2 gap-2">
                            {parcel.cos && (
                              <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
                                <div className="text-xs text-orange-600 font-medium">COS</div>
                                <div className="font-bold text-orange-800">{parcel.cos}</div>
                              </div>
                            )}
                            {parcel.cus && (
                              <div className="text-center p-2 bg-purple-50 rounded border border-purple-200">
                                <div className="text-xs text-purple-600 font-medium">CUS</div>
                                <div className="font-bold text-purple-800">{parcel.cus}</div>
                              </div>
                            )}
                            {parcel.heightLimit && (
                              <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                                <div className="text-xs text-red-600 font-medium">Hauteur max</div>
                                <div className="font-bold text-red-800">{parcel.heightLimit}m</div>
                              </div>
                            )}
                            {parcel.setback && (
                              <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
                                <div className="text-xs text-yellow-600 font-medium">Recul</div>
                                <div className="font-bold text-yellow-800">{parcel.setback}m</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Badges d'information */}
                        <div className="flex flex-wrap gap-2">
                          {parcel.isShowroom && (
                            <div className="flex items-center gap-1 bg-industria-olive-light/10 px-3 py-1 rounded-full border border-industria-olive-light/20">
                              <DynamicIcon name="Building" className="w-3 h-3 text-industria-olive-light" />
                              <span className="text-xs font-medium text-industria-olive-light">Showroom</span>
                            </div>
                          )}
                          
                          {(parcel.status === 'LIBRE' || parcel.status === 'AVAILABLE') && (
                            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                              <DynamicIcon name="CheckCircle" className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium text-green-600">Immédiatement disponible</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-gray-100">
                        {(parcel.status === 'LIBRE' || parcel.status === 'AVAILABLE') ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setSelectedParcel(parcel);
                                setShowForm(true);
                              }}
                              className="flex-1 bg-gradient-to-r from-industria-brown-gold to-industria-olive-light hover:from-industria-olive-light hover:to-industria-brown-gold text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              <DynamicIcon name="Calendar" className="w-4 h-4 mr-2" />
                              Réserver un RDV
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Scroll vers la carte et centrer sur cette parcelle
                                const mapCard = document.querySelector('[data-map-card]');
                                if (mapCard) {
                                  mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="px-4 py-3 border-industria-brown-gold text-industria-brown-gold hover:bg-industria-brown-gold hover:text-white transition-colors"
                            >
                              <DynamicIcon name="Map" className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500 font-medium">
                              {parcel.status === 'RESERVEE' || parcel.status === 'RESERVED' ? 'Parcelle déjà réservée' :
                               parcel.status === 'VENDU' || parcel.status === 'OCCUPIED' ? 'Parcelle déjà vendue' :
                               'Non disponible'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
      {showForm && selectedParcel && (
        <AppointmentForm
          parcel={{ 
            id: selectedParcel.id, 
            reference: selectedParcel.reference,
            area: selectedParcel.area 
          }}
          onClose={() => {
            setShowForm(false);
            setSelectedParcel(null);
          }}
        />
      )}
    </>
  );
}
