'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fetchApi } from '@/lib/utils'
import Pagination from '@/components/Pagination'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
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
  activityType: string
  projectDescription: string
  investmentBudget: string
  preferredDate: string
  preferredTime: string
  urgency: string
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
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
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
    activityType: '',
    projectDescription: '',
    investmentBudget: '',
    preferredDate: '',
    preferredTime: '',
    urgency: '',
    requestedDate: '',
    parcelId: '',
    status: 'PENDING',
  })

  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const response = await fetchApi<ListResponse<Appointment>>(
      `/api/appointments?${params.toString()}`
    ).catch(() => null)
    
    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else if (Array.isArray(response)) {
      setItems(response as Appointment[])
      setTotalPages(1)
      setCurrentPage(1)
    } else {
      setItems([])
      setTotalPages(1)
      setCurrentPage(1)
    }
  }, [currentPage, itemsPerPage, searchTerm])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
    load(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, router])

  // Effet pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Retour à la page 1 lors d'une recherche
      load(1, searchTerm)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, load])

  useEffect(() => {
    fetchApi<ParcelDto[]>("/api/parcels/all")
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
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
      activityType: form.activityType || undefined,
      projectDescription: form.projectDescription || undefined,
      investmentBudget: form.investmentBudget || undefined,
      preferredDate: form.preferredDate || undefined,
      preferredTime: form.preferredTime || undefined,
      urgency: form.urgency || undefined,
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
      activityType: '',
      projectDescription: '',
      investmentBudget: '',
      preferredDate: '',
      preferredTime: '',
      urgency: '',
      requestedDate: '',
      parcelId: '',
      status: 'PENDING',
    })
    setOpen(false)
    load(currentPage)
  }

  function edit(it: Appointment) {
    setForm({
      id: it.id,
      contactName: it.contactName,
      contactEmail: it.contactEmail ?? '',
      contactPhone: it.contactPhone ?? '',
      companyName: it.companyName ?? '',
      message: it.message ?? '',
      activityType: it.activityType ?? '',
      projectDescription: it.projectDescription ?? '',
      investmentBudget: it.investmentBudget ?? '',
      preferredDate: it.preferredDate ?? '',
      preferredTime: it.preferredTime ?? '',
      urgency: it.urgency ?? '',
      requestedDate: it.requestedDate ? it.requestedDate.slice(0, 10) : '',
      parcelId: it.parcelId ?? '',
      status: it.status,
    })
    setOpen(true)
  }
  async function del(id: string) {
    await fetchApi(`/api/appointments/${id}`, { method: 'DELETE' })
    load(currentPage)
  }

  function addNew() {
    setForm({
      id: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      companyName: '',
      message: '',
      activityType: '',
      projectDescription: '',
      investmentBudget: '',
      preferredDate: '',
      preferredTime: '',
      urgency: '',
      requestedDate: '',
      parcelId: '',
      status: 'PENDING',
    })
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Rendez-vous</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par contact, email..."
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
                <th className="p-2">Contact</th>
                <th className="p-2">Société</th>
                <th className="p-2">Activité</th>
                <th className="p-2">Description du projet</th>
                <th className="p-2">Urgence</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Parcelle</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-2 align-top">
                    <div className="font-medium">{a.contactName}</div>
                    <div className="text-xs text-gray-500">{a.contactEmail}</div>
                  </td>
                  <td className="p-2 align-top">{a.companyName}</td>
                  <td className="p-2 align-top">{a.activityType}</td>
                  <td className="p-2 align-top">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate" title={a.projectDescription || 'Aucune description'}>
                        {a.projectDescription || 'Aucune description'}
                      </p>
                    </div>
                  </td>
                  <td className="p-2 align-top">
                    <span className={`px-2 py-1 rounded text-xs ${
                      a.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                      a.urgency === 'moyen-terme' ? 'bg-yellow-100 text-yellow-800' :
                      a.urgency === 'long-terme' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {a.urgency}
                    </span>
                  </td>
                  <td className="p-2 align-top">
                    <span className={`px-2 py-1 rounded text-xs ${
                      a.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      a.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-2 align-top">{a.parcelId}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(a)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={`Rendez-vous de ${a.contactName}`}
                      onConfirm={() => del(a.id)}
                      description={`Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.`}
                    />
                  </td>
                </tr>
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
              <Label htmlFor="activityType">Type d'activité</Label>
              <Input id="activityType" name="activityType" value={form.activityType} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="projectDescription">Description du projet</Label>
              <Input id="projectDescription" name="projectDescription" value={form.projectDescription} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="investmentBudget">Budget d'investissement</Label>
              <Input id="investmentBudget" name="investmentBudget" value={form.investmentBudget} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="preferredDate">Date préférée</Label>
              <Input id="preferredDate" name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="preferredTime">Créneau préféré</Label>
              <Input id="preferredTime" name="preferredTime" value={form.preferredTime} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="urgency">Urgence</Label>
              <Input id="urgency" name="urgency" value={form.urgency} onChange={handleChange} />
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