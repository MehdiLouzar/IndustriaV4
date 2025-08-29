'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Pagination from '@/components/Pagination'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

import { useSecureMutation } from '@/hooks/use-api'
import { secureApiRequest } from '@/lib/auth-actions'

interface ConstructionType {
  id: string
  name: string
  description?: string
  code: string
}

const constructionTypes = [
  { code: 'CUSTOM_BUILD', name: 'Construction personnalisée', description: 'Le client construit selon ses spécifications' },
  { code: 'OWNER_BUILT', name: 'Auto-construction', description: 'Le propriétaire construit lui-même' },
  { code: 'LAND_LEASE_ONLY', name: 'Location terrain uniquement', description: 'Location du terrain sans construction' },
  { code: 'TURNKEY', name: 'Clé en main', description: 'Construction complète livrée prête à utiliser' }
]

export default function ConstructionTypesAdmin() {
  const [items, setItems] = useState<ConstructionType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ConstructionType>({
    id: '',
    name: '',
    description: '',
    code: 'CUSTOM_BUILD'
  })

  const { mutate, loading: mutLoading } = useSecureMutation()

  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    // Si un endpoint existe, on tente de le lire côté serveur de façon sécurisée
    // et on retombe sur la liste statique sinon.
    const params = new URLSearchParams({ page: String(page), limit: String(itemsPerPage) })
    if (search.trim()) params.append('search', search.trim())

    const { data, error } = await secureApiRequest<{
      items: ConstructionType[]
      page: number
      totalPages: number
    } | ConstructionType[] | null>(`/api/construction-types?${params.toString()}`)

    let list: ConstructionType[] = constructionTypes.map(ct => ({
      id: ct.code,
      name: ct.name,
      description: ct.description,
      code: ct.code,
    }))

    if (!error && data) {
      if (Array.isArray(data)) {
        list = data
        setTotalPages(1)
        setCurrentPage(1)
      } else if (Array.isArray(data.items)) {
        list = data.items
        setTotalPages(data.totalPages ?? 1)
        setCurrentPage(data.page ?? 1)
      }
    } else {
      // Fallback filtre local sur la liste statique
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(it =>
          it.name.toLowerCase().includes(q) ||
          it.code.toLowerCase().includes(q) ||
          (it.description && it.description.toLowerCase().includes(q))
        )
      }
      setTotalPages(1)
      setCurrentPage(1)
    }

    setItems(list)
  }, [currentPage, itemsPerPage, searchTerm])

  useEffect(() => {
    load(currentPage)
  }, [currentPage, load])

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1)
      load(1, searchTerm)
    }, 300)
    return () => clearTimeout(t)
  }, [searchTerm, load])

  async function save() {
    if (!form.name.trim()) return

    const payload = {
      code: form.code,
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
    }

    if (form.id) {
      await mutate(`/api/construction-types/${form.id}`, payload, { method: 'PUT' })
    } else {
      await mutate('/api/construction-types', payload, { method: 'POST' })
    }

    setOpen(false)
    resetForm()
    load(currentPage)
  }

  async function deleteItem(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type de construction ?')) return
    await mutate(`/api/construction-types/${id}`, undefined, { method: 'DELETE' })
    load(currentPage)
  }

  function resetForm() {
    setForm({
      id: '',
      name: '',
      description: '',
      code: 'CUSTOM_BUILD'
    })
  }

  function openEdit(item: ConstructionType) {
    setForm(item)
    setOpen(true)
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Types de Construction</h1>
              <p className="text-gray-600">Gestion des types de construction disponibles</p>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Rechercher par nom, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button onClick={openCreate} className="header-red text-white">
                Nouveau Type
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Types de construction ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">Code: {item.code}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteItem(item.id)}
                      disabled={mutLoading}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun type de construction trouvé
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? 'Modifier' : 'Nouveau'} type de construction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <Select value={form.code} onValueChange={(value) => setForm({ ...form, code: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {constructionTypes.map((type) => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom du type de construction"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description du type de construction"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={save} className="header-red text-white" disabled={mutLoading}>
                {mutLoading ? 'Enregistrement...' : (form.id ? 'Modifier' : 'Créer')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
