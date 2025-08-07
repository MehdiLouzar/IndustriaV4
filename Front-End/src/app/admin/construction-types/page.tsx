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
  const router = useRouter()
  const [items, setItems] = useState<ConstructionType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ConstructionType>({
    id: '',
    name: '',
    description: '',
    code: 'CUSTOM_BUILD'
  })

  async function load(page = currentPage) {
    // Simulate API call - in real scenario would be: /api/construction-types
    const simulated = constructionTypes.map((ct, index) => ({
      id: ct.code,
      name: ct.name,
      description: ct.description,
      code: ct.code
    }))
    setItems(simulated)
    setTotalPages(1)
    setCurrentPage(1)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, router])

  async function save() {
    if (!form.name.trim()) return
    
    console.log('Saving construction type:', form)
    // In real scenario: await fetchApi('/api/construction-types', { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) })
    
    setOpen(false)
    resetForm()
    load()
  }

  async function deleteItem(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type de construction ?')) return
    
    console.log('Deleting construction type:', id)
    // In real scenario: await fetchApi(`/api/construction-types/${id}`, { method: 'DELETE' })
    
    load()
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Types de Construction</h1>
              <p className="text-gray-600">Gestion des types de construction disponibles</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={openCreate} className="header-red text-white">
                Nouveau Type
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Liste */}
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

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
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
              <Button onClick={save} className="header-red text-white">
                {form.id ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}