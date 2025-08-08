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

interface Activity {
  id: string
  name: string
  description?: string
  icon?: string
}

export default function ActivitiesAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Activity[]>([])
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Activity>({
    id: '',
    name: '',
    description: '',
    icon: '',
  })


  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const res = await fetchApi<ListResponse<Activity>>(
      `/api/activities?${params.toString()}`
    ).catch(() => null)
    if (res) {
      const arr = Array.isArray(res.items) ? res.items : []
      setItems(arr)
      setTotalPages(res.totalPages || 1)
      setCurrentPage(res.page || 1)
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
    fetchApi<ListResponse<Activity>>("/api/activities/all")
      .then((data) => {
        const arr = data && Array.isArray(data.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : []
        if (data && !Array.isArray((data as any).items) && !Array.isArray(data)) {
          console.warn('⚠️ Format de données inattendu:', data)
        }
        setAllActivities(arr)
      })
      .catch(() => setAllActivities([]))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      name: form.name,
      description: form.description || undefined,
      icon: form.icon || undefined,
    }
    if (form.id) {
      await fetchApi(`/api/activities/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetchApi('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setForm({ id: '', name: '', description: '', icon: '' })
    setOpen(false)
    load(currentPage)
  }

  function edit(it: Activity) {
    setForm({
      id: it.id,
      name: it.name,
      description: it.description ?? '',
      icon: it.icon ?? '',
    })
    setOpen(true)
  }
  async function del(id: string) {
    await fetchApi(`/api/activities/${id}`, { method: 'DELETE' })
    load(currentPage)
  }

  function addNew() {
    setForm({ id: '', name: '', description: '', icon: '' })
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Activités</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par nom..."
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
                <th className="p-2">Nom</th>
                <th className="p-2">Description</th>
                <th className="p-2">Icône</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{a.name}</td>
                  <td className="p-2 align-top">{a.description}</td>
                  <td className="p-2 align-top">{a.icon}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(a)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={a.name}
                      onConfirm={() => del(a.id)}
                      description={`Êtes-vous sûr de vouloir supprimer l'activité "${a.name}" ? Cette action est irréversible et supprimera toutes les associations avec les zones.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <select
        className="border p-2"
        value={selectedActivityId}
        onChange={e => setSelectedActivityId(e.target.value)}
      >
        {(Array.isArray(allActivities) ? allActivities.length : 0) === 0 ? (
          <option value="">Aucune activité trouvée</option>
        ) : (
          <>
            <option value="">-- Sélectionnez une activité --</option>
            {(Array.isArray(allActivities) ? allActivities : []).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </>
        )}
      </select>

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
            <DialogTitle>{form.id ? 'Modifier' : 'Nouvelle activité'}</DialogTitle>
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
              <Label htmlFor="icon">Icône</Label>
              <Input id="icon" name="icon" value={form.icon} onChange={handleChange} />
            </div>
            <Button type="submit">{form.id ? 'Mettre à jour' : 'Créer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
