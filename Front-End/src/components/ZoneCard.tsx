"use client"

import React, { memo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Ruler, Factory, Phone, Eye, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react'

interface ZoneImage {
  id: string
  filename: string
  originalFilename: string
  description?: string
  isPrimary: boolean
  displayOrder: number
}

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
  images?: ZoneImage[]
  totalParcels?: number
  availableParcels?: number
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Utiliser les images du carousel si disponibles, sinon fallback sur l'image unique
  const displayImages = zone.images && zone.images.length > 0 ? zone.images : null
  const hasImages = displayImages && displayImages.length > 0
  const hasMultipleImages = displayImages && displayImages.length > 1
  
  const nextImage = () => {
    if (displayImages) {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
    }
  }
  
  const prevImage = () => {
    if (displayImages) {
      setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
    }
  }

  const getCurrentImageUrl = () => {
    if (hasImages) {
      const currentImage = displayImages[currentImageIndex]
      return `/api/zones/${zone.id}/images/${currentImage.id}/file`
    }
    return zone.image
  }

  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <div className="relative">
        {hasImages || zone.image ? (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={getCurrentImageUrl() || ''}
              alt={zone.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Navigation du carousel */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Indicateurs de position */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Aller à l'image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
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
        {hasMultipleImages && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-black/60 text-white text-xs">
              {displayImages.length} photos
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
          {(zone.totalParcels !== undefined && zone.availableParcels !== undefined) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Grid3X3 className="w-4 h-4 text-industria-brown-gold flex-shrink-0" />
              <span>
                {zone.availableParcels} / {zone.totalParcels} parcelles disponibles
              </span>
            </div>
          )}
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
          <Button asChild variant="outline" size="sm" className="flex-1 hover:bg-industria-gray-light hover:border-industria-brown-gold">
            <Link href={`/contact?zone=${zone.id}`}>
              <Phone className="w-4 h-4 mr-1" /> Contact
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

ZoneCard.displayName = 'ZoneCard'

export default ZoneCard