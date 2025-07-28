'use client';

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Ruler, Factory, Phone, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface IndustrialZone {
  id: string;
  name: string;
  description: string;
  location: string;
  area: string;
  price: string;
  type: string;
  status: 'Disponible' | 'Réservé' | 'En cours' | 'Nouveau';
  deliveryDate?: string;
  image: string;
  features: string[];
}

export default function ZoneGrid() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [zones, setZones] = useState<IndustrialZone[]>([])
  const searchParams = useSearchParams()

  interface ZoneResponse {
    id: string;
    name: string;
    description?: string;
    totalArea?: number;
    price?: number;
    status: string;
    region?: { name: string };
    amenities?: { amenity: { name: string } }[];
  }

  const mapStatus = (status: string): IndustrialZone['status'] => {
    switch (status) {
      case 'RESERVED':
        return 'Réservé';
      case 'OCCUPIED':
        return 'Occupé';
      case 'SHOWROOM':
        return 'Showroom';
      default:
        return 'Disponible';
    }
  };

  useEffect(() => {
    async function load() {
      const qs = new URLSearchParams()
      searchParams.forEach((v, k) => {
        qs.set(k, v)
      })
      const data = await fetchApi<ZoneResponse[]>(`/api/zones?${qs.toString()}`)
      if (!data) return
      const mapped: IndustrialZone[] = data.map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description ?? '',
        location: z.region?.name ?? '',
        area: z.totalArea ? `${z.totalArea} m²` : '',
        price: z.price ? `${z.price} DH/m²` : '',
        type: 'Zone Industrielle',
        status: mapStatus(z.status),
        image: 'https://source.unsplash.com/featured/?industrial',
        features: z.amenities?.map((a) => a.amenity.name) ?? [],
      }));
      setZones(mapped)
    }
    load()
  }, [searchParams])

  const totalPages = Math.ceil(zones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedZones = zones.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible':
        return 'bg-green-100 text-green-800';
      case 'Showroom':
        return 'bg-blue-100 text-blue-800';
      case 'Occupé':
        return 'bg-gray-100 text-gray-800';
      case 'Réservé':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {zones.length} zones industrielles disponibles
        </h2>
        <p className="text-gray-600">
          Il y a {zones.length} zones qui correspondent à votre recherche
        </p>
      </div>

      {/* Zone grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedZones.map((zone) => (
          <Card key={zone.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <img
                src={zone.image}
                alt={zone.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge className={getStatusColor(zone.status)}>
                  {zone.status}
                </Badge>
              </div>
              {zone.deliveryDate && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-white/90 text-gray-700">
                    Livraison {zone.deliveryDate}
                  </Badge>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <h3 className="font-bold text-lg leading-tight text-gray-900 hover:text-red-600 transition-colors">
                {zone.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {zone.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{zone.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Ruler className="w-4 h-4 text-red-600" />
                  <span>{zone.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Factory className="w-4 h-4 text-red-600" />
                  <span>{zone.type}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="font-semibold text-gray-900">{zone.price}</p>
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1 header-red text-white hover:opacity-90">
                  <Link href={`/zones/${zone.id}`}> <Eye className="w-4 h-4 mr-1" /> Voir </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="w-4 h-4 mr-1" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Page précédente
          </Button>

          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={page === currentPage ? "header-red text-white" : ""}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Page suivante
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
