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

interface ZoneType {
  id: string
  name: string
}

export default function ZoneTypesAdmin() {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<ZoneType[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ZoneType>({ id: '', name: '' })

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') router.push('/auth/login')
  }, [session])

  async function load() {
    const items = await fetchApi<ZoneType[]>('/api/zone-types')
    if (items) {
      setItems(items)
      setCurrentPage(1)
    }
  }
  useEffect(() => { load() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.id) {
      await fetchApi(`/api/zone-types/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name })
      })
    } else {
      await fetchApi('/api/zone-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name })
      })
    }
    setForm({ id: '', name: '' })
    setOpen(false)
    load()
  }

  function edit(it: ZoneType) {
    setForm(it)
    setOpen(true)
  }

  async function del(id: string) {
    await fetchApi(`/api/zone-types/${id}`, { method: 'DELETE' })
    load()
  }

  function addNew() {
    setForm({ id: '', name: '' })
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Types de zone</h1>
        <Button onClick={addNew}>Ajouter</Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Nom</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {items
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{t.name}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(t)}>Éditer</Button>
                    <Button size="sm" variant="destructive" onClick={() => del(t.id)}>
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
            <DialogTitle>{form.id ? 'Modifier' : 'Nouveau type'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <Button type="submit">{form.id ? 'Mettre à jour' : 'Créer'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
