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
import { Search, MapPin, Factory } from 'lucide-react'
import { fetchApi } from '@/lib/utils'
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
        fetchApi<ListResponse<{ id: string; name: string }>>('/api/regions'),
        fetchApi<ListResponse<{ id: string; name: string }>>('/api/zone-types'),
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
    <div className="w-full bg-white shadow-lg rounded-lg p-6 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trouvez votre zone industrielle</h2>
        <p className="text-gray-600">Recherchez parmi nos zones industrielles disponibles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-industria-brown-gold" /> Région
          </label>
          <Select value={filters.regionId} onValueChange={(v) => setFilters({ ...filters, regionId: v })}>
            <SelectTrigger><SelectValue placeholder="Choisissez" /></SelectTrigger>
            <SelectContent>
              {(Array.isArray(regions) ? regions : []).map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Factory className="w-4 h-4 text-industria-brown-gold" /> Type
          </label>
          <Select value={filters.zoneTypeId} onValueChange={(v) => setFilters({ ...filters, zoneTypeId: v })}>
            <SelectTrigger><SelectValue placeholder="Choisissez" /></SelectTrigger>
            <SelectContent>
              {(Array.isArray(zoneTypes) ? zoneTypes : []).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Statut</label>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger><SelectValue placeholder="Choisissez" /></SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Prix</label>
          <Select value={filters.price} onValueChange={(v) => setFilters({ ...filters, price: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Tout" />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((r, i) => (
                <SelectItem key={i.toString()} value={i.toString()}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Superficie</label>
          <Select value={filters.area} onValueChange={(v) => setFilters({ ...filters, area: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Toute" />
            </SelectTrigger>
            <SelectContent>
              {areaRanges.map((r, i) => (
                <SelectItem key={i.toString()} value={i.toString()}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleSearch} className="search-blue text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity">
          <Search className="w-5 h-5 mr-2" /> Rechercher
        </Button>
      </div>
    </div>
  )
}
