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
import type { ListResponse } from '@/types'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface Appointment {
  id: string
  contactName: string
  contactEmail: string
  contactPhone: string
  companyName: string
  message: string
  requestedDate: string
  parcelId: string
  status: string
}

interface ParcelDto {
  id: string
  reference: string
}

const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function AppointmentsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Appointment[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [parcels, setParcels] = useState<ParcelDto[]>([])
  const [form, setForm] = useState<Appointment>({
    id: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    message: '',
    requestedDate: '',
    parcelId: '',
    status: 'PENDING',
  })

  async function load() {
    const a = await fetchApi<ListResponse<Appointment>>('/api/appointments').catch(() => null)
    if (a) {
      const arr = Array.isArray(a.items) ? a.items : []
      setItems(arr)
      setCurrentPage(1)
    } else {
      setItems([])
    }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    fetchApi<ListResponse<ParcelDto>>("/api/parcels/all")
      .then((data) => {
        const arr = data && Array.isArray(data.items) ? data.items : []
        if (data && !Array.isArray((data as any).items) && !Array.isArray(data)) {
          console.warn('⚠️ Format de données inattendu:', data)
        }
        setParcels(arr)
      })
      .catch(() => setParcels([]))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleStatus = (value: string) => {
    setForm({ ...form, status: value })
  }

  const handleParcel = (value: string) => {
    setForm({ ...form, parcelId: value })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      contactName: form.contactName,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      companyName: form.companyName || undefined,
      message: form.message || undefined,
      requestedDate: form.requestedDate || undefined,
      parcelId: form.parcelId || undefined,
      status: form.status,
    }

    if (form.id) {
      await fetchApi(`/api/appointments/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetchApi('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setForm({
      id: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      companyName: '',
      message: '',
      requestedDate: '',
      parcelId: '',
      status: 'PENDING',
    })
    setOpen(false)
    load()
  }

  function edit(it: Appointment) {
    setForm({
      id: it.id,
      contactName: it.contactName,
      contactEmail: it.contactEmail ?? '',
      contactPhone: it.contactPhone ?? '',
      companyName: it.companyName ?? '',
      message: it.message ?? '',
      requestedDate: it.requestedDate ? it.requestedDate.slice(0, 10) : '',
      parcelId: it.parcelId ?? '',
      status: it.status,
    })
    setOpen(true)
  }
  async function del(id: string) {
    await fetchApi(`/api/appointments/${id}`, { method: 'DELETE' })
    load()
  }

  function addNew() {
    setForm({
      id: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      companyName: '',
      message: '',
      requestedDate: '',
      parcelId: '',
      status: 'PENDING',
    })
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Rendez-vous</h1>
        <Button onClick={addNew}>Ajouter</Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Contact</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Parcelle</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : [])
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{a.contactName}</td>
                  <td className="p-2 align-top">{a.status}</td>
                  <td className="p-2 align-top">{a.parcelId}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(a)}>Éditer</Button>
                    <Button size="sm" variant="destructive" onClick={() => del(a.id)}>
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
        totalItems={Array.isArray(items) ? items.length : 0}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier' : 'Nouveau RDV'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="contactName">Contact</Label>
              <Input id="contactName" name="contactName" value={form.contactName} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" name="contactEmail" value={form.contactEmail} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="contactPhone">Téléphone</Label>
              <Input id="contactPhone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="companyName">Société</Label>
              <Input id="companyName" name="companyName" value={form.companyName} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input id="message" name="message" value={form.message} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="requestedDate">Date souhaitée</Label>
              <Input id="requestedDate" name="requestedDate" type="date" value={form.requestedDate} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="parcelId">Parcelle</Label>
              <Select value={form.parcelId || undefined} onValueChange={handleParcel}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez une parcelle --" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(parcels) ? parcels : [])
                    .filter((p) => p.id && String(p.id).trim() !== "")
                    .map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.reference}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status || undefined} onValueChange={handleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un statut --" />
                </SelectTrigger>
                <SelectContent>
                  {statuses
                    .filter((s) => s && s.trim() !== "")
                    .map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">{form.id ? 'Mettre à jour' : 'Créer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}