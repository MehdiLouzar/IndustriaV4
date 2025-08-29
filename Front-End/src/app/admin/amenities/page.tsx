'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Pagination from '@/components/Pagination'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import type { ListResponse } from '@/types'

import { useSecureApi, useSecureMutation } from '@/hooks/use-api'
import { secureApiRequest } from '@/lib/auth-actions'

interface Amenity {
  id: string
  name: string
  description?: string
  icon?: string
  category?: string
}

export default function AmenitiesAdmin() {
  const router = useRouter()
  const [selectedAmenityId, setSelectedAmenityId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Amenity>({
    id: '',
    name: '',
    description: '',
    icon: '',
    category: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Build URL for list
  const listUrl = (() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
    })
    if (debouncedSearch) params.append('search', debouncedSearch)
    return `/api/amenities?${params.toString()}`
  })()

  // Main list (protected)
  const {
    data: listRes,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useSecureApi<ListResponse<Amenity>>(listUrl)

  const items = Array.isArray(listRes?.items) ? listRes!.items : []
  useEffect(() => {
    if (listRes?.totalPages) setTotalPages(listRes.totalPages)
  }, [listRes?.totalPages])

  // All amenities for select (protected)
  const { data: allData } = useSecureApi<ListResponse<Amenity>>('/api/amenities/all')
  const allAmenities = Array.isArray(allData?.items)
    ? allData!.items
    : Array.isArray(allData)
      ? (allData as unknown as Amenity[])
      : []

  // Mutations
  const { mutate, loading: mutLoading } = useSecureMutation()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  // Validation with uniqueness check via secureApiRequest
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = 'Le nom de l\'équipement est obligatoire'
    } else if (form.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    } else if (form.name.length > 100) {
      newErrors.name = 'Le nom ne peut pas dépasser 100 caractères'
    }

    if (form.description && form.description.length < 5) {
      newErrors.description = 'La description doit contenir au moins 5 caractères'
    } else if (form.description && form.description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères'
    }

    if (form.icon && form.icon.length > 50) {
      newErrors.icon = 'L\'icône ne peut pas dépasser 50 caractères'
    }

    if (form.category && form.category.length < 2) {
      newErrors.category = 'La catégorie doit contenir au moins 2 caractères'
    } else if (form.category && form.category.length > 50) {
      newErrors.category = 'La catégorie ne peut pas dépasser 50 caractères'
    }

    if (!form.id && form.name.trim()) {
      const { data, error } = await secureApiRequest<{ exists: boolean }>(
        `/api/amenities/check-name?name=${encodeURIComponent(form.name.trim())}`
      )
      if (!error && data?.exists) {
        newErrors.name = 'Un équipement avec ce nom existe déjà'
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

      const body = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        icon: form.icon?.trim() || undefined,
        category: form.category?.trim() || undefined,
      }

      if (form.id) {
        await mutate(`/api/amenities/${form.id}`, body, { method: 'PUT' })
      } else {
        await mutate('/api/amenities', body, { method: 'POST' })
      }

      setForm({ id: '', name: '', description: '', icon: '', category: '' })
      setErrors({})
      setOpen(false)
      await refetchList()
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function edit(it: Amenity) {
    setForm({
      id: it.id,
      name: it.name,
      description: it.description ?? '',
      icon: it.icon ?? '',
      category: it.category ?? '',
    })
    setOpen(true)
  }

  async function del(id: string) {
    await mutate(`/api/amenities/${id}`, undefined, { method: 'DELETE' })
    await refetchList()
  }

  function addNew() {
    setForm({ id: '', name: '', description: '', icon: '', category: '' })
    setErrors({})
    setOpen(true)
  }

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Équipements</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par nom, catégorie..."
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
                <th className="p-2">Catégorie</th>
                <th className="p-2">Icône</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{a.name}</td>
                  <td className="p-2 align-top">{a.category}</td>
                  <td className="p-2 align-top">{a.icon}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(a)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={a.name}
                      onConfirm={() => del(a.id)}
                      description={`Êtes-vous sûr de vouloir supprimer l'équipement "${a.name}" ? Cette action est irréversible et supprimera toutes les associations avec les zones.`}
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
            <DialogTitle>{form.id ? 'Modifier' : 'Nouvel équipement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}

            <div>
              <Label htmlFor="name">Nom de l'équipement *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Ex: Parking, Station électrique, Wi-Fi, Restaurant"
                maxLength={100}
              />
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
              <p className="text-xs text-gray-500 mt-1">
                {form.name.length}/100 caractères
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                className={errors.description ? 'border-red-500' : ''}
                placeholder="Description détaillée de l'équipement (optionnel)"
                maxLength={500}
              />
              {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description}</span>}
              <p className="text-xs text-gray-500 mt-1">
                {(form.description || '').length}/500 caractères
              </p>
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                name="category"
                value={form.category || ''}
                onChange={handleChange}
                className={errors.category ? 'border-red-500' : ''}
                placeholder="Ex: Transport, Énergie, Communication, Restauration"
                maxLength={50}
              />
              {errors.category && <span className="text-red-500 text-sm mt-1">{errors.category}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Catégorie pour regrouper les équipements similaires
              </p>
            </div>

            <div>
              <Label htmlFor="icon">Icône</Label>
              <Input
                id="icon"
                name="icon"
                value={form.icon || ''}
                onChange={handleChange}
                className={errors.icon ? 'border-red-500' : ''}
                placeholder="Ex: 🚗, ⚡, 📶, 🍽️ ou nom d'icône CSS"
                maxLength={50}
              />
              {errors.icon && <span className="text-red-500 text-sm mt-1">{errors.icon}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Emoji ou nom d'icône pour représenter l'équipement
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
                disabled={isSubmitting || mutLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || mutLoading}
                className="flex-1"
              >
                {isSubmitting || mutLoading ? 'Enregistrement...' : (form.id ? 'Mettre à jour' : 'Créer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
