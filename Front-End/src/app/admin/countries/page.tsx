'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { secureApiRequest } from '@/lib/auth-actions'
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

interface SpatialReferenceSystem {
  id: string
  name: string
  srid: number
  proj4text: string
  description?: string
  createdAt?: string
  updatedAt?: string
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
  const [activeTab, setActiveTab] = useState('countries')

  // États pour les systèmes de référence spatiale
  const [srsItems, setSrsItems] = useState<SpatialReferenceSystem[]>([])
  const [srsCurrentPage, setSrsCurrentPage] = useState(1)
  const [srsTotalPages, setSrsTotalPages] = useState(1)
  const [srsSearchTerm, setSrsSearchTerm] = useState('')
  const [srsOpen, setSrsOpen] = useState(false)
  const [srsForm, setSrsForm] = useState<SpatialReferenceSystem>({ 
    id: '', 
    name: '', 
    srid: 0, 
    proj4text: '',
    description: ''
  })
  const [srsErrors, setSrsErrors] = useState<Record<string, string>>({})
  const [srsIsSubmitting, setSrsIsSubmitting] = useState(false)
  const [availableSrs, setAvailableSrs] = useState<SpatialReferenceSystem[]>([])

  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const { data: res, error } = await secureApiRequest<ListResponse<Country>>(
      `/api/countries?${params.toString()}`
    )
    
