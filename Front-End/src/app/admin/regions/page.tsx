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

interface Region {
  id: string
  name: string
  code: string
  countryId: string
}

export default function RegionsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Region[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [allCountries, setAllCountries] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<Region>({ id: '', name: '', code: '', countryId: '' })


  async function load() {
    const r = await fetchApi<ListResponse<Region>>('/api/regions').catch(() => null)
    if (r) {
      const arr = Array.isArray(r.items) ? r.items : []
      setItems(arr)
      setCurrentPage(1)
    } else {
      setItems([])
    }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    fetchApi<ListResponse<{ id: string; name: string }>>("/api/countries/all")
      .then((data) => {
        const arr = data && Array.isArray(data.items) ? data.items : []
        if (data && !Array.isArray((data as any).items) && !Array.isArray(data)) {
          console.warn('⚠️ Format de données inattendu:', data)
        }
        setAllCountries(arr)
      })
      .catch(() => setAllCountries([]))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCountry = (value: string) => {
    setForm({ ...form, countryId: value })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.id) {
      await fetchApi(`/api/regions/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, code: form.code, countryId: form.countryId })
      })
    } else {
      await fetchApi('/api/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, code: form.code, countryId: form.countryId })
      })
    }
    setForm({ id: '', name: '', code: '', countryId: '' })
    setOpen(false)
    load()
  }

  function edit(it: Region) {
    setForm(it)
    setOpen(true)
  }

  async function del(id: string) {
    await fetchApi(`/api/regions/${id}`, { method: 'DELETE' })
    load()
  }

  function addNew() {
    setForm({ id: '', name: '', code: '', countryId: '' })
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Gestion des Régions</h1>
        <Button onClick={addNew}>Ajouter</Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Nom</th>
                <th className="p-2">Code</th>
                <th className="p-2">Pays</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : [])
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{r.name}</td>
                  <td className="p-2 align-top">{r.code}</td>
                  <td className="p-2 align-top">{r.countryId}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(r)}>Éditer</Button>
                    <Button size="sm" variant="destructive" onClick={() => del(r.id)}>
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
            <DialogTitle>{form.id ? 'Modifier une région' : 'Nouvelle région'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" value={form.code} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="countryId">Pays</Label>
              <Select value={form.countryId || undefined} onValueChange={handleCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" disabled>
                    -- Sélectionnez un pays --
                  </SelectItem>
                  {(Array.isArray(allCountries) ? allCountries : [])
                    .filter((c) => c.id && String(c.id).trim() !== "")
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
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
