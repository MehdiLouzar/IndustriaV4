'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { secureApiRequest } from '@/lib/auth-actions'
import type { ListResponse } from '@/types'
import Pagination from '@/components/Pagination'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PARCEL_STATUSES, getEnumLabel, getEnumBadge } from '@/lib/translations'
import { 
  formatWGS84,
  createGoogleMapsLink,
  type WGS84Coordinate 
} from '@/lib/coordinates'

interface Vertex {
  seq: number
  lambertX: number
  lambertY: number
}

interface Parcel {
  id: string
  reference: string
  area?: number | null
  status: string
  isShowroom?: boolean | null
  zoneId: string
  vertices?: Vertex[]
  longitude?: number | null  // Coordonnées calculées côté backend
  latitude?: number | null   // Coordonnées calculées côté backend
  cos?: number | null        // Coefficient d'occupation du sol
  cus?: number | null        // Coefficient d'utilisation du sol
  heightLimit?: number | null // Limite de hauteur en mètres
  setback?: number | null     // Recul en mètres
}

interface ZoneDto {
  id: string
  name: string
}

interface ParcelForm {
  id: string
  reference: string
  area: string
  status: string
  isShowroom: boolean
  zoneId: string
  vertices: { lambertX: string; lambertY: string }[]
  cos: string        // Coefficient d'occupation du sol
  cus: string        // Coefficient d'utilisation du sol
  heightLimit: string // Limite de hauteur en mètres
  setback: string     // Recul en mètres
}

