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

interface Vertex {
  seq: number
  lambertX: number
  lambertY: number
}

interface Parcel {
  id: string
  reference: string
  area?: number | null
  price?: number | null
  status: string
  isFree?: boolean | null
  isShowroom?: boolean | null
  cos?: number | null
  cus?: number | null
  lambertX?: number | null
  lambertY?: number | null
  latitude?: number | null
  longitude?: number | null
  zoneId: string
  vertices?: Vertex[]
}

interface ParcelForm {
  id: string
  reference: string
  area: string
  price: string
  status: string
  isFree: boolean
  isShowroom: boolean
  cos: string
  cus: string
  lambertX: string
  lambertY: string
  latitude: string
  longitude: string
  zoneId: string
  vertices: { lambertX: string; lambertY: string }[]
}

const statuses = ['LIBRE', 'RESERVEE', 'INDISPONIBLE', 'VENDU', 'EN_DEVELOPPEMENT']

export default function ParcelsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Parcel[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [zones, setZones] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<ParcelForm>({
    id: '',
    reference: '',
    area: '',
    price: '',
    status: 'LIBRE',
    isFree: true,
    isShowroom: false,
    cos: '',
    cus: '',

    lambertX: '',
    lambertY: '',
    latitude: '',
    longitude: '',
    zoneId: '',
    vertices: [],
  })
  const [images, setImages] = useState<{ file: File; url: string }[]>([])


  async function load() {
    const [p, z] = await Promise.all([
      fetchApi<Parcel[]>('/api/parcels'),
      fetchApi<{ id: string; name: string }[]>('/api/zones'),
    ])
    if (p) {
      setItems(p)
      setCurrentPage(1)
    }
    if (z) setZones(z)
  }
  useEffect(() => { load() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.checked })
  }

  const handleStatus = (value: string) => {
    setForm({ ...form, status: value })
  }

  const handleZone = (value: string) => {
    setForm({ ...form, zoneId: value })
  }

  const addVertex = () => {
    setForm((f) => ({
      ...f,
      vertices: [...f.vertices, { lambertX: '', lambertY: '' }],
    }))
  }

  const updateVertex = (
    index: number,
    field: 'lambertX' | 'lambertY',
    value: string
  ) => {
    setForm((f) => {
      const verts = [...f.vertices]
      verts[index] = { ...verts[index], [field]: value }
      return { ...f, vertices: verts }
    })
  }

  const removeVertex = (index: number) => {
    setForm((f) => {
      const verts = [...f.vertices]
      verts.splice(index, 1)
      return { ...f, vertices: verts }
    })
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
      reference: form.reference,
      area: form.area ? parseFloat(form.area) : undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      status: form.status,
      isFree: form.isFree,
      isShowroom: form.isShowroom,
      cos: form.cos ? parseFloat(form.cos) : undefined,
      cus: form.cus ? parseFloat(form.cus) : undefined,
      lambertX: form.lambertX ? parseFloat(form.lambertX) : undefined,
      lambertY: form.lambertY ? parseFloat(form.lambertY) : undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
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
      price: '',
      status: 'LIBRE',
      isFree: true,
      isShowroom: false,
      cos: '',
      cus: '',
      lambertX: '',
      lambertY: '',
      latitude: '',
      longitude: '',
      zoneId: '',
      vertices: [],
    })
    setImages([])
    setOpen(false)
    load()
  }

  function edit(it: Parcel) {
    setForm({
      id: it.id,
      reference: it.reference,
      area: it.area?.toString() ?? '',
      price: it.price?.toString() ?? '',
      status: it.status,
      isFree: it.isFree ?? true,
      isShowroom: it.isShowroom ?? false,
      cos: it.cos?.toString() ?? '',
      cus: it.cus?.toString() ?? '',
      lambertX: it.lambertX?.toString() ?? '',
      lambertY: it.lambertY?.toString() ?? '',
      latitude: it.latitude?.toString() ?? '',
      longitude: it.longitude?.toString() ?? '',
      zoneId: it.zoneId,
      vertices: it.vertices ? it.vertices.sort((a,b)=>a.seq-b.seq).map(v=>({
        lambertX: v.lambertX.toString(),
        lambertY: v.lambertY.toString(),
      })) : [],
    })
    setImages([])
    setOpen(true)
  }
  async function del(id: string) {
    await fetchApi(`/api/parcels/${id}`, { method: 'DELETE' })
    load()
  }

  function addNew() {
    setForm({
      id: '',
      reference: '',
      area: '',
      price: '',
      status: 'LIBRE',
      isFree: true,
      isShowroom: false,
      cos: '',
      cus: '',
      lambertX: '',
      lambertY: '',
      latitude: '',
      longitude: '',
      zoneId: '',
      vertices: [],
    })
    setImages([])
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Parcelles</h1>
        <Button onClick={addNew}>Ajouter</Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Référence</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Statut</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {items
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{p.reference}</td>
                  <td className="p-2 align-top">{p.zoneId}</td>
                  <td className="p-2 align-top">{p.status}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(p)}>Éditer</Button>
                    <Button size="sm" variant="destructive" onClick={() => del(p.id)}>
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
        totalItems={items.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

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
              <div>
                <Label htmlFor="price">Prix</Label>
                <Input id="price" name="price" value={form.price} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lambertX">Lambert X</Label>
                <Input id="lambertX" name="lambertX" value={form.lambertX} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="lambertY">Lambert Y</Label>
                <Input id="lambertY" name="lambertY" value={form.lambertY} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" name="latitude" value={form.latitude} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" name="longitude" value={form.longitude} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isFree" name="isFree" checked={form.isFree} onChange={handleToggle} />
                <Label htmlFor="isFree">Libre</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isShowroom" name="isShowroom" checked={form.isShowroom} onChange={handleToggle} />
                <Label htmlFor="isShowroom">Showroom</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cos">CoS</Label>
                <Input id="cos" name="cos" value={form.cos} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="cus">CuS</Label>
                <Input id="cus" name="cus" value={form.cus} onChange={handleChange} />
              </div>
            </div>
            <div>
              <Label>Coordonnées Lambert (polygone)</Label>
              {form.vertices.map((v, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 items-center mb-2">
                  <Input
                    placeholder="X"
                    value={v.lambertX}
                    onChange={(e) => updateVertex(idx, 'lambertX', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Y"
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
              <Select value={form.zoneId} onValueChange={handleZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
