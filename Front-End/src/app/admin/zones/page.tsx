'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fetchApi } from '@/lib/utils'
import Pagination from '@/components/Pagination'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface Zone {
  id: string
  name: string
  description?: string | null
  address?: string | null
  totalArea?: number | null
  price?: number | null
  status: string
  region?: { id: string; name: string } | null
  zoneType?: { id: string; name: string } | null
  amenities?: string[]
  activities?: string[]
}

interface ZoneForm {
  id: string
  name: string
  description: string
  address: string
  totalArea: string
  price: string
  status: string
  zoneTypeId: string
  regionId: string
  activityIds: string[]
  amenityIds: string[]
}

const statuses = [
  'LIBRE',
  'RESERVEE',
  'INDISPONIBLE',
  'VENDU',
  'EN_DEVELOPPEMENT',
]

export default function ZonesAdmin() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [zoneTypes, setZoneTypes] = useState<{ id: string; name: string }[]>([])
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [activities, setActivities] = useState<{ id: string; name: string }[]>([])
  const [amenities, setAmenities] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<ZoneForm>({
    id: '',
    name: '',
    description: '',
    address: '',
    totalArea: '',
    price: '',
    status: 'LIBRE',
    zoneTypeId: '',
    regionId: '',
    activityIds: [],
    amenityIds: [],
  })
  const [images, setImages] = useState<{ file: File; url: string }[]>([])

  async function load() {
    const [z, t, r, a, m] = await Promise.all([
      fetchApi<Zone[]>('/api/zones'),
      fetchApi<{ id: string; name: string }[]>('/api/zone-types'),
      fetchApi<{ id: string; name: string }[]>('/api/regions'),
      fetchApi<{ id: string; name: string }[]>('/api/activities'),
      fetchApi<{ id: string; name: string }[]>('/api/amenities'),
    ])
    if (z) {
      setZones(z)
      setCurrentPage(1)
    }
    if (t) setZoneTypes(t)
    if (r) setRegions(r)
    if (a) setActivities(a)
    if (m) setAmenities(m)
  }
  useEffect(() => { load() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleStatus = (value: string) => {
    setForm({ ...form, status: value })
  }

  const handleZoneType = (value: string) => {
    setForm({ ...form, zoneTypeId: value })
  }

  const handleRegion = (value: string) => {
    setForm({ ...form, regionId: value })
  }

  const toggleActivity = (id: string) => {
    setForm((f) => ({
      ...f,
      activityIds: f.activityIds.includes(id)
        ? f.activityIds.filter((a) => a !== id)
        : [...f.activityIds, id],
    }))
  }

  const toggleAmenity = (id: string) => {
    setForm((f) => ({
      ...f,
      amenityIds: f.amenityIds.includes(id)
        ? f.amenityIds.filter((a) => a !== id)
        : [...f.amenityIds, id],
    }))
  }


  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setImages((imgs) => [...imgs, ...files])
    e.target.value = ''
  }

  const removeImage = (idx: number) => {
    setImages((imgs) => {
      const copy = [...imgs]
      URL.revokeObjectURL(copy[idx].url)
      copy.splice(idx, 1)
      return copy
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      name: form.name,
      description: form.description || undefined,
      address: form.address || undefined,
      totalArea: form.totalArea ? parseFloat(form.totalArea) : undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      status: form.status,
      zoneType: form.zoneTypeId ? { id: form.zoneTypeId } : undefined,
      region: form.regionId ? { id: form.regionId } : undefined,
      amenities: form.amenityIds,
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
      status: 'LIBRE',
      zoneTypeId: '',
      regionId: '',
      activityIds: [],
      amenityIds: [],
    })
    setImages([])
    setOpen(false)
    load()
  }

  async function edit(z: Zone) {
    setForm({
      id: z.id,
      name: z.name,
      description: z.description ?? '',
      address: z.address ?? '',
      totalArea: z.totalArea?.toString() ?? '',
      price: z.price?.toString() ?? '',
      status: z.status,
      zoneTypeId: z.zoneType?.id || '',
      regionId: z.region?.id || '',
      activityIds: z.activities ? z.activities : [],
      amenityIds: z.amenities ? z.amenities : [],
    })
    setImages([])
    setOpen(true)
  }

  async function del(id: string) {
    await fetchApi(`/api/zones/${id}`, { method: 'DELETE' })
    load()
  }

  function addNew() {
    setForm({
      id: '',
      name: '',
      description: '',
      address: '',
      totalArea: '',
      price: '',
      status: 'LIBRE',
      zoneTypeId: '',
      regionId: '',
      activityIds: [],
      amenityIds: [],
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
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {zones
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((zone) => (
                <tr key={zone.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{zone.name}</td>
                  <td className="p-2 align-top">{zone.status}</td>
                  <td className="p-2 align-top">{zone.region?.name}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(zone)}>Éditer</Button>
                    <Button size="sm" variant="destructive" onClick={() => del(zone.id)}>
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Pagination
        totalItems={zones.length}
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
                <Label htmlFor="price">Prix DH/m²</Label>
                <Input id="price" name="price" value={form.price} onChange={handleChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status} onValueChange={handleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zoneTypeId">Type</Label>
              <Select value={form.zoneTypeId} onValueChange={handleZoneType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {zoneTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regionId">Région</Label>
              <Select value={form.regionId} onValueChange={handleRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Activités</Label>
              <div className="flex flex-wrap gap-2">
                {activities.map((a) => (
                  <label key={a.id} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={form.activityIds.includes(a.id)}
                      onChange={() => toggleActivity(a.id)}
                    />
                    <span>{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Équipements</Label>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <label key={a.id} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={form.amenityIds.includes(a.id)}
                      onChange={() => toggleAmenity(a.id)}
                    />
                    <span>{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Photos</Label>
              <Input type="file" multiple onChange={handleFiles} />
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img.url} className="w-24 h-24 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
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
