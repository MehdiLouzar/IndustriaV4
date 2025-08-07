'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fetchApi } from '@/lib/utils'
import type { ListResponse } from '@/types'
import Pagination from '@/components/Pagination'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ZONE_STATUSES, PRICE_TYPES, CONSTRUCTION_TYPES, getEnumLabel, getEnumBadge } from '@/lib/translations'
import { 
  formatWGS84,
  createGoogleMapsLink,
  type WGS84Coordinate 
} from '@/lib/coordinates'

interface Vertex {
  seq: number
  lambertX: number
  lambertY: number
}

interface Zone {
  id: string
  name: string
  description?: string | null
  address?: string | null
  totalArea?: number | null
  price?: number | null
  priceType?: 'FIXED_PRICE' | 'PER_SQUARE_METER' | null
  constructionType?: 'CUSTOM_BUILD' | 'OWNER_BUILT' | 'LAND_LEASE_ONLY' | 'TURNKEY' | null
  status: string
  zoneTypeId?: string | null
  regionId?: string | null
  activityIds?: string[]  // IDs des activités depuis le backend
  amenityIds?: string[]   // IDs des amenities depuis le backend
  vertices?: Vertex[]
  longitude?: number | null  // Coordonnées calculées côté backend
  latitude?: number | null   // Coordonnées calculées côté backend
  createdAt?: string
  updatedAt?: string
}

interface ActivityDto {
  id: string
  name: string
}

interface ZoneForm {
  id: string
  name: string
  description: string
  address: string
  totalArea: string
  price: string
  priceType: string
  constructionType: string
  status: string
  zoneTypeId: string
  regionId: string
  activityIds: string[]
  amenityIds: string[]
  vertices: { lambertX: string; lambertY: string }[]
}

// Composant mémorisé pour les lignes de la table des zones
const ZoneTableRow = memo(({ 
  zone, 
  getZoneCoordinates, 
  onEdit, 
  onDelete 
}: { 
  zone: Zone, 
  getZoneCoordinates: (zone: Zone) => any,
  onEdit: (zone: Zone) => void,
  onDelete: (id: string) => void
}) => {
  const coordinates = useMemo(() => getZoneCoordinates(zone), [zone, getZoneCoordinates])
  
  return (
    <tr key={zone.id} className="border-b last:border-0">
      <td className="p-2 align-top">{zone.name}</td>
      <td className="p-2 align-top">
        <Badge className={getEnumBadge(ZONE_STATUSES, zone.status).color}>
          {getEnumBadge(ZONE_STATUSES, zone.status).label}
        </Badge>
      </td>
      <td className="p-2 align-top">{zone.regionId}</td>
      <td className="p-2 align-top">
        <div className="text-xs">
          {coordinates.wgs84 ? (
            <div className="space-y-1">
              <div className="font-mono">
                {coordinates.display}
              </div>
              <a
                href={createGoogleMapsLink(coordinates.wgs84)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                Voir sur Google Maps
              </a>
            </div>
          ) : (
            <span className="text-gray-500">{coordinates.display}</span>
          )}
        </div>
      </td>
      <td className="p-2 space-x-2 whitespace-nowrap">
        <Button size="sm" onClick={() => onEdit(zone)}>Éditer</Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(zone.id)}>
          Supprimer
        </Button>
      </td>
    </tr>
  )
})

ZoneTableRow.displayName = 'ZoneTableRow'

// Les constantes sont maintenant importées de translations.ts

