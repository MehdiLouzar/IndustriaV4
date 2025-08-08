'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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

interface User {
  id: string
  email: string
  name: string
  role: string
  company?: string
  phone?: string
  isActive?: boolean
  zoneCount?: number
}

const roles = ['ADMIN', 'MANAGER', 'USER']

export default function UsersAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<User & { password?: string }>({
    id: '',
    email: '',
    name: '',
    role: 'USER',
    company: '',
    phone: '',
    isActive: true,
    password: '',
  })


  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const response = await fetchApi<ListResponse<User>>(
      `/api/users?${params.toString()}`
    ).catch(() => null)
    
    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else if (Array.isArray(response)) {
      setItems(response as User[])
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }, [])

  const handleRole = useCallback((value: string) => {
    setForm((f) => ({ ...f, role: value }))
  }, [])

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      email: form.email,
      name: form.name,
      role: form.role,
      company: form.company || undefined,
      phone: form.phone || undefined,
      isActive: form.isActive,
      password: form.password,
    }
    if (form.id) {
      await fetchApi(`/api/users/${form.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    } else {
      await fetchApi('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    }
    setForm({
      id: '',
      email: '',
      name: '',
      role: 'USER',
      company: '',
      phone: '',
      isActive: true,
      password: '',
    })
    setOpen(false)
    load(currentPage)
  }, [form, load])

  const edit = useCallback((it: User) => {
    setForm({
      id: it.id,
      email: it.email,
      name: it.name,
      role: it.role,
      company: it.company ?? '',
      phone: it.phone ?? '',
      isActive: it.isActive ?? true,
      password: '',
    })
    setOpen(true)
  }, [])
  const del = useCallback(async (id: string) => {
    await fetchApi(`/api/users/${id}`, { method: 'DELETE' })
    load(currentPage)
  }, [load])

  const addNew = useCallback(() => {
    setForm({
      id: '',
      email: '',
      name: '',
      role: 'USER',
      company: '',
      phone: '',
      isActive: true,
      password: '',
    })
    setOpen(true)
  }, [])


  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Utilisateurs</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par email, nom..."
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
                <th className="p-2">Email</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Société</th>
                <th className="p-2">Zones</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{u.email}</td>
                  <td className="p-2 align-top">{u.role}</td>
                  <td className="p-2 align-top">{u.company}</td>
                  <td className="p-2 align-top">{u.zoneCount ?? 0}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(u)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={u.email}
                      onConfirm={() => del(u.id)}
                      description={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${u.email}" ? Cette action est irréversible et supprimera tous les rendez-vous et associations liés.`}
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
            <DialogTitle>{form.id ? 'Modifier' : 'Nouvel utilisateur'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="company">Société</Label>
              <Input id="company" name="company" value={form.company} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={form.role} onValueChange={handleRole}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un rôle --" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r && r.trim() !== "")
                    .map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input id="isActive" name="isActive" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <Label htmlFor="isActive">Actif</Label>
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" value={form.password || ''} onChange={handleChange} />
            </div>
            <Button type="submit">{form.id ? 'Mettre à jour' : 'Créer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}