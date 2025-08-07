"use client"

import React, { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Ruler, Factory, Phone, Eye } from 'lucide-react'

interface IndustrialZone {
  id: string
  name: string
  description: string
  location: string
  area: string
  price: string
  type: string
  status: string
  deliveryDate?: string
  image?: string
}

interface ZoneCardProps {
  zone: IndustrialZone
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Disponible':
    case 'LIBRE':
      return 'bg-green-100 text-green-800'
    case 'Showroom':
    case 'OCCUPE':
      return 'bg-industria-gray-light text-industria-brown-gold'
    case 'Occupé':
      return 'bg-gray-100 text-gray-800'
    case 'Réservé':
    case 'RESERVE':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const ZoneCard = memo(({ zone }: ZoneCardProps) => {
  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <div className="relative">
        {zone.image ? (
          <Image
            src={zone.image}
            alt={zone.name}
            width={300}
            height={200}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            priority={false}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJ5TYyacWe3FaSZbHrOCsecEzrRDmfZE1eFUG8lmFrxdD8qLPZRFbxP69kGw"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors duration-300">
            <Factory className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className={getStatusColor(zone.status)}>{zone.status}</Badge>
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
        <h3 className="font-bold text-lg leading-tight text-gray-900 group-hover:text-industria-brown-gold transition-colors line-clamp-2">
          {zone.name}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">{zone.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
            <span className="truncate">{zone.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Ruler className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
            <span>{zone.area}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Factory className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
            <span className="truncate">{zone.type}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <p className="font-semibold text-gray-900">{zone.price}</p>
        </div>
        
        <div className="flex gap-2 pt-2">
          {zone.id.startsWith('demo-') || zone.id.startsWith('fallback-') ? (
            <Button size="sm" className="flex-1 bg-gray-400 text-white cursor-not-allowed" disabled>
              <Eye className="w-4 h-4 mr-1" /> Démonstration
            </Button>
          ) : (
            <Button asChild size="sm" className="flex-1 bg-industria-brown-gold hover:bg-industria-olive-light text-white">
              <Link href={`/zones/${zone.id}`}>
                <Eye className="w-4 h-4 mr-1" /> Voir
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1 hover:bg-industria-gray-light hover:border-industria-brown-gold">
            <Phone className="w-4 h-4 mr-1" /> Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

ZoneCard.displayName = 'ZoneCard'

export default ZoneCard