    if (error) {
      console.error('Error loading countries:', error)
      setItems([])
      return
    }
    if (res) {
      const arr = Array.isArray(res.items) ? res.items : []
      setItems(arr)
      setTotalPages(res.totalPages || 1)
      setCurrentPage(res.page || 1)
    } else {
      setItems([])
    }
  }, [currentPage, itemsPerPage, searchTerm])

  // Fonction de chargement des systèmes de référence spatiale
  const loadSrs = useCallback(async (page = srsCurrentPage, search = srsSearchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const { data: res, error } = await secureApiRequest<ListResponse<SpatialReferenceSystem>>(
      `/api/spatial-reference-systems?${params.toString()}`
    )
    
    if (error) {
      console.error('Error loading spatial reference systems:', error)
      setSrsItems([])
      return
    }
    if (res) {
      const arr = Array.isArray(res.items) ? res.items : []
      setSrsItems(arr)
      setSrsTotalPages(res.totalPages || 1)
      setSrsCurrentPage(res.page || 1)
    } else {
      setSrsItems([])
    }
  }, [srsCurrentPage, itemsPerPage, srsSearchTerm])

  // Charger tous les SRS disponibles pour le dropdown
  const loadAvailableSrs = useCallback(async () => {
    const { data: res, error } = await secureApiRequest<SpatialReferenceSystem[]>('/api/spatial-reference-systems/all')
    if (error) {
      console.error('Erreur chargement SRS:', error)
      setAvailableSrs([])
    } else {
      setAvailableSrs(Array.isArray(res) ? res : [])
    }
  }, [])
  
  useEffect(() => { 
    load(currentPage) 
    loadAvailableSrs()
  }, [currentPage, load, loadAvailableSrs])
  
  useEffect(() => { 
    if (activeTab === 'srs') {
      loadSrs(srsCurrentPage) 
    }
  }, [srsCurrentPage, loadSrs, activeTab])

  // Effet pour la recherche des pays
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      load(1, searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, load])

  // Effet pour la recherche des SRS
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSrsCurrentPage(1)
      loadSrs(1, srsSearchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [srsSearchTerm, loadSrs])

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
      const { data: response, error } = await secureApiRequest(`/api/countries/check-name?name=${encodeURIComponent(form.name.trim())}`)
      if (error) {
        console.warn('Erreur lors de la vérification d\'unicité du nom:', error)
      } else if (response && response.exists) {
        newErrors.name = 'Un pays avec ce nom existe déjà'
      }
    }
    
    // Vérification d'unicité du code (si nouveau pays)
    if (!form.id && form.code.trim()) {
      const { data: response, error } = await secureApiRequest(`/api/countries/check-code?code=${encodeURIComponent(form.code.trim().toUpperCase())}`)
      if (error) {
        console.warn('Erreur lors de la vérification d\'unicité du code:', error)
      } else if (response && response.exists) {
        newErrors.code = 'Un pays avec ce code existe déjà'
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
        const { error } = await secureApiRequest(`/api/countries/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error updating country')
        }
      } else {
        const { error } = await secureApiRequest('/api/countries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error creating country')
        }
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
    const { error } = await secureApiRequest(`/api/countries/${id}`, { method: 'DELETE' })
    if (error) {
      console.error('Error deleting country:', error)
    } else {
      load()
    }
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

  // Handlers pour les systèmes de référence spatiale
  const handleSrsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'srid') {
      setSrsForm({ ...srsForm, srid: value ? parseInt(value) : 0 })
    } else {
      setSrsForm({ ...srsForm, [name]: value })
    }
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (srsErrors[name]) {
      setSrsErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validation pour les SRS
  const validateSrsForm = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validation du nom (obligatoire)
    if (!srsForm.name.trim()) {
      newErrors.name = 'Le nom du système est obligatoire'
    } else if (srsForm.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    }
    
    // Validation du SRID (obligatoire)
    if (!srsForm.srid || srsForm.srid <= 0) {
      newErrors.srid = 'Le SRID doit être un nombre positif'
    }
    
    // Validation du proj4text (obligatoire)
    if (!srsForm.proj4text.trim()) {
      newErrors.proj4text = 'La chaîne Proj4 est obligatoire'
    }
    
    // Vérification d'unicité du nom (si nouveau SRS)
    if (!srsForm.id && srsForm.name.trim()) {
      const { data: response, error } = await secureApiRequest(`/api/spatial-reference-systems/check-name?name=${encodeURIComponent(srsForm.name.trim())}`)
      if (error) {
        console.warn('Erreur lors de la vérification d\'unicité du nom:', error)
      } else if (response && response.exists) {
        newErrors.name = 'Un système avec ce nom existe déjà'
      }
    }
    
    // Vérification d'unicité du SRID (si nouveau SRS)
    if (!srsForm.id && srsForm.srid) {
      const { data: response, error } = await secureApiRequest(`/api/spatial-reference-systems/check-srid?srid=${srsForm.srid}`)
      if (error) {
        console.warn('Erreur lors de la vérification d\'unicité du SRID:', error)
      } else if (response && response.exists) {
        newErrors.srid = 'Un système avec ce SRID existe déjà'
      }
    }
    
    setSrsErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function submitSrs(e: React.FormEvent) {
    e.preventDefault()
    
    setSrsIsSubmitting(true)
    
    try {
      // Validation du formulaire
      const isValid = await validateSrsForm()
      if (!isValid) {
        setSrsIsSubmitting(false)
        return
      }
      
      const body = {
        name: srsForm.name.trim(),
        srid: srsForm.srid,
        proj4text: srsForm.proj4text.trim(),
        description: srsForm.description?.trim() || null
      }
      
      if (srsForm.id) {
        const { error } = await secureApiRequest(`/api/spatial-reference-systems/${srsForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error updating spatial reference system')
        }
      } else {
        const { error } = await secureApiRequest('/api/spatial-reference-systems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error creating spatial reference system')
        }
      }
      
      setSrsForm({ 
        id: '', 
        name: '', 
        srid: 0, 
        proj4text: '',
        description: ''
      })
      setSrsErrors({})
      setSrsOpen(false)
      loadSrs()
      loadAvailableSrs() // Recharger pour les dropdowns
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setSrsErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' })
    } finally {
      setSrsIsSubmitting(false)
    }
  }

  function editSrs(it: SpatialReferenceSystem) {
    setSrsForm(it)
    setSrsOpen(true)
  }

  async function deleteSrs(id: string) {
    const { error } = await secureApiRequest(`/api/spatial-reference-systems/${id}`, { method: 'DELETE' })
    if (error) {
      console.error('Error deleting spatial reference system:', error)
    } else {
      loadSrs()
      loadAvailableSrs() // Recharger pour les dropdowns
    }
  }

  function addNewSrs() {
    setSrsForm({ 
      id: '', 
      name: '', 
      srid: 0, 
      proj4text: '',
      description: ''
    })
    setSrsErrors({})
    setSrsOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Gestion des Pays et Systèmes de Coordonnées</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="countries">Pays</TabsTrigger>
          <TabsTrigger value="srs">Systèmes de Coordonnées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="countries" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-lg font-semibold">Liste des Pays</h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher par nom, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button onClick={addNew}>Ajouter un pays</Button>
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
        </TabsContent>
        
        <TabsContent value="srs" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-lg font-semibold">Systèmes de Référence Spatiale</h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher par nom, SRID..."
                value={srsSearchTerm}
                onChange={(e) => setSrsSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button onClick={addNewSrs}>Ajouter un système</Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Nom</th>
                    <th className="p-2">SRID</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Proj4</th>
                    <th className="p-2 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(srsItems) ? srsItems : [])
                    .slice((srsCurrentPage - 1) * itemsPerPage, srsCurrentPage * itemsPerPage)
                    .map((srs) => (
                    <tr key={srs.id} className="border-b last:border-0">
                      <td className="p-2 align-top font-medium">{srs.name}</td>
                      <td className="p-2 align-top">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          EPSG:{srs.srid}
                        </span>
                      </td>
                      <td className="p-2 align-top max-w-xs">
                        <div className="truncate text-xs text-gray-600">
                          {srs.description || '-'}
                        </div>
                      </td>
                      <td className="p-2 align-top max-w-sm">
                        <div className="truncate text-xs font-mono text-gray-500">
                          {srs.proj4text}
                        </div>
                      </td>
                      <td className="p-2 space-x-2 whitespace-nowrap">
                        <Button size="sm" onClick={() => editSrs(srs)}>Éditer</Button>
                        <DeleteConfirmDialog
                          itemName={srs.name}
                          onConfirm={() => deleteSrs(srs.id)}
                          description={`Êtes-vous sûr de vouloir supprimer le système "${srs.name}" (EPSG:${srs.srid}) ? Cette action est irréversible et peut affecter les pays qui l'utilisent.`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Pagination
            totalItems={Array.isArray(srsItems) ? srsItems.length : 0}
            itemsPerPage={itemsPerPage}
            currentPage={srsCurrentPage}
            onPageChange={setSrsCurrentPage}
          />
        </TabsContent>
      </Tabs>

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
            
            <div>
              <Label htmlFor="srs-select">Système de référence spatiale</Label>
              <Select 
                value={form.defaultSrid?.toString() || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    setForm(prev => ({ 
                      ...prev, 
                      defaultSrid: undefined,
                      spatialReferenceSystemName: ''
                    }))
                  } else {
                    const selectedSrs = availableSrs.find(s => s.srid.toString() === value)
                    setForm(prev => ({ 
                      ...prev, 
                      defaultSrid: parseInt(value),
                      spatialReferenceSystemName: selectedSrs?.name || ''
                    }))
                  }
                }}
              >
                <SelectTrigger className={errors.defaultSrid ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un système de coordonnées (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun système sélectionné</SelectItem>
                  {availableSrs.map((srs) => (
                    <SelectItem key={srs.id} value={srs.srid.toString()}>
                      {srs.name} (EPSG:{srs.srid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.defaultSrid && (
                <span className="text-red-500 text-sm mt-1">{errors.defaultSrid}</span>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Système de coordonnées par défaut pour ce pays
              </p>
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

      <Dialog open={srsOpen} onOpenChange={setSrsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{srsForm.id ? 'Modifier un système de référence spatiale' : 'Nouveau système de référence spatiale'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitSrs} className="space-y-4">
            {srsErrors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {srsErrors.submit}
              </div>
            )}
            
            <div>
              <Label htmlFor="srs-name">Nom du système *</Label>
              <Input 
                id="srs-name" 
                name="name" 
                value={srsForm.name} 
                onChange={handleSrsChange} 
                required 
                className={srsErrors.name ? 'border-red-500' : ''}
                placeholder="Ex: Lambert 93, WGS 84, UTM Zone 31N"
                maxLength={100}
              />
              {srsErrors.name && <span className="text-red-500 text-sm mt-1">{srsErrors.name}</span>}
            </div>
            
            <div>
              <Label htmlFor="srs-srid">SRID (Code EPSG) *</Label>
              <Input 
                id="srs-srid" 
                name="srid" 
                type="number"
                value={srsForm.srid || ''} 
                onChange={handleSrsChange} 
                required 
                className={srsErrors.srid ? 'border-red-500' : ''}
                placeholder="Ex: 4326, 2154, 26191"
                min="1"
                max="99999"
              />
              {srsErrors.srid && <span className="text-red-500 text-sm mt-1">{srsErrors.srid}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Code EPSG unique pour ce système de coordonnées
              </p>
            </div>
            
            <div>
              <Label htmlFor="srs-proj4">Chaîne Proj4 *</Label>
              <Textarea 
                id="srs-proj4" 
                name="proj4text" 
                value={srsForm.proj4text} 
                onChange={handleSrsChange} 
                required 
                className={srsErrors.proj4text ? 'border-red-500' : ''}
                placeholder="Ex: +proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
                rows={3}
              />
              {srsErrors.proj4text && <span className="text-red-500 text-sm mt-1">{srsErrors.proj4text}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Définition complète de la projection en format Proj4
              </p>
            </div>
            
            <div>
              <Label htmlFor="srs-description">Description</Label>
              <Textarea 
                id="srs-description" 
                name="description" 
                value={srsForm.description || ''} 
                onChange={handleSrsChange} 
                className={srsErrors.description ? 'border-red-500' : ''}
                placeholder="Description détaillée du système de coordonnées"
                rows={2}
              />
              {srsErrors.description && <span className="text-red-500 text-sm mt-1">{srsErrors.description}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Description optionnelle du système et de ses usages
              </p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSrsOpen(false)
                  setSrsErrors({})
                  setSrsForm({ 
                    id: '', 
                    name: '', 
                    srid: 0, 
                    proj4text: '',
                    description: ''
                  })
                }}
                disabled={srsIsSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={srsIsSubmitting}
                className="flex-1"
              >
                {srsIsSubmitting ? 'Enregistrement...' : (srsForm.id ? 'Mettre à jour' : 'Créer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