// Composant mémorisé pour les lignes de la table des parcelles
const ParcelTableRow = memo(({ 
  parcel, 
  getParcelCoordinates, 
  onEdit, 
  onDelete 
}: { 
  parcel: Parcel, 
  getParcelCoordinates: (parcel: Parcel) => any,
  onEdit: (parcel: Parcel) => void,
  onDelete: (id: string) => void
}) => {
  const coordinates = useMemo(() => getParcelCoordinates(parcel), [parcel, getParcelCoordinates])
  
  return (
    <tr key={parcel.id} className="border-b last:border-0">
      <td className="p-2 align-top">{parcel.reference}</td>
      <td className="p-2 align-top">{parcel.zoneId}</td>
      <td className="p-2 align-top">
        <Badge className={getEnumBadge(PARCEL_STATUSES, parcel.status).color}>
          {getEnumBadge(PARCEL_STATUSES, parcel.status).label}
        </Badge>
      </td>
      <td className="p-2 align-top">
        <div className="text-xs">
          {coordinates.wgs84 ? (
            <div className="space-y-1">
              <div className="font-mono">
                {coordinates.display}
              </div>
              <a
                href={createGoogleMapsLink(coordinates.wgs84)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                Voir sur Google Maps
              </a>
            </div>
          ) : (
            <span className="text-gray-500">{coordinates.display}</span>
          )}
        </div>
      </td>
      <td className="p-2 space-x-2 whitespace-nowrap">
        <Button size="sm" onClick={() => onEdit(parcel)}>Éditer</Button>
        <DeleteConfirmDialog
          itemName={parcel.reference}
          onConfirm={() => onDelete(parcel.id)}
          description={`Êtes-vous sûr de vouloir supprimer la parcelle "${parcel.reference}" ? Cette action est irréversible et supprimera tous les rendez-vous et images associés.`}
        />
      </td>
    </tr>
  )
})

ParcelTableRow.displayName = 'ParcelTableRow'

// Les statuts sont maintenant importés de translations.ts

export default function ParcelsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Parcel[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [zones, setZones] = useState<ZoneDto[]>([])
  const [form, setForm] = useState<ParcelForm>({
    id: '',
    reference: '',
    area: '',
    status: 'LIBRE',
    isShowroom: false,
    zoneId: '',
    vertices: [],
    cos: '',
    cus: '',
    heightLimit: '',
    setback: '',
  })
  const [images, setImages] = useState<{ file: File; url: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fonction pour récupérer les coordonnées pré-calculées d'une parcelle
  const getParcelCoordinates = useCallback((parcel: Parcel) => {
    if (!parcel.longitude || !parcel.latitude) {
      return {
        display: 'Aucune coordonnée',
        wgs84: null,
        lambert: null
      }
    }

    const wgs84 = {
      longitude: parcel.longitude,
      latitude: parcel.latitude
    }

    return {
      display: formatWGS84(wgs84),
      wgs84: wgs84,
      lambert: null // Plus besoin des coordonnées Lambert
    }
  }, [])

  const load = useCallback(async (page: number, search: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const { data: p, error } = await secureApiRequest<ListResponse<Parcel>>(
      `/api/parcels?${params.toString()}`
    )
    
    if (error) {
      console.error('Error loading parcels:', error)
      setItems([])
      return
    }
    if (p) {
      const arr = Array.isArray(p.items) ? p.items : []
      setItems(arr)
      setTotalPages(p.totalPages || 1)
      // Ne pas mettre à jour currentPage ici pour éviter les boucles
    } else {
      setItems([])
    }
  }, [itemsPerPage])

  // Effet principal pour charger les données
  useEffect(() => {
    load(currentPage, searchTerm)
  }, [currentPage, load, searchTerm])

  // Effet pour la recherche - retour à la page 1 avec debounce
  useEffect(() => {
    if (searchTerm === '') return // Pas de debounce si pas de recherche
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Force le retour à la page 1 lors d'une recherche
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])


  useEffect(() => {
    const loadZones = async () => {
      const { data, error } = await secureApiRequest<ZoneDto[]>("/api/zones/all")
      if (error) {
        console.error('Erreur lors du chargement des zones:', error)
        setZones([])
      } else {
        const arr = Array.isArray(data) ? data : []
        setZones(arr)
        console.log('Zones chargées:', arr.length)
      }
    }
    loadZones()
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [errors])

  const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }))
  }, [])

  const handleStatus = useCallback((value: string) => {
    setForm(prev => ({ ...prev, status: value }))
  }, [])

  const handleZone = useCallback((value: string) => {
    setForm(prev => ({ ...prev, zoneId: value }))
  }, [])

  const addVertex = useCallback(() => {
    setForm((f) => ({
      ...f,
      vertices: [...f.vertices, { lambertX: '', lambertY: '' }],
    }))
  }, [])

  const updateVertex = useCallback((
    index: number,
    field: 'lambertX' | 'lambertY',
    value: string
  ) => {
    setForm((f) => {
      const verts = [...f.vertices]
      verts[index] = { ...verts[index], [field]: value }
      return { ...f, vertices: verts }
    })
    
    // Effacer l'erreur pour ce vertex lors de la saisie
    const errorKey = `vertex_${index}_${field === 'lambertX' ? 'x' : 'y'}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }))
    }
  }, [errors])

  const removeVertex = useCallback((index: number) => {
    setForm((f) => {
      const verts = [...f.vertices]
      verts.splice(index, 1)
      return { ...f, vertices: verts }
    })
  }, [])

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setImages((imgs) => [...imgs, ...files])
    e.target.value = ''
  }, [])

  const removeImage = useCallback((idx: number) => {
    setImages((imgs) => {
      const copy = [...imgs]
      URL.revokeObjectURL(copy[idx].url)
      copy.splice(idx, 1)
      return copy
    })
  }, [])

  // Fonction de validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validation de la référence (obligatoire)
    if (!form.reference.trim()) {
      newErrors.reference = 'La référence de la parcelle est obligatoire'
    } else if (form.reference.length < 2) {
      newErrors.reference = 'La référence doit contenir au moins 2 caractères'
    }
    
    // Validation de la zone (obligatoire)
    if (!form.zoneId) {
      newErrors.zoneId = 'La sélection d\'une zone est obligatoire'
    }
    
    // Validation de la superficie (doit être positive si renseignée)
    if (form.area && (isNaN(parseFloat(form.area)) || parseFloat(form.area) <= 0)) {
      newErrors.area = 'La superficie doit être un nombre positif'
    }
    
    // Validation des coefficients (entre 0 et 10 si renseignés)
    if (form.cos && (isNaN(parseFloat(form.cos)) || parseFloat(form.cos) < 0 || parseFloat(form.cos) > 10)) {
      newErrors.cos = 'Le COS doit être un nombre entre 0 et 10'
    }
    
    if (form.cus && (isNaN(parseFloat(form.cus)) || parseFloat(form.cus) < 0 || parseFloat(form.cus) > 10)) {
      newErrors.cus = 'Le CUS doit être un nombre entre 0 et 10'
    }
    
    // Validation de la limite de hauteur (doit être positive si renseignée)
    if (form.heightLimit && (isNaN(parseFloat(form.heightLimit)) || parseFloat(form.heightLimit) <= 0)) {
      newErrors.heightLimit = 'La limite de hauteur doit être un nombre positif'
    }
    
    // Validation du recul (doit être positif si renseigné)
    if (form.setback && (isNaN(parseFloat(form.setback)) || parseFloat(form.setback) < 0)) {
      newErrors.setback = 'Le recul doit être un nombre positif ou zéro'
    }
    
    // Validation des coordonnées Lambert (si renseignées)
    form.vertices.forEach((vertex, index) => {
      if (vertex.lambertX && isNaN(parseFloat(vertex.lambertX))) {
        newErrors[`vertex_${index}_x`] = `Coordonnée X du point ${index + 1} invalide`
      }
      if (vertex.lambertY && isNaN(parseFloat(vertex.lambertY))) {
        newErrors[`vertex_${index}_y`] = `Coordonnée Y du point ${index + 1} invalide`
      }
    })
    
    // Vérification d'unicité de la référence (si nouvelle parcelle)
    if (!form.id && form.reference.trim()) {
      const { data: response, error } = await secureApiRequest(`/api/parcels/check-reference?reference=${encodeURIComponent(form.reference.trim())}`)
      if (error) {
        console.warn('Erreur lors de la vérification d\'unicité de la référence:', error)
      } else if (response && response.exists) {
        newErrors.reference = 'Une parcelle avec cette référence existe déjà'
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
        reference: form.reference.trim(),
        area: form.area ? parseFloat(form.area) : undefined,
        status: form.status,
        isShowroom: form.isShowroom,
        zoneId: form.zoneId,
        cos: form.cos ? parseFloat(form.cos) : undefined,
        cus: form.cus ? parseFloat(form.cus) : undefined,
        heightLimit: form.heightLimit ? parseFloat(form.heightLimit) : undefined,
        setback: form.setback ? parseFloat(form.setback) : undefined,
        vertices: form.vertices.map((v, i) => ({
          seq: i,
          lambertX: v.lambertX ? parseFloat(v.lambertX) : 0,
          lambertY: v.lambertY ? parseFloat(v.lambertY) : 0,
        })),
    }

      if (form.id) {
        const { error } = await secureApiRequest(`/api/parcels/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (error) {
          throw new Error('Error updating parcel')
        }
      } else {
        const { error } = await secureApiRequest('/api/parcels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (error) {
          throw new Error('Error creating parcel')
        }
      }

      setForm({
        id: '',
        reference: '',
        area: '',
        status: 'LIBRE',
        isShowroom: false,
        zoneId: '',
        vertices: [],
        cos: '',
        cus: '',
        heightLimit: '',
        setback: '',
      })
      setImages([])
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

  const handleEdit = useCallback((it: Parcel) => {
    setForm({
      id: it.id,
      reference: it.reference,
      area: it.area?.toString() ?? '',
      status: it.status,
      isShowroom: it.isShowroom ?? false,
      zoneId: it.zoneId,
      cos: it.cos?.toString() ?? '',
      cus: it.cus?.toString() ?? '',
      heightLimit: it.heightLimit?.toString() ?? '',
      setback: it.setback?.toString() ?? '',
      vertices: it.vertices ? it.vertices.sort((a,b)=>a.seq-b.seq).map(v => ({
        lambertX: v.lambertX.toString(),
        lambertY: v.lambertY.toString(),
      })) : [],
    })
    setImages([])
    setOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const { error } = await secureApiRequest(`/api/parcels/${id}`, { method: 'DELETE' })
    if (error) {
      console.error('Error deleting parcel:', error)
    } else {
      load(currentPage, searchTerm)
    }
  }, [load, currentPage, searchTerm])

  function addNew() {
    setForm({
      id: '',
      reference: '',
      area: '',
      status: 'LIBRE',
      isShowroom: false,
      zoneId: '',
      vertices: [],
      cos: '',
      cus: '',
      heightLimit: '',
      setback: '',
    })
    setImages([])
    setErrors({})
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Parcelles</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par référence..."
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
                <th className="p-2">Référence</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Coordonnées</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((parcel) => (
                <ParcelTableRow
                  key={parcel.id}
                  parcel={parcel}
                  getParcelCoordinates={getParcelCoordinates}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
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
            <DialogTitle>{form.id ? 'Modifier' : 'Nouvelle parcelle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}
            
            <div>
              <Label htmlFor="reference">Référence de la parcelle *</Label>
              <Input 
                id="reference" 
                name="reference" 
                value={form.reference} 
                onChange={handleChange} 
                required 
                className={errors.reference ? 'border-red-500' : ''}
                placeholder="Ex: P-001, LOT-A12"
              />
              {errors.reference && <span className="text-red-500 text-sm mt-1">{errors.reference}</span>}
            </div>
            <div>
              <Label htmlFor="area">Superficie (m²)</Label>
              <Input 
                id="area" 
                name="area" 
                type="number"
                min="0"
                step="0.01"
                value={form.area} 
                onChange={handleChange}
                className={errors.area ? 'border-red-500' : ''}
                placeholder="Ex: 2500"
              />
              {errors.area && <span className="text-red-500 text-sm mt-1">{errors.area}</span>}
            </div>
            
            {/* Contraintes techniques */}
            <div>
              <Label className="text-base font-semibold">Contraintes techniques</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="cos">COS (Coefficient d'occupation du sol)</Label>
                  <Input 
                    id="cos" 
                    name="cos" 
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={form.cos} 
                    onChange={handleChange} 
                    placeholder="Ex: 0.7"
                    className={errors.cos ? 'border-red-500' : ''}
                  />
                  {errors.cos && <span className="text-red-500 text-sm mt-1">{errors.cos}</span>}
                </div>
                <div>
                  <Label htmlFor="cus">CUS (Coefficient d'utilisation du sol)</Label>
                  <Input 
                    id="cus" 
                    name="cus" 
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={form.cus} 
                    onChange={handleChange} 
                    placeholder="Ex: 2.5"
                    className={errors.cus ? 'border-red-500' : ''}
                  />
                  {errors.cus && <span className="text-red-500 text-sm mt-1">{errors.cus}</span>}
                </div>
                <div>
                  <Label htmlFor="heightLimit">Limite de hauteur (m)</Label>
                  <Input 
                    id="heightLimit" 
                    name="heightLimit" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.heightLimit} 
                    onChange={handleChange} 
                    placeholder="Ex: 12"
                    className={errors.heightLimit ? 'border-red-500' : ''}
                  />
                  {errors.heightLimit && <span className="text-red-500 text-sm mt-1">{errors.heightLimit}</span>}
                </div>
                <div>
                  <Label htmlFor="setback">Recul (m)</Label>
                  <Input 
                    id="setback" 
                    name="setback" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.setback} 
                    onChange={handleChange} 
                    placeholder="Ex: 5"
                    className={errors.setback ? 'border-red-500' : ''}
                  />
                  {errors.setback && <span className="text-red-500 text-sm mt-1">{errors.setback}</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isShowroom" name="isShowroom" checked={form.isShowroom} onChange={handleToggle} />
              <Label htmlFor="isShowroom">Showroom</Label>
            </div>
            <div>
              <Label>Coordonnées Lambert (polygone)</Label>
              <div className="text-xs text-gray-600 mb-2">
                Les coordonnées GPS seront calculées automatiquement après sauvegarde
              </div>
              {(form.vertices ?? []).map((v, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 items-start mb-2">
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="X (Lambert)"
                      value={v.lambertX}
                      onChange={(e) => updateVertex(idx, 'lambertX', e.target.value)}
                      className={errors[`vertex_${idx}_x`] ? 'border-red-500' : ''}
                    />
                    {errors[`vertex_${idx}_x`] && <span className="text-red-500 text-sm">{errors[`vertex_${idx}_x`]}</span>}
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Y (Lambert)"
                        value={v.lambertY}
                        onChange={(e) => updateVertex(idx, 'lambertY', e.target.value)}
                        className={errors[`vertex_${idx}_y`] ? 'border-red-500' : ''}
                      />
                      {errors[`vertex_${idx}_y`] && <span className="text-red-500 text-sm">{errors[`vertex_${idx}_y`]}</span>}
                    </div>
                    <Button type="button" size="sm" variant="destructive" onClick={() => removeVertex(idx)}>
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" size="sm" onClick={addVertex}>Ajouter un point</Button>
            </div>
            <div>
              <Label htmlFor="zoneId">Zone industrielle *</Label>
              <Select value={form.zoneId || undefined} onValueChange={handleZone}>
                <SelectTrigger className={errors.zoneId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="-- Sélectionnez une zone --" />
                </SelectTrigger>
                <SelectContent>
                  {zones.length === 0 ? (
                    <SelectItem value="NO_ZONES" disabled>
                      Aucune zone disponible
                    </SelectItem>
                  ) : (
                    zones
                      .filter((z) => z.id && String(z.id).trim() !== "")
                      .map((z) => (
                        <SelectItem key={z.id} value={String(z.id)}>
                          {z.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {errors.zoneId && <span className="text-red-500 text-sm mt-1">{errors.zoneId}</span>}
              {zones.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {zones.length === 0 ? 'Chargement des zones...' : `${zones.length} zones disponibles`}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status || undefined} onValueChange={handleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un statut --" />
                </SelectTrigger>
                <SelectContent>
                  {PARCEL_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Photos</Label>
              <Input type="file" multiple onChange={handleFiles} accept="image/*" />
              {images.length === 0 && (
                <p className="text-gray-500 text-xs mt-1">Note: Les images sont prévisualisées mais ne sont pas encore sauvegardées (en attente de l'implémentation backend)</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {(images ?? []).map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img.url} className="w-24 h-24 object-cover rounded" alt={`Image ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                      title="Supprimer cette image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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