export default function ZonesAdmin() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [allZones, setAllZones] = useState<Zone[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [allZoneTypes, setAllZoneTypes] = useState<{ id: string; name: string }[]>([])
  const [allRegions, setAllRegions] = useState<{ id: string; name: string }[]>([])
  const [activities, setActivities] = useState<ActivityDto[]>([])
  const [allAmenities, setAllAmenities] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<ZoneForm>({
    id: '',
    name: '',
    description: '',
    address: '',
    totalArea: '',
    price: '',
    priceType: 'FIXED_PRICE',
    constructionType: 'CUSTOM_BUILD',
    status: 'LIBRE',
    zoneTypeId: '',
    regionId: '',
    activityIds: [],
    amenityIds: [],
    vertices: [],
  })
  const [images, setImages] = useState<{ file: File; url: string }[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState('')

  // Fonction pour récupérer les coordonnées pré-calculées d'une zone
  const getZoneCoordinates = useCallback((zone: Zone) => {
    if (!zone.longitude || !zone.latitude) {
      return {
        display: 'Aucune coordonnée',
        wgs84: null,
        lambert: null
      }
    }

    const wgs84 = {
      longitude: zone.longitude,
      latitude: zone.latitude
    }

    return {
      display: formatWGS84(wgs84),
      wgs84: wgs84,
      lambert: null // Plus besoin des coordonnées Lambert
    }
  }, [])

  const loadZones = useCallback(async (page = currentPage) => {
    const response = await fetchApi<ListResponse<Zone>>(
      `/api/zones?page=${page}&limit=${itemsPerPage}`
    ).catch(() => null)
    let zonesData: Zone[] = []
    if (response && Array.isArray(response.items)) {
      zonesData = response.items
    } else if (Array.isArray(response)) {
      zonesData = response as unknown as Zone[]
    } else if (response) {
      console.warn('⚠️ Format de données inattendu:', response)
    }
    setZones(zonesData)
    setTotalPages(response?.totalPages ?? 1)
    setCurrentPage(response?.page ?? 1)
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
    loadZones(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, router])

  useEffect(() => {
    fetchApi<ListResponse<Zone>>('/api/zones/all')
      .then((response) => {
        let arr: Zone[] = []
        if (response && Array.isArray(response.items)) {
          arr = response.items
        } else if (Array.isArray(response)) {
          arr = response as unknown as Zone[]
        } else if (response) {
          console.warn('⚠️ Format de données inattendu:', response)
        }
        setAllZones(arr)
      })
      .catch(() => setAllZones([]))
  }, [])

  useEffect(() => {
    fetchApi<{ id: string; name: string }[]>('/api/zone-types/all')
      .then((data) => {
        setAllZoneTypes(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        console.error('Erreur chargement zone types:', error)
        setAllZoneTypes([])
      })
  }, [])

  useEffect(() => {
    fetchApi<{ id: string; name: string }[]>('/api/regions/all')
      .then((data) => {
        setAllRegions(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        console.error('Erreur chargement regions:', error)
        setAllRegions([])
      })
  }, [])

  useEffect(() => {
    fetchApi<ListResponse<ActivityDto>>("/api/activities")
      .then((response) => {
        let arr: ActivityDto[] = []
        if (response && Array.isArray(response.items)) {
          arr = response.items
        } else if (Array.isArray(response)) {
          arr = response as unknown as ActivityDto[]
        } else if (response) {
          console.warn('⚠️ Format de données inattendu:', response)
        }
        setActivities(arr)
      })
      .catch(() => setActivities([]))
  }, [])

  useEffect(() => {
    fetchApi<ListResponse<{ id: string; name: string }>>("/api/amenities/all")
      .then((response) => {
        let arr: { id: string; name: string }[] = []
        if (response && Array.isArray(response.items)) {
          arr = response.items
        } else if (Array.isArray(response)) {
          arr = response as unknown as { id: string; name: string }[]
        } else if (response) {
          console.warn('⚠️ Format de données inattendu:', response)
        }
        setAllAmenities(arr)
      })
      .catch(() => setAllAmenities([]))
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleStatus = useCallback((value: string) => {
    setForm(prev => ({ ...prev, status: value }))
  }, [])

  const handleZoneType = useCallback((value: string) => {
    setForm(prev => ({ ...prev, zoneTypeId: value }))
  }, [])

  const handleRegion = useCallback((value: string) => {
    setForm(prev => ({ ...prev, regionId: value }))
  }, [])

  const handlePriceType = useCallback((value: string) => {
    setForm(prev => ({ ...prev, priceType: value }))
  }, [])

  const handleConstructionType = useCallback((value: string) => {
    setForm(prev => ({ ...prev, constructionType: value }))
  }, [])

  const toggleActivity = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      activityIds: f.activityIds.includes(id)
        ? f.activityIds.filter((a) => a !== id)
        : [...f.activityIds, id],
    }))
  }, [])

  const toggleAmenity = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      amenityIds: f.amenityIds.includes(id)
        ? f.amenityIds.filter((a) => a !== id)
        : [...f.amenityIds, id],
    }))
  }, [])

  const addVertex = useCallback(() => {
    setForm((f) => ({
      ...f,
      vertices: [...f.vertices, { lambertX: '', lambertY: '' }],
    }))
  }, [])

  const updateVertex = useCallback((
    index: number,
    field: 'lambertX' | 'lambertY',
    value: string
  ) => {
    setForm((f) => {
      const verts = [...f.vertices]
      verts[index] = { ...verts[index], [field]: value }
      return { ...f, vertices: verts }
    })
  }, [])

  const removeVertex = useCallback((index: number) => {
    setForm((f) => {
      const verts = [...f.vertices]
      verts.splice(index, 1)
      return { ...f, vertices: verts }
    })
  }, [])

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setImages((imgs) => [...imgs, ...files])
    e.target.value = ''
  }, [])

  const removeImage = useCallback((idx: number) => {
    setImages((imgs) => {
      const copy = [...imgs]
      URL.revokeObjectURL(copy[idx].url)
      copy.splice(idx, 1)
      return copy
    })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      name: form.name,
      description: form.description || undefined,
      address: form.address || undefined,
      totalArea: form.totalArea ? parseFloat(form.totalArea) : undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      priceType: form.priceType || undefined,
      constructionType: form.constructionType || undefined,
      status: form.status,
      zoneTypeId: form.zoneTypeId || undefined,
      regionId: form.regionId || undefined,
      activityIds: form.activityIds,
      amenityIds: form.amenityIds,
      vertices: form.vertices.map((v, i) => ({
        seq: i,
        lambertX: v.lambertX ? parseFloat(v.lambertX) : 0,
        lambertY: v.lambertY ? parseFloat(v.lambertY) : 0,
      })),
    }
    if (form.id) {
      await fetchApi(`/api/zones/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetchApi('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setForm({
      id: '',
      name: '',
      description: '',
      address: '',
      totalArea: '',
      price: '',
      priceType: 'FIXED_PRICE',
      constructionType: 'CUSTOM_BUILD',
      status: 'LIBRE',
      zoneTypeId: '',
      regionId: '',
      activityIds: [],
      amenityIds: [],
      vertices: [],
    })
    setImages([])
    setOpen(false)
    loadZones(currentPage)
  }

  const handleEdit = useCallback((z: Zone) => {
    setForm({
      id: z.id,
      name: z.name,
      description: z.description ?? '',
      address: z.address ?? '',
      totalArea: z.totalArea?.toString() ?? '',
      price: z.price?.toString() ?? '',
      priceType: z.priceType || 'FIXED_PRICE',
      constructionType: z.constructionType || 'CUSTOM_BUILD',
      status: z.status,
      zoneTypeId: z.zoneTypeId || '',
      regionId: z.regionId || '',
      activityIds: z.activityIds || [],
      amenityIds: z.amenityIds || [],
      vertices: z.vertices ? z.vertices.sort((a,b)=>a.seq-b.seq).map(v => ({
        lambertX: v.lambertX.toString(),
        lambertY: v.lambertY.toString(),
      })) : [],
    })
    setImages([])
    setOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await fetchApi(`/api/zones/${id}`, { method: 'DELETE' })
    loadZones(currentPage)
  }, [loadZones, currentPage])

  function addNew() {
    setForm({
      id: '',
      name: '',
      description: '',
      address: '',
      totalArea: '',
      price: '',
      priceType: 'FIXED_PRICE',
      constructionType: 'CUSTOM_BUILD',
      status: 'LIBRE',
      zoneTypeId: '',
      regionId: '',
      activityIds: [],
      amenityIds: [],
      vertices: [],
    })
    setImages([])
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Gestion des Zones</h1>
        <Button onClick={addNew}>Ajouter</Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Nom</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Région</th>
                <th className="p-2">Coordonnées</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(zones) ? zones : []).map((zone) => (
                <ZoneTableRow
                  key={zone.id}
                  zone={zone}
                  getZoneCoordinates={getZoneCoordinates}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <select
        className="border p-2"
        value={selectedZoneId}
        onChange={e => setSelectedZoneId(e.target.value)}
      >
        {(Array.isArray(allZones) ? allZones.length : 0) === 0 ? (
          <option value="">Aucune zone trouvée</option>
        ) : (
          <>
            <option value="">-- Sélectionnez une zone --</option>
            {(Array.isArray(allZones) ? allZones : []).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </>
        )}
      </select>

      <Pagination
        totalItems={totalPages * itemsPerPage}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier une zone' : 'Nouvelle zone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalArea">Superficie m²</Label>
                <Input id="totalArea" name="totalArea" value={form.totalArea} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="price">Prix</Label>
                <Input id="price" name="price" value={form.price} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceType">Type de prix</Label>
                <Select value={form.priceType || undefined} onValueChange={handlePriceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Sélectionnez un type de prix --" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="constructionType">Type de construction</Label>
                <Select value={form.constructionType || undefined} onValueChange={handleConstructionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Sélectionnez un type --" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRUCTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Coordonnées Lambert (polygone)</Label>
              <div className="text-xs text-gray-600 mb-2">
                Les coordonnées GPS seront calculées automatiquement après sauvegarde
              </div>
              {(form.vertices ?? []).map((v, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 items-center mb-2">
                  <Input
                    placeholder="X (Lambert)"
                    value={v.lambertX}
                    onChange={(e) => updateVertex(idx, 'lambertX', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Y (Lambert)"
                      value={v.lambertY}
                      onChange={(e) => updateVertex(idx, 'lambertY', e.target.value)}
                    />
                    <Button type="button" size="sm" variant="destructive" onClick={() => removeVertex(idx)}>
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" size="sm" onClick={addVertex}>Ajouter un point</Button>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status || undefined} onValueChange={handleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un statut --" />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zoneTypeId">Type</Label>
              <Select value={form.zoneTypeId || undefined} onValueChange={handleZoneType}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un type --" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(allZoneTypes) ? allZoneTypes : []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regionId">Région</Label>
              <Select value={form.regionId || undefined} onValueChange={handleRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez une région --" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(allRegions) ? allRegions : []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Activités</Label>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(activities) ? activities : []).length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune activité disponible</p>
                ) : (
                  (Array.isArray(activities) ? activities : []).map((a) => (
                    <label key={a.id} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.activityIds.includes(a.id)}
                        onChange={() => toggleActivity(a.id)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <Label>Équipements</Label>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(allAmenities) ? allAmenities : []).length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun équipement disponible</p>
                ) : (
                  (Array.isArray(allAmenities) ? allAmenities : []).map((a) => (
                    <label key={a.id} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.amenityIds.includes(a.id)}
                        onChange={() => toggleAmenity(a.id)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <Label>Photos</Label>
              <Input type="file" multiple onChange={handleFiles} accept="image/*" />
              {images.length === 0 && (
                <p className="text-gray-500 text-xs mt-1">Note: Les images sont prévisualisées mais ne sont pas encore sauvegardées (en attente de l'implémentation backend)</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {(images ?? []).map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img.url} className="w-24 h-24 object-cover rounded" alt={`Image ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                      title="Supprimer cette image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit">{form.id ? 'Mettre à jour' : 'Créer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}