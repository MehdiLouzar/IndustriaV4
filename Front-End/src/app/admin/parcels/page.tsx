'use client'

import { useEffect, useState } from 'react'
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

const statuses = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'SHOWROOM']

export default function ParcelsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Parcel[]>([])
  const [allParcels, setAllParcels] = useState<Parcel[]>([])
  const [selectedParcelId, setSelectedParcelId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [allZones, setAllZones] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<ParcelForm>({
    id: '',
    reference: '',
    area: '',
    status: 'AVAILABLE',
    isShowroom: false,
    zoneId: '',
    vertices: [],
  })
  const [images, setImages] = useState<{ file: File; url: string }[]>([])


  async function load(page = currentPage) {
    const p = await fetchApi<ListResponse<Parcel>>(
      `/api/parcels?page=${page}&limit=${itemsPerPage}`
    )
    if (p) {
      setItems(p.items)
      setTotalPages(p.totalPages)
      setCurrentPage(p.page)
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(currentPage) }, [currentPage])

  useEffect(() => {
    fetchApi<Parcel[]>("/api/parcels/all")
      .then(setAllParcels)
      .catch(() => setAllParcels([]))
  }, [])

  useEffect(() => {
    fetchApi<{ id: string; name: string }[]>("/api/zones/all")
      .then(setAllZones)
      .catch(() => setAllZones([]))
  }, [])

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
      status: form.status,
      isShowroom: form.isShowroom,
      zoneId: form.zoneId,
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
      status: 'AVAILABLE',
      isShowroom: false,
      zoneId: '',
      vertices: [],
    })
    setImages([])
    setOpen(false)
    load(currentPage)
  }

  function edit(it: Parcel) {
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
  }
  async function del(id: string) {
    await fetchApi(`/api/parcels/${id}`, { method: 'DELETE' })
    load(currentPage)
  }

  function addNew() {
    setForm({
      id: '',
      reference: '',
      area: '',
      status: 'AVAILABLE',
      isShowroom: false,
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
              {(items ?? []).map((p) => (
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

      <select
        className="border p-2"
        value={selectedParcelId}
        onChange={e => setSelectedParcelId(e.target.value)}
      >
        {(allParcels ?? []).length === 0 ? (
          <option value="">Aucune parcelle trouvée</option>
        ) : (
          <>
            <option value="">-- Sélectionnez une parcelle --</option>
            {(allParcels ?? []).map(a => (
              <option key={a.id} value={a.id}>{a.reference}</option>
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
              {(form.vertices ?? []).map((v, idx) => (
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
              <Select value={form.zoneId || undefined} onValueChange={handleZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {(allZones ?? []).length === 0 ? (
                    <SelectItem value="" disabled>Aucune zone trouvée</SelectItem>
                  ) : (
                    (allZones ?? []).map((z) => (
                      <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status || undefined} onValueChange={handleStatus}>
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
                {(images ?? []).map((img, idx) => (
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
