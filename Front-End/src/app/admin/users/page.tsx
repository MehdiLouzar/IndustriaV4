'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
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

interface User {
  id: string
  email: string
  name: string
  role: string
  company?: string
  phone?: string
  isActive?: boolean
}

const roles = ['ADMIN', 'MANAGER', 'USER']

export default function UsersAdmin() {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
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

  useEffect(() => { if (session && session.user.role !== 'ADMIN') router.push('/auth/login') }, [session])

  async function load() {
    const users = await fetchApi<User[]>('/api/users')
    if (users) {
      setItems(users)
      setCurrentPage(1)
    }
  }
  useEffect(() => { load() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRole = (value: string) => {
    setForm({ ...form, role: value })
  }

  async function submit(e: React.FormEvent) {
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
    load()
  }

  function edit(it: User) {
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
  }
  async function del(id: string) {
    await fetchApi(`/api/users/${id}`, { method: 'DELETE' })
    load()
  }

  function addNew() {
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
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Utilisateurs</h1>
        <Button onClick={addNew}>Ajouter</Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Email</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Société</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {items
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{u.email}</td>
                  <td className="p-2 align-top">{u.role}</td>
                  <td className="p-2 align-top">{u.company}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(u)}>Éditer</Button>
                    <Button size="sm" variant="destructive" onClick={() => del(u.id)}>
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
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
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
