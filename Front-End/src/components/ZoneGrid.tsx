"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Ruler, Factory, Phone, Eye } from 'lucide-react'
import { fetchApi } from '@/lib/utils'

const CARD_WIDTH = 300
const CARD_HEIGHT = 360
const ZONES_PER_PAGE = 20

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

function getStatusColor(status: string) {
  switch (status) {
    case 'Disponible':
      return 'bg-green-100 text-green-800'
    case 'Showroom':
      return 'bg-blue-100 text-blue-800'
    case 'Occupé':
      return 'bg-gray-100 text-gray-800'
    case 'Réservé':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function ZoneGrid() {
  const [zones, setZones] = useState<IndustrialZone[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)

  const loadZones = async (page: number) => {
    setLoading(true)
    try {
      const response = await fetchApi<{ zones: IndustrialZone[]; totalPages: number }>(
        `/api/zones?page=${page}&limit=${ZONES_PER_PAGE}`
      )
      if (response) {
        setZones(response.zones || (response as unknown as IndustrialZone[]))
        setTotalPages(response.totalPages || 1)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadZones(currentPage)
  }, [currentPage])

  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.offsetWidth || window.innerWidth
      setWidth(w)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const columnCount = Math.max(1, Math.floor((width - 64) / CARD_WIDTH))
  const rowCount = Math.ceil(zones.length / columnCount)

  const itemData = useMemo(() => ({ zones, columnCount }), [zones, columnCount])

  const Cell = ({ columnIndex, rowIndex, style, data }: GridChildComponentProps) => {
    const { zones, columnCount } = data as { zones: IndustrialZone[]; columnCount: number }
    const index = rowIndex * columnCount + columnIndex
    const zone = zones[index]
    if (!zone) return <div style={style} />
    return (
      <div style={{ ...style, padding: 8 }}>
        <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="relative">
            {zone.image ? (
              <Image
                src={zone.image}
                alt={zone.name}
                width={400}
                height={192}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200" />
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
            <h3 className="font-bold text-lg leading-tight text-gray-900 hover:text-red-600 transition-colors">
              {zone.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">{zone.description}</p>
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
                <Link href={`/zones/${zone.id}`}>
                  <Eye className="w-4 h-4 mr-1" /> Voir
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Phone className="w-4 h-4 mr-1" /> Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{zones.length} zones industrielles</h2>
      </div>

      <div ref={containerRef} style={{ height: 800, width: '100%' }}>
        <Grid
          columnCount={columnCount}
          columnWidth={CARD_WIDTH}
          height={800}
          rowCount={rowCount}
          rowHeight={CARD_HEIGHT}
          width={width}
          itemData={itemData}
        >
          {Cell}
        </Grid>
      </div>

      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="px-4 py-2">
          Page {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
