"use client"

/**
 * Composant ZoneCard - Carte d'affichage d'une zone industrielle
 */

import React, { memo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Ruler, Factory, Phone, Eye, ChevronLeft, ChevronRight, Grid3X3,
  Zap, Wifi, Car, Wrench, Building2, Cpu, Settings, Shield, Droplets, Droplet, Coffee, 
  Truck, Users, Package, Globe, Power, Battery, Monitor, Server, Database, 
  HardDrive, Briefcase, Home, Tool, Gauge, Settings2, Plane, Shirt, Pill
} from 'lucide-react'

/**
 * Interface représentant une image de zone industrielle
 */
interface ZoneImage {
  /** Identifiant unique de l'image */
  id: string
  /** Nom du fichier stocké */
  filename: string
  /** Nom original du fichier uploadé */
  originalFilename: string
  /** Description optionnelle de l'image */
  description?: string
  /** Indique si c'est l'image principale */
  isPrimary: boolean
  /** Ordre d'affichage dans le carrousel */
  displayOrder: number
}

/**
 * Interface représentant une activité industrielle
 */
interface Activity {
  /** Identifiant unique de l'activité */
  id: string
  /** Nom de l'activité */
  name: string
  /** Description de l'activité */
  description: string
  /** Icône de l'activité */
  icon?: string
  /** Catégorie de l'activité */
  category?: string
}

/**
 * Interface représentant un équipement/service
 */
interface Amenity {
  /** Identifiant unique de l'équipement */
  id: string
  /** Nom de l'équipement */
  name: string
  /** Description de l'équipement */
  description: string
  /** Icône de l'équipement */
  icon?: string
  /** Catégorie de l'équipement */
  category?: string
}

/**
 * Interface représentant une zone industrielle
 */
interface IndustrialZone {
  /** Identifiant unique de la zone */
  id: string
  /** Nom de la zone */
  name: string
  /** Description détaillée */
  description: string
  /** Localisation géographique */
  location: string
  /** Superficie formatée avec unité */
  area: string
  /** Prix formaté avec devise */
  price: string
  /** Type de zone (parc industriel, zone franche, etc.) */
  type: string
  /** Statut actuel (LIBRE, OCCUPE, RESERVE, etc.) */
  status: string
  /** Date de livraison prévue */
  deliveryDate?: string
  /** URL de l'image principale (legacy) */
  image?: string
  /** Collection d'images pour carrousel */
  images?: ZoneImage[]
  /** Nombre total de parcelles */
  totalParcels?: number
  /** Nombre de parcelles disponibles */
  availableParcels?: number
  /** Activités autorisées dans la zone */
  activities?: Activity[]
  /** Équipements disponibles dans la zone */
  amenities?: Amenity[]
}

/**
 * Props du composant ZoneCard
 */
interface ZoneCardProps {
  /** Données de la zone industrielle à afficher */
  zone: IndustrialZone
}

/**
 * Détermine les classes CSS de couleur pour un badge de statut
 * @param status - Statut de la zone (LIBRE, OCCUPE, RESERVE, etc.)
 * @returns Classes Tailwind CSS pour le badge
 */
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

/**
 * Obtient l'icône Lucide React appropriée
 */
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
    'pill': Pill,
    
    // Icônes génériques
    'MapPin': MapPin,
    'Ruler': Ruler,
    'Phone': Phone,
    'Eye': Eye,
    'Grid3X3': Grid3X3,
    'ChevronLeft': ChevronLeft,
    'ChevronRight': ChevronRight
  }
  
  return iconMap[iconName] || Factory
}

/**
 * Composant carte de zone industrielle avec carrousel d'images
 * 
 * Affiche une zone industrielle sous forme de carte avec :
 * - Carrousel d'images interactif
 * - Informations clés (superficie, prix, parcelles)
 * - Badge de statut coloré
 * - Actions (voir détails, demander rendez-vous)
 * 
 * @param props - Props du composant
 * @returns Élément React de la carte zone
 */
