'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Pagination from '@/components/Pagination'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import type { ListResponse } from '@/types'

// Use both helpers: public reads via fetchPublicApi, writes via secureApiRequest
import { fetchPublicApi } from '@/lib/utils'
import { secureApiRequest , checkAuth } from '@/lib/auth-actions'

interface ZoneType {
  id: string
  name: string
}

export default function ZoneTypesAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<ZoneType[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ZoneType>({ id: '', name: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    if (search.trim()) {
      params.append('search', search.trim())
    }

    // PUBLIC READ
    const response = await fetchPublicApi<ListResponse<ZoneType>>(
      `/api/zone-types?${params.toString()}`
    ).catch(() => null)

    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else if (Array.isArray(response)) {
      setItems(response as unknown as ZoneType[])
      setTotalPages(1)
      setCurrentPage(1)
    } else {
      setItems([])
      setTotalPages(1)
      setCurrentPage(1)
    }
  }, [currentPage, itemsPerPage, searchTerm])

  useEffect(() => {
  const verifyAuth = async () => {
    const { isAuthenticated } = await checkAuth()
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    load(currentPage)
  }
  verifyAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentPage, router])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      load(1, searchTerm)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, load])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = async () => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = 'Le nom du type de zone est obligatoire'
    } else if (form.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    } else if (form.name.length > 100) {
      newErrors.name = 'Le nom ne peut pas dépasser 100 caractères'
    }

    // Check name uniqueness with secure API
    if (!form.id && form.name.trim()) {
      const { data: response, error } = await secureApiRequest<{ exists: boolean }>(
        `/api/zone-types/check-name?name=${encodeURIComponent(form.name.trim())}`
      )
      if (error) {
        console.warn("Erreur lors de la vérification d'unicité du nom:", error)
      } else if (response && response.exists) {
        newErrors.name = 'Un type de zone avec ce nom existe déjà'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const isValid = await validateForm()
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      const body = { name: form.name.trim() }

      // AUTHENTICATED WRITES
      if (form.id) {
        const { error } = await secureApiRequest(`/api/zone-types/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error updating zone type')
        }
      } else {
        const { error } = await secureApiRequest('/api/zone-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error creating zone type')
        }
      }

      setForm({ id: '', name: '' })
      setErrors({})
      setOpen(false)
      load(currentPage)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function edit(it: ZoneType) {
    setForm(it)
    setOpen(true)
  }

  async function del(id: string) {
    // AUTHENTICATED DELETE
    const { error } = await secureApiRequest(`/api/zone-types/${id}`, { method: 'DELETE' })
    if (error) {
      console.error('Error deleting zone type:', error)
    } else {
      load(currentPage)
    }
  }

  function addNew() {
    setForm({ id: '', name: '' })
    setErrors({})
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Types de zone</h1>
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
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{t.name}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(t)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={t.name}
                      onConfirm={() => del(t.id)}
                      description={`Êtes-vous sûr de vouloir supprimer le type de zone "${t.name}" ? Cette action est irréversible et supprimera toutes les zones de ce type.`}
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
            <DialogTitle>{form.id ? 'Modifier' : 'Nouveau type'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}

            <div>
              <Label htmlFor="name">Nom du type de zone *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Ex: Zone industrielle, Zone logistique, Zone mixte"
                maxLength={100}
              />
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
              <p className="text-xs text-gray-500 mt-1">
                {form.name.length}/100 caractères - Nom descriptif du type de zone
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setErrors({})
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Enregistrement...' : (form.id ? 'Mettre à jour' : 'Créer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
