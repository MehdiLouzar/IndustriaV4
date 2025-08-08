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
import { PARCEL_STATUSES, getEnumLabel, getEnumBadge } from '@/lib/translations'
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

interface Parcel {
  id: string
  reference: string
  area?: number | null
  status: string
  isShowroom?: boolean | null
  zoneId: string
  vertices?: Vertex[]
  longitude?: number | null  // Coordonnées calculées côté backend
  latitude?: number | null   // Coordonnées calculées côté backend
}

interface ZoneDto {
  id: string
  name: string
}

interface ParcelForm {
  id: string
  reference: string
  area: string
  status: string
  isShowroom: boolean
  zoneId: string
  vertices: { lambertX: string; lambertY: string }[]
}

// Composant mémorisé pour les lignes de la table des parcelles
const ParcelTableRow = memo(({ 
  parcel, 
  getParcelCoordinates, 
  onEdit, 
  onDelete 
}: { 
  parcel: Parcel, 
  getParcelCoordinates: (parcel: Parcel) => any,
  onEdit: (parcel: Parcel) => void,
  onDelete: (id: string) => void
}) => {
  const coordinates = useMemo(() => getParcelCoordinates(parcel), [parcel, getParcelCoordinates])
  
  return (
    <tr key={parcel.id} className="border-b last:border-0">
      <td className="p-2 align-top">{parcel.reference}</td>
      <td className="p-2 align-top">{parcel.zoneId}</td>
      <td className="p-2 align-top">
        <Badge className={getEnumBadge(PARCEL_STATUSES, parcel.status).color}>
          {getEnumBadge(PARCEL_STATUSES, parcel.status).label}
        </Badge>
      </td>
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
        <Button size="sm" onClick={() => onEdit(parcel)}>Éditer</Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(parcel.id)}>
          Supprimer
        </Button>
      </td>
    </tr>
  )
})

ParcelTableRow.displayName = 'ParcelTableRow'

// Les statuts sont maintenant importés de translations.ts

export default function ParcelsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Parcel[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [zones, setZones] = useState<ZoneDto[]>([])
  const [form, setForm] = useState<ParcelForm>({
    id: '',
    reference: '',
    area: '',
    status: 'LIBRE',
    isShowroom: false,
    zoneId: '',
    vertices: [],
  })
  const [images, setImages] = useState<{ file: File; url: string }[]>([])

  // Fonction pour récupérer les coordonnées pré-calculées d'une parcelle
  const getParcelCoordinates = useCallback((parcel: Parcel) => {
    if (!parcel.longitude || !parcel.latitude) {
      return {
        display: 'Aucune coordonnée',
        wgs84: null,
        lambert: null
      }
    }

    const wgs84 = {
      longitude: parcel.longitude,
      latitude: parcel.latitude
    }

    return {
      display: formatWGS84(wgs84),
      wgs84: wgs84,
      lambert: null // Plus besoin des coordonnées Lambert
    }
  }, [])

  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const p = await fetchApi<ListResponse<Parcel>>(
      `/api/parcels?${params.toString()}`
    ).catch(() => null)
    if (p) {
      const arr = Array.isArray(p.items) ? p.items : []
      setItems(arr)
      setTotalPages(p.totalPages || 1)
      setCurrentPage(p.page || 1)
    } else {
      setItems([])
    }
  }, [currentPage, itemsPerPage, searchTerm])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(currentPage) }, [currentPage])

  // Effet pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Retour à la page 1 lors d'une recherche
      load(1, searchTerm)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, load])


  useEffect(() => {
    fetchApi<ZoneDto[]>("/api/zones/all")
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setZones(arr)
        console.log('Zones chargées:', arr.length)
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des zones:', error)
        setZones([])
      })
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }))
  }, [])

  const handleStatus = useCallback((value: string) => {
    setForm(prev => ({ ...prev, status: value }))
  }, [])

  const handleZone = useCallback((value: string) => {
    setForm(prev => ({ ...prev, zoneId: value }))
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
      reference: form.reference,
      area: form.area ? parseFloat(form.area) : undefined,
      status: form.status,
      isShowroom: form.isShowroom,
      zoneId: form.zoneId,
      vertices: form.vertices.map((v, i) => ({
        seq: i,
        lambertX: v.lambertX ? parseFloat(v.lambertX) : 0,
        lambertY: v.lambertY ? parseFloat(v.lambertY) : 0,
      })),
    }

    if (form.id) {
      await fetchApi(`/api/parcels/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetchApi('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    setForm({
      id: '',
      reference: '',
      area: '',
      status: 'LIBRE',
      isShowroom: false,
      zoneId: '',
      vertices: [],
    })
    setImages([])
    setOpen(false)
    load(currentPage)
  }

  const handleEdit = useCallback((it: Parcel) => {
    setForm({
      id: it.id,
      reference: it.reference,
      area: it.area?.toString() ?? '',
      status: it.status,
      isShowroom: it.isShowroom ?? false,
      zoneId: it.zoneId,
      vertices: it.vertices ? it.vertices.sort((a,b)=>a.seq-b.seq).map(v => ({
        lambertX: v.lambertX.toString(),
        lambertY: v.lambertY.toString(),
      })) : [],
    })
    setImages([])
    setOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await fetchApi(`/api/parcels/${id}`, { method: 'DELETE' })
    load(currentPage)
  }, [load, currentPage])

  function addNew() {
    setForm({
      id: '',
      reference: '',
      area: '',
      status: 'LIBRE',
      isShowroom: false,
      zoneId: '',
      vertices: [],
    })
    setImages([])
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Parcelles</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={addNew}>Ajouter</Button>
        </div>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Référence</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Coordonnées</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((parcel) => (
                <ParcelTableRow
                  key={parcel.id}
                  parcel={parcel}
                  getParcelCoordinates={getParcelCoordinates}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          totalItems={totalPages * itemsPerPage}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier' : 'Nouvelle parcelle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" name="reference" value={form.reference} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Surface m²</Label>
                <Input id="area" name="area" value={form.area} onChange={handleChange} />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isShowroom" name="isShowroom" checked={form.isShowroom} onChange={handleToggle} />
              <Label htmlFor="isShowroom">Showroom</Label>
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
              <Label htmlFor="zoneId">Zone</Label>
              <Select value={form.zoneId || undefined} onValueChange={handleZone}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez une zone --" />
                </SelectTrigger>
                <SelectContent>
                  {zones.length === 0 ? (
                    <SelectItem value="" disabled>
                      Aucune zone disponible
                    </SelectItem>
                  ) : (
                    zones
                      .filter((z) => z.id && String(z.id).trim() !== "")
                      .map((z) => (
                        <SelectItem key={z.id} value={String(z.id)}>
                          {z.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {zones.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {zones.length === 0 ? 'Chargement des zones...' : `${zones.length} zones disponibles`}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status || undefined} onValueChange={handleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un statut --" />
                </SelectTrigger>
                <SelectContent>
                  {PARCEL_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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