const ZoneCard = memo(({ zone }: ZoneCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Utiliser les images du carousel si disponibles, sinon fallback sur l'image unique
  const displayImages = zone.images && Array.isArray(zone.images) && zone.images.length > 0 ? zone.images : null
  const hasImages = Boolean(displayImages && displayImages.length > 0)
  const hasMultipleImages = Boolean(displayImages && displayImages.length > 1)
  
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
      return `${process.env.NEXT_PUBLIC_API_URL}/api/zones/${zone.id}/images/${currentImage.id}/file`
    }
    return zone.image
  }

  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <div className="relative">
        {hasImages || zone.image ? (
          <div className="relative w-full h-32 overflow-hidden">
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
          <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors duration-300">
            <Factory className="w-8 h-8 text-gray-400" />
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
      
      <CardHeader className="pb-2">
        <h3 className="font-bold text-base leading-tight text-gray-900 group-hover:text-industria-brown-gold transition-colors line-clamp-1">
          {zone.name}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-1">{zone.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-industria-brown-gold flex-shrink-0" />
            <span className="truncate">{zone.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Ruler className="w-3 h-3 text-industria-brown-gold flex-shrink-0" />
            <span>{zone.area}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Factory className="w-3 h-3 text-industria-brown-gold flex-shrink-0" />
            <span className="truncate">{zone.type}</span>
          </div>
          {(zone.totalParcels !== undefined && zone.availableParcels !== undefined) && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Grid3X3 className="w-3 h-3 text-industria-brown-gold flex-shrink-0" />
              <span>
                {zone.availableParcels} / {zone.totalParcels} parcelles
              </span>
            </div>
          )}
        </div>
        
        {/* Section Activités et Équipements */}
        {((zone.activities && zone.activities.length > 0) || (zone.amenities && zone.amenities.length > 0)) && (
          <div className="space-y-2">
            {/* Activités autorisées */}
            {zone.activities && zone.activities.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Activités
                </h4>
                <div className="flex flex-wrap gap-1">
                  {zone.activities.slice(0, 3).map((activity) => {
                    const IconComponent = getLucideIcon(activity.icon)
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded-full border border-blue-200"
                        title={activity.description || activity.name}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span className="truncate max-w-12 text-xs">{activity.name}</span>
                      </div>
                    )
                  })}
                  {zone.activities.length > 3 && (
                    <div className="flex items-center bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                      +{zone.activities.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Équipements disponibles */}
            {zone.amenities && zone.amenities.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Équipements
                </h4>
                <div className="flex flex-wrap gap-1">
                  {zone.amenities.slice(0, 3).map((amenity) => {
                    const IconComponent = getLucideIcon(amenity.icon)
                    return (
                      <div
                        key={amenity.id}
                        className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-1.5 py-0.5 rounded-full border border-green-200"
                        title={amenity.description || amenity.name}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span className="truncate max-w-12 text-xs">{amenity.name}</span>
                      </div>
                    )
                  })}
                  {zone.amenities.length > 3 && (
                    <div className="flex items-center bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                      +{zone.amenities.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="pt-1 border-t">
          <p className="font-semibold text-sm text-gray-900">{zone.price}</p>
        </div>
        
        <div className="flex gap-2 pt-1">
          {zone.id.startsWith('demo-') || zone.id.startsWith('fallback-') ? (
            <Button size="sm" className="flex-1 bg-gray-400 text-white cursor-not-allowed text-xs" disabled>
              <Eye className="w-3 h-3 mr-1" /> Démo
            </Button>
          ) : (
            <Button asChild size="sm" className="flex-1 bg-industria-brown-gold hover:bg-industria-olive-light text-white text-xs">
              <Link href={`/zones/${zone.id}`}>
                <Eye className="w-3 h-3 mr-1" /> Voir
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="flex-1 hover:bg-industria-gray-light hover:border-industria-brown-gold text-xs">
            <Link href={`/contact?zone=${zone.id}`}>
              <Phone className="w-3 h-3 mr-1" /> Contact
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

ZoneCard.displayName = 'ZoneCard'

export default ZoneCard