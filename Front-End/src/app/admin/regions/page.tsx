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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

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
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [allCountries, setAllCountries] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<Region>({ id: '', name: '', code: '', countryId: '' })
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
    
    const response = await fetchApi<ListResponse<Region>>(
      `/api/regions?${params.toString()}`
    ).catch(() => null)
    
    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else if (Array.isArray(response)) {
      setItems(response as Region[])
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
    fetchApi<{ id: string; name: string }[]>(
      '/api/countries/all',
      { credentials: 'include' }
    ).then(setAllCountries)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCountry = (value: string) => {
    setForm({ ...form, countryId: value })
    
    // Effacer l'erreur pour le pays lors de la sélection
    if (errors.countryId) {
      setErrors(prev => ({ ...prev, countryId: '' }))
    }
  }

  // Fonction de validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validation du nom (obligatoire)
    if (!form.name.trim()) {
      newErrors.name = 'Le nom de la région est obligatoire'
    } else if (form.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    } else if (form.name.length > 100) {
      newErrors.name = 'Le nom ne peut pas dépasser 100 caractères'
    }
    
    // Validation du code (obligatoire)
    if (!form.code.trim()) {
      newErrors.code = 'Le code de la région est obligatoire'
    } else if (form.code.length < 2) {
      newErrors.code = 'Le code doit contenir au moins 2 caractères'
    } else if (form.code.length > 10) {
      newErrors.code = 'Le code ne peut pas dépasser 10 caractères'
    } else if (!/^[A-Z0-9-_]+$/i.test(form.code)) {
      newErrors.code = 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores'
    }
    
    // Validation du pays (obligatoire)
    if (!form.countryId) {
      newErrors.countryId = 'La sélection d\'un pays est obligatoire'
    }
    
    // Vérification d'unicité du nom (si nouvelle région)
    if (!form.id && form.name.trim()) {
      try {
        const response = await fetchApi(`/api/regions/check-name?name=${encodeURIComponent(form.name.trim())}`)
        if (response && response.exists) {
          newErrors.name = 'Une région avec ce nom existe déjà'
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification d\'unicité du nom:', error)
      }
    }
    
    // Vérification d'unicité du code (si nouvelle région)
    if (!form.id && form.code.trim()) {
      try {
        const response = await fetchApi(`/api/regions/check-code?code=${encodeURIComponent(form.code.trim())}`)
        if (response && response.exists) {
          newErrors.code = 'Une région avec ce code existe déjà'
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification d\'unicité du code:', error)
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    
    setIsSubmitting(true)
    
    try {
      // Validation du formulaire
      const isValid = await validateForm()
      if (!isValid) {
        setIsSubmitting(false)
        return
      }
      
      const body = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        countryId: form.countryId
      }
      
      if (form.id) {
        await fetchApi(`/api/regions/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      } else {
        await fetchApi('/api/regions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      }
      
      setForm({ id: '', name: '', code: '', countryId: '' })
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

  function edit(it: Region) {
    setForm(it)
    setOpen(true)
  }

  async function del(id: string) {
    await fetchApi(`/api/regions/${id}`, { method: 'DELETE' })
    load(currentPage)
  }

  function addNew() {
    setForm({ id: '', name: '', code: '', countryId: '' })
    setErrors({})
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Gestion des Régions</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par nom, code..."
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
                <th className="p-2">Code</th>
                <th className="p-2">Pays</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{r.name}</td>
                  <td className="p-2 align-top">{r.code}</td>
                  <td className="p-2 align-top">{r.countryId}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(r)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={r.name}
                      onConfirm={() => del(r.id)}
                      description={`Êtes-vous sûr de vouloir supprimer la région "${r.name}" ? Cette action est irréversible et supprimera toutes les zones associées.`}
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
            <DialogTitle>{form.id ? 'Modifier une région' : 'Nouvelle région'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}
            
            <div>
              <Label htmlFor="name">Nom de la région *</Label>
              <Input 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Ex: Casablanca-Settat, Rabat-Salé-Kénitra"
                maxLength={100}
              />
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
              <p className="text-xs text-gray-500 mt-1">
                {form.name.length}/100 caractères
              </p>
            </div>
            
            <div>
              <Label htmlFor="code">Code de la région *</Label>
              <Input 
                id="code" 
                name="code" 
                value={form.code} 
                onChange={handleChange} 
                required 
                className={errors.code ? 'border-red-500' : ''}
                placeholder="Ex: CS, RSK, FES (lettres, chiffres, - et _ uniquement)"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.code && <span className="text-red-500 text-sm mt-1">{errors.code}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Code court unique pour identifier la région
              </p>
            </div>
            
            <div>
              <Label htmlFor="countryId">Pays *</Label>
              <Select value={form.countryId || undefined} onValueChange={handleCountry}>
                <SelectTrigger className={errors.countryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="-- Sélectionnez un pays --" />
                </SelectTrigger>
                <SelectContent>
                  {allCountries.length === 0 ? (
                    <SelectItem value="NO_COUNTRIES" disabled>
                      Aucun pays disponible
                    </SelectItem>
                  ) : (
                    allCountries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.countryId && <span className="text-red-500 text-sm mt-1">{errors.countryId}</span>}
              {allCountries.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Chargement des pays...
                </p>
              )}
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
              <Button 
                type="submit"
                disabled={isSubmitting || allCountries.length === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Enregistrement...' : (form.id ? 'Mettre à jour' : 'Créer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}