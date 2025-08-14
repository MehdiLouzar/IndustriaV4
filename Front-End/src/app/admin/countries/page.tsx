'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { fetchApi } from '@/lib/utils'
import Pagination from '@/components/Pagination'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import type { ListResponse } from '@/types'

interface Country {
  id: string
  name: string
  code: string
  currency?: string
  defaultSrid?: number
  spatialReferenceSystemName?: string
}

export default function CountriesAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Country[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Country>({ 
    id: '', 
    name: '', 
    code: '', 
    currency: '', 
    defaultSrid: undefined, 
    spatialReferenceSystemName: '' 
  })
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
    
    const res = await fetchApi<ListResponse<Country>>(
      `/api/countries?${params.toString()}`
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
  
  useEffect(() => { load(currentPage) }, [currentPage, load])
  

  // Effet pour la recherche
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
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Fonction de validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validation du nom (obligatoire)
    if (!form.name.trim()) {
      newErrors.name = 'Le nom du pays est obligatoire'
    } else if (form.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    } else if (form.name.length > 100) {
      newErrors.name = 'Le nom ne peut pas dépasser 100 caractères'
    }
    
    // Validation du code (obligatoire)
    if (!form.code.trim()) {
      newErrors.code = 'Le code du pays est obligatoire'
    } else if (form.code.length < 2) {
      newErrors.code = 'Le code doit contenir au moins 2 caractères'
    } else if (form.code.length > 5) {
      newErrors.code = 'Le code ne peut pas dépasser 5 caractères'
    } else if (!/^[A-Z]{2,3}$/.test(form.code.toUpperCase())) {
      newErrors.code = 'Le code doit contenir uniquement 2 ou 3 lettres (ex: MA, FR, USA)'
    }
    
    // Vérification d'unicité du nom (si nouveau pays)
    if (!form.id && form.name.trim()) {
      try {
        const response = await fetchApi(`/api/countries/check-name?name=${encodeURIComponent(form.name.trim())}`)
        if (response && response.exists) {
          newErrors.name = 'Un pays avec ce nom existe déjà'
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification d\'unicité du nom:', error)
      }
    }
    
    // Vérification d'unicité du code (si nouveau pays)
    if (!form.id && form.code.trim()) {
      try {
        const response = await fetchApi(`/api/countries/check-code?code=${encodeURIComponent(form.code.trim().toUpperCase())}`)
        if (response && response.exists) {
          newErrors.code = 'Un pays avec ce code existe déjà'
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
        currency: form.currency?.trim() || null,
        defaultSrid: form.defaultSrid || null,
        spatialReferenceSystemName: form.spatialReferenceSystemName?.trim() || null
      }
      
      if (form.id) {
        await fetchApi(`/api/countries/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      } else {
        await fetchApi('/api/countries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      }
      
      setForm({ 
        id: '', 
        name: '', 
        code: '', 
        currency: '', 
        defaultSrid: undefined, 
        spatialReferenceSystemName: '' 
      })
      setErrors({})
      setOpen(false)
      load()
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function edit(it: Country) {
    setForm(it)
    setOpen(true)
  }

  async function del(id: string) {
    await fetchApi(`/api/countries/${id}`, { method: 'DELETE' })
    load()
  }

  function addNew() {
    setForm({ 
      id: '', 
      name: '', 
      code: '', 
      currency: '', 
      defaultSrid: undefined, 
      spatialReferenceSystemName: '' 
    })
    setErrors({})
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Gestion des Pays</h1>
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
                <th className="p-2">Monnaie</th>
                <th className="p-2">Système Coord.</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : [])
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{c.name}</td>
                  <td className="p-2 align-top">{c.code}</td>
                  <td className="p-2 align-top">{c.currency || '-'}</td>
                  <td className="p-2 align-top">
                    <div className="text-xs">
                      {c.spatialReferenceSystemName || c.defaultSrid ? (
                        <div>
                          {c.spatialReferenceSystemName && (
                            <div className="font-medium">{c.spatialReferenceSystemName}</div>
                          )}
                          {c.defaultSrid && (
                            <div className="text-gray-500">SRID: {c.defaultSrid}</div>
                          )}
                        </div>
                      ) : '-'}
                    </div>
                  </td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(c)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={c.name}
                      onConfirm={() => del(c.id)}
                      description={`Êtes-vous sûr de vouloir supprimer le pays "${c.name}" ? Cette action est irréversible et supprimera toutes les associations existantes.`}
                    />
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
            <DialogTitle>{form.id ? 'Modifier un pays' : 'Nouveau pays'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}
            
            <div>
              <Label htmlFor="name">Nom du pays *</Label>
              <Input 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Ex: Maroc, France, États-Unis"
                maxLength={100}
              />
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
              <p className="text-xs text-gray-500 mt-1">
                {form.name.length}/100 caractères
              </p>
            </div>
            
            <div>
              <Label htmlFor="code">Code pays (ISO) *</Label>
              <Input 
                id="code" 
                name="code" 
                value={form.code} 
                onChange={handleChange} 
                required 
                className={errors.code ? 'border-red-500' : ''}
                placeholder="Ex: MA, FR, USA (2-3 lettres)"
                maxLength={3}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.code && <span className="text-red-500 text-sm mt-1">{errors.code}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Code ISO standard à 2 ou 3 lettres (sera converti en majuscules)
              </p>
            </div>
            
            <div>
              <Label htmlFor="currency">Monnaie</Label>
              <Input 
                id="currency" 
                name="currency" 
                value={form.currency || ''} 
                onChange={handleChange} 
                className={errors.currency ? 'border-red-500' : ''}
                placeholder="Ex: MAD, EUR, USD"
                maxLength={3}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.currency && <span className="text-red-500 text-sm mt-1">{errors.currency}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Code ISO de la monnaie (optionnel)
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spatialReferenceSystemName">Système de coordonnées</Label>
                <Input 
                  id="spatialReferenceSystemName" 
                  name="spatialReferenceSystemName" 
                  value={form.spatialReferenceSystemName || ''} 
                  onChange={handleChange} 
                  className={errors.spatialReferenceSystemName ? 'border-red-500' : ''}
                  placeholder="Ex: Lambert 93, WGS84, UTM Zone 31N"
                  maxLength={100}
                />
                {errors.spatialReferenceSystemName && (
                  <span className="text-red-500 text-sm mt-1">{errors.spatialReferenceSystemName}</span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Nom du système de projection utilisé (optionnel)
                </p>
              </div>
              
              <div>
                <Label htmlFor="defaultSrid">SRID (Code EPSG)</Label>
                <Input 
                  id="defaultSrid" 
                  name="defaultSrid" 
                  type="number"
                  value={form.defaultSrid || ''} 
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined
                    setForm(prev => ({ ...prev, defaultSrid: value }))
                  }} 
                  className={errors.defaultSrid ? 'border-red-500' : ''}
                  placeholder="Ex: 4326, 2154, 26191"
                  min="1"
                  max="99999"
                />
                {errors.defaultSrid && (
                  <span className="text-red-500 text-sm mt-1">{errors.defaultSrid}</span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Code EPSG du système (optionnel)
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOpen(false)
                  setErrors({})
                  setForm({ 
                    id: '', 
                    name: '', 
                    code: '', 
                    currency: '', 
                    defaultSrid: undefined, 
                    spatialReferenceSystemName: '' 
                  })
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
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
