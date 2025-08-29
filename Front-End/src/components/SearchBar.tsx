/**
 * Composant SearchBar - Barre de recherche avancée pour zones industrielles
 * 
 * Fournit une interface de recherche multi-critères permettant aux utilisateurs
 * de filtrer les zones industrielles selon :
 * - Région géographique (Casablanca, Rabat, etc.)
 * - Type de zone industrielle
 * - Statut de disponibilité (AVAILABLE, RESERVED, OCCUPIED, SHOWROOM)
 * - Plages de prix (DH/m²)
 * - Plages de superficie (m²)
 * 
 * Intègre la navigation automatique avec mise à jour des paramètres URL
 * et callback pour la communication avec les composants parents.
 * 
 * @param onSearch Callback optionnel appelé lors de l'exécution d'une recherche
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

'use client';

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, MapPin, Factory, Shield, DollarSign, Ruler } from 'lucide-react'
import { fetchPublicApi } from '@/lib/utils'
import type { ListResponse } from '@/types'

/**
 * Interface des filtres de recherche
 */
interface Filters {
  /** ID de la région sélectionnée */
  regionId: string
  /** ID du type de zone sélectionné */
  zoneTypeId: string
  /** Statut de disponibilité */
  status: string
  /** Index de la plage de superficie sélectionnée */
  area: string
  /** Index de la plage de prix sélectionnée */
  price: string
}
export default function SearchBar({ onSearch }: { onSearch?: (f: Filters) => void }) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>({
    regionId: '',
    zoneTypeId: '',
    status: '',
    area: '',
    price: '',
  })

  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [zoneTypes, setZoneTypes] = useState<{ id: string; name: string }[]>([])
  const statuses = useMemo(() => ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'SHOWROOM'], [])
  const priceRanges = useMemo(
    () => [
      { label: 'Tout prix', min: undefined, max: undefined },
      { label: 'Moins de 500 DH/m²', min: undefined, max: 500 },
      { label: '500 - 1000 DH/m²', min: 500, max: 1000 },
      { label: '1000 - 3000 DH/m²', min: 1000, max: 3000 },
      { label: 'Plus de 3000 DH/m²', min: 3000, max: undefined },
    ],
    []
  )
  const areaRanges = useMemo(
    () => [
      { label: 'Toute superficie', min: undefined, max: undefined },
      { label: 'Moins de 10 000 m²', min: undefined, max: 10000 },
      { label: '10 000 - 50 000 m²', min: 10000, max: 50000 },
      { label: '50 000 - 100 000 m²', min: 50000, max: 100000 },
      { label: 'Plus de 100 000 m²', min: 100000, max: undefined },
    ],
    []
  )

  useEffect(() => {
    async function load() {
      const [r, t] = await Promise.all([
        fetchPublicApi<ListResponse<{ id: string; name: string }>>('/api/regions'),
        fetchPublicApi<ListResponse<{ id: string; name: string }>>('/api/zone-types'),
      ])
      if (r) {
        const arr = Array.isArray(r.items) ? r.items : []
        if (!Array.isArray(r.items) && !Array.isArray(r)) {
          console.warn('⚠️ Format de données inattendu:', r)
        }
        setRegions(arr)
      } else {
        setRegions([])
      }
      if (t) {
        const arr = Array.isArray(t.items) ? t.items : []
        if (!Array.isArray(t.items) && !Array.isArray(t)) {
          console.warn('⚠️ Format de données inattendu:', t)
        }
        setZoneTypes(arr)
      } else {
        setZoneTypes([])
      }
    }
    load()
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (filters.regionId) params.set('regionId', filters.regionId)
    if (filters.zoneTypeId) params.set('zoneTypeId', filters.zoneTypeId)
    if (filters.status) params.set('status', filters.status)

    if (filters.area) {
      const r = areaRanges[parseInt(filters.area, 10)]
      if (r?.min !== undefined) params.set('minArea', String(r.min))
      if (r?.max !== undefined) params.set('maxArea', String(r.max))
    }

    if (filters.price) {
      const r = priceRanges[parseInt(filters.price, 10)]
      if (r?.min !== undefined) params.set('minPrice', String(r.min))
      if (r?.max !== undefined) params.set('maxPrice', String(r.max))
    }

    onSearch?.(filters)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="w-full bg-white shadow-lg rounded-lg p-4 mb-4 border border-gray-100">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-industria-brown-gold to-industria-olive-light rounded-full flex items-center justify-center shadow-md">
            <Search className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recherche de zones</h2>
          </div>
        </div>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">Filtrez selon vos critères</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-industria-brown-gold" /> Région
          </label>
          <Select value={filters.regionId} onValueChange={(v) => setFilters({ ...filters, regionId: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Région" /></SelectTrigger>
            <SelectContent>
              {(Array.isArray(regions) ? regions : []).map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-sm py-2">{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Factory className="w-4 h-4 text-industria-brown-gold" /> Type
          </label>
          <Select value={filters.zoneTypeId} onValueChange={(v) => setFilters({ ...filters, zoneTypeId: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              {(Array.isArray(zoneTypes) ? zoneTypes : []).map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-sm py-2">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Shield className="w-4 h-4 text-industria-brown-gold" /> Statut
          </label>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s} className="text-sm py-2">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-industria-brown-gold" /> Prix
          </label>
          <Select value={filters.price} onValueChange={(v) => setFilters({ ...filters, price: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Prix" />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((r, i) => (
                <SelectItem key={i.toString()} value={i.toString()} className="text-sm py-2">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Ruler className="w-4 h-4 text-industria-brown-gold" />
            Superficie
          </label>
          <Select value={filters.area} onValueChange={(v) => setFilters({ ...filters, area: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Superficie" />
            </SelectTrigger>
            <SelectContent>
              {areaRanges.map((r, i) => (
                <SelectItem key={i.toString()} value={i.toString()} className="text-sm py-2">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-center pt-3">
        <Button 
          onClick={handleSearch} 
          className="bg-gradient-to-r from-industria-brown-gold to-industria-olive-light hover:from-industria-olive-light hover:to-industria-brown-gold text-white px-6 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Search className="w-4 h-4 mr-2" /> Rechercher
        </Button>
      </div>
    </div>
  )
}
