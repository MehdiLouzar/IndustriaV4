'use client'

import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fetchApi, getBaseUrl } from '@/lib/utils'
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
import { ZONE_STATUSES, PRICE_TYPES, CONSTRUCTION_TYPES, getEnumLabel, getEnumBadge } from '@/lib/translations'
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

interface Zone {
  id: string
  name: string
  description?: string | null
  address?: string | null
  totalArea?: number | null
  price?: number | null
  priceType?: 'FIXED_PRICE' | 'PER_SQUARE_METER' | null
  constructionType?: 'CUSTOM_BUILD' | 'OWNER_BUILT' | 'LAND_LEASE_ONLY' | 'TURNKEY' | null
  status: string
  zoneTypeId?: string | null
  regionId?: string | null
  activityIds?: string[]  // IDs des activités depuis le backend
  amenityIds?: string[]   // IDs des amenities depuis le backend
  vertices?: Vertex[]
  longitude?: number | null  // Coordonnées calculées côté backend
  latitude?: number | null   // Coordonnées calculées côté backend
  createdAt?: string
  updatedAt?: string
}

interface ActivityDto {
  id: string
  name: string
}

interface ZoneForm {
  id: string
  name: string
  description: string
  address: string
  totalArea: string
  price: string
  priceType: string
  constructionType: string
  status: string
  zoneTypeId: string
  regionId: string
  activityIds: string[]
  amenityIds: string[]
  vertices: { lambertX: string; lambertY: string }[]
  verticesModified: boolean  // Flag pour savoir si les coordonnées ont été modifiées
}

// Composant mémorisé pour les lignes de la table des zones
const ZoneTableRow = memo(({ 
  zone, 
  getZoneCoordinates, 
  onEdit, 
  onDelete 
}: { 
  zone: Zone, 
  getZoneCoordinates: (zone: Zone) => any,
  onEdit: (zone: Zone) => void,
  onDelete: (id: string) => void
}) => {
  const coordinates = useMemo(() => getZoneCoordinates(zone), [zone, getZoneCoordinates])
  
  return (
    <tr key={zone.id} className="border-b last:border-0">
      <td className="p-2 align-top">{zone.name}</td>
      <td className="p-2 align-top">
        <Badge className={getEnumBadge(ZONE_STATUSES, zone.status).color}>
          {getEnumBadge(ZONE_STATUSES, zone.status).label}
        </Badge>
      </td>
      <td className="p-2 align-top">{zone.regionId}</td>
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
        <Button asChild size="sm" variant="outline" className="bg-industria-brown-gold text-white hover:bg-industria-olive-light">
          <Link href={`/zones/${zone.id}`}>
            Voir la zone
          </Link>
        </Button>
        <Button size="sm" onClick={() => onEdit(zone)}>Éditer</Button>
        <DeleteConfirmDialog
          itemName={zone.name}
          onConfirm={() => onDelete(zone.id)}
          description={`Êtes-vous sûr de vouloir supprimer la zone "${zone.name}" ? Cette action est irréversible et supprimera toutes les parcelles, images et associations liées.`}
        />
      </td>
    </tr>
  )
})

ZoneTableRow.displayName = 'ZoneTableRow'

// Les constantes sont maintenant importées de translations.ts

export default function ZonesAdmin() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Refs pour éviter les problèmes de closures
  const currentPageRef = useRef(currentPage)
  const searchTermRef = useRef(searchTerm)
  
  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])
  
  useEffect(() => {
    searchTermRef.current = searchTerm
  }, [searchTerm])
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [allZoneTypes, setAllZoneTypes] = useState<{ id: string; name: string }[]>([])
  const [allCountries, setAllCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [allRegions, setAllRegions] = useState<{ id: string; name: string }[]>([])
  const [selectedCountryId, setSelectedCountryId] = useState<string>('')
  const [activities, setActivities] = useState<ActivityDto[]>([])
  const [allAmenities, setAllAmenities] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<ZoneForm>({
    id: '',
    name: '',
    description: '',
    address: '',
    totalArea: '',
    price: '',
    priceType: 'FIXED_PRICE',
    constructionType: 'CUSTOM_BUILD',
    status: 'LIBRE',
    zoneTypeId: '',
    regionId: '',
    activityIds: [],
    amenityIds: [],
    vertices: [],
    verticesModified: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<{ file: File; url: string; description?: string; isPrimary?: boolean }[]>([])
  const [existingImages, setExistingImages] = useState<Array<{
    id: string;
    filename: string;
    originalFilename: string;
    description?: string;
    isPrimary: boolean;
    displayOrder: number;
  }>>([])

  // Fonction pour récupérer les coordonnées pré-calculées d'une zone
  const getZoneCoordinates = useCallback((zone: Zone) => {
    if (!zone.longitude || !zone.latitude) {
      return {
        display: 'Aucune coordonnée',
        wgs84: null,
        lambert: null
      }
    }

    const wgs84 = {
      longitude: zone.longitude,
      latitude: zone.latitude
    }

    return {
      display: formatWGS84(wgs84),
      wgs84: wgs84,
      lambert: null // Plus besoin des coordonnées Lambert
    }
  }, [])

  const loadZones = useCallback(async (page?: number, search?: string) => {
    const targetPage = page ?? currentPageRef.current
    const targetSearch = search ?? searchTermRef.current
    
    const params = new URLSearchParams({
      page: targetPage.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (targetSearch.trim()) {
      params.append('search', targetSearch.trim())
    }
    
    const response = await fetchApi<ListResponse<Zone>>(
      `/api/zones?${params.toString()}`
    ).catch(() => null)
    let zonesData: Zone[] = []
    if (response && Array.isArray(response.items)) {
      zonesData = response.items
    } else if (Array.isArray(response)) {
      zonesData = response as unknown as Zone[]
    } else if (response) {
      console.warn('⚠️ Format de données inattendu:', response)
    }
    setZones(zonesData)
    setTotalPages(response?.totalPages ?? 1)
    setTotalItems(response?.totalItems ?? 0)
    setCurrentPage(response?.page ?? 1)
  }, [itemsPerPage]) // Seule dépendance stable

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
    loadZones(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, router])

  // Effet pour la recherche  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1) // Retour à la page 1 lors d'une recherche
      } else {
        // Si on est déjà à la page 1, charger directement
        loadZones(1, searchTerm)
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, loadZones]) // Maintenant loadZones est stable


  useEffect(() => {
    fetchApi<{ id: string; name: string }[]>('/api/zone-types/all')
      .then((data) => {
        setAllZoneTypes(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        console.error('Erreur chargement zone types:', error)
        setAllZoneTypes([])
      })
  }, [])

  // Charger les pays
  useEffect(() => {
    fetchApi<{ id: string; name: string; code: string }[]>('/api/countries/all')
      .then((data) => {
        setAllCountries(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        console.error('Erreur chargement countries:', error)
        setAllCountries([])
      })
  }, [])

  // Charger les régions selon le pays sélectionné
  useEffect(() => {
    if (selectedCountryId) {
      fetchApi<{ id: string; name: string }[]>(`/api/regions/by-country/${selectedCountryId}`)
        .then((data) => {
          setAllRegions(Array.isArray(data) ? data : [])
        })
        .catch((error) => {
          console.error('Erreur chargement regions:', error)
          setAllRegions([])
        })
    } else {
      // Si aucun pays sélectionné, charger toutes les régions
      fetchApi<{ id: string; name: string }[]>('/api/regions/all')
        .then((data) => {
          setAllRegions(Array.isArray(data) ? data : [])
        })
        .catch((error) => {
          console.error('Erreur chargement regions:', error)
          setAllRegions([])
        })
    }
  }, [selectedCountryId])

  useEffect(() => {
    fetchApi<ListResponse<ActivityDto>>("/api/activities")
      .then((response) => {
        let arr: ActivityDto[] = []
        if (response && Array.isArray(response.items)) {
          arr = response.items
        } else if (Array.isArray(response)) {
          arr = response as unknown as ActivityDto[]
        } else if (response) {
          console.warn('⚠️ Format de données inattendu:', response)
        }
        setActivities(arr)
      })
      .catch(() => setActivities([]))
  }, [])

  useEffect(() => {
    fetchApi<ListResponse<{ id: string; name: string }>>("/api/amenities/all")
      .then((response) => {
        let arr: { id: string; name: string }[] = []
        if (response && Array.isArray(response.items)) {
          arr = response.items
        } else if (Array.isArray(response)) {
          arr = response as unknown as { id: string; name: string }[]
        } else if (response) {
          console.warn('⚠️ Format de données inattendu:', response)
        }
        setAllAmenities(arr)
      })
      .catch(() => setAllAmenities([]))
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [errors])

  const handleStatus = useCallback((value: string) => {
    setForm(prev => ({ ...prev, status: value }))
  }, [])

  const handleZoneType = useCallback((value: string) => {
    setForm(prev => ({ ...prev, zoneTypeId: value }))
  }, [])

  const handleRegion = useCallback((value: string) => {
    setForm(prev => ({ ...prev, regionId: value }))
  }, [])
  
  const handleCountryFilter = useCallback((countryId: string) => {
    const actualCountryId = countryId === 'all' ? '' : countryId
    setSelectedCountryId(actualCountryId)
    // Réinitialiser la région sélectionnée quand on change de pays
    if (actualCountryId !== selectedCountryId) {
      setForm(prev => ({ ...prev, regionId: '' }))
    }
  }, [selectedCountryId])

  const handlePriceType = useCallback((value: string) => {
    setForm(prev => ({ ...prev, priceType: value }))
  }, [])

  const handleConstructionType = useCallback((value: string) => {
    setForm(prev => ({ ...prev, constructionType: value }))
  }, [])

  const toggleActivity = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      activityIds: f.activityIds.includes(id)
        ? f.activityIds.filter((a) => a !== id)
        : [...f.activityIds, id],
    }))
  }, [])

  const toggleAmenity = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      amenityIds: f.amenityIds.includes(id)
        ? f.amenityIds.filter((a) => a !== id)
        : [...f.amenityIds, id],
    }))
  }, [])

  const addVertex = useCallback(() => {
    setForm((f) => ({
      ...f,
      vertices: [...f.vertices, { lambertX: '', lambertY: '' }],
      verticesModified: true,
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
      return { ...f, vertices: verts, verticesModified: true }
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
      return { ...f, vertices: verts, verticesModified: true }
    })
  }, [])

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      description: '',
      isPrimary: false
    }))
    setImages((imgs) => [...imgs, ...files])
    e.target.value = ''
  }, [])

  const loadExistingImages = useCallback(async (zoneId: string) => {
    if (!zoneId) {
      setExistingImages([])
      return
    }
    try {
      const images = await fetchApi<Array<{
        id: string;
        filename: string;
        originalFilename: string;
        description?: string;
        isPrimary: boolean;
        displayOrder: number;
      }>>(`/api/zones/${zoneId}/images`)
      setExistingImages(Array.isArray(images) ? images : [])
    } catch (error) {
      console.error(`Erreur lors du chargement des images pour zone ${zoneId}:`, error)
      setExistingImages([])
    }
  }, [])

  const uploadImages = useCallback(async (zoneId: string) => {
    if (images.length === 0) return
    
    for (const imageData of images) {
      const formData = new FormData()
      formData.append('file', imageData.file)
      if (imageData.description) {
        formData.append('description', imageData.description)
      }
      if (imageData.isPrimary) {
        formData.append('isPrimary', 'true')
      }

      try {
        await fetchApi(`/api/zones/${zoneId}/images`, {
          method: 'POST',
          body: formData,
        })
      } catch (error) {
        console.error('Erreur upload image:', error)
      }
    }
  }, [images])

  const deleteExistingImage = useCallback(async (zoneId: string, imageId: string) => {
    try {
      await fetchApi(`/api/zones/${zoneId}/images/${imageId}`, {
        method: 'DELETE'
      })
      await loadExistingImages(zoneId)
    } catch (error) {
      console.error('Erreur suppression image:', error)
    }
  }, [loadExistingImages])

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
    
    // Validation du nom (obligatoire)
    if (!form.name.trim()) {
      newErrors.name = 'Le nom de la zone est obligatoire'
    } else if (form.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    }
    
    // Validation de la superficie (doit être positive si renseignée)
    if (form.totalArea && (isNaN(parseFloat(form.totalArea)) || parseFloat(form.totalArea) <= 0)) {
      newErrors.totalArea = 'La superficie doit être un nombre positif'
    }
    
    // Validation du prix (doit être positif si renseigné)
    if (form.price && (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0)) {
      newErrors.price = 'Le prix doit être un nombre positif'
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
    
    // Vérification d'unicité du nom (si nouvelle zone)
    if (!form.id && form.name.trim()) {
      try {
        const response = await fetchApi(`/api/zones/check-name?name=${encodeURIComponent(form.name.trim())}`)
        if (response && response.exists) {
          newErrors.name = 'Une zone avec ce nom existe déjà'
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification d\'unicité du nom:', error)
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
        description: form.description?.trim() || undefined,
        address: form.address?.trim() || undefined,
        totalArea: form.totalArea ? parseFloat(form.totalArea) : undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        priceType: form.priceType || undefined,
        constructionType: form.constructionType || undefined,
        status: form.status,
        zoneTypeId: form.zoneTypeId || undefined,
        regionId: form.regionId || undefined,
        activityIds: form.activityIds,
        amenityIds: form.amenityIds,
        // N'envoyer les vertices que si ils ont été modifiés OU si c'est une nouvelle zone
        vertices: (!form.id || form.verticesModified) ? form.vertices.map((v, i) => ({
          seq: i,
          lambertX: v.lambertX ? parseFloat(v.lambertX) : 0,
          lambertY: v.lambertY ? parseFloat(v.lambertY) : 0,
        })) : undefined,
      }
      
      console.log('Submitting zone data:', body)
      
      let zoneId = form.id
      
      if (form.id) {
        await fetchApi(`/api/zones/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } else {
        const newZone = await fetchApi('/api/zones', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        zoneId = newZone.id
      }

      // Upload des nouvelles images si il y en a
      if (zoneId) {
        await uploadImages(zoneId)
      }

      setForm({
        id: '',
        name: '',
        description: '',
        address: '',
        totalArea: '',
        price: '',
        priceType: 'FIXED_PRICE',
        constructionType: 'CUSTOM_BUILD',
        status: 'LIBRE',
        zoneTypeId: '',
        regionId: '',
        activityIds: [],
        amenityIds: [],
        vertices: [],
        verticesModified: false,
      })
      setImages([])
      setExistingImages([])
      setErrors({})
      setOpen(false)
      loadZones(currentPage)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = useCallback((z: Zone) => {
    setForm({
      id: z.id,
      name: z.name,
      description: z.description ?? '',
      address: z.address ?? '',
      totalArea: z.totalArea?.toString() ?? '',
      price: z.price?.toString() ?? '',
      priceType: z.priceType || 'FIXED_PRICE',
      constructionType: z.constructionType || 'CUSTOM_BUILD',
      status: z.status,
      zoneTypeId: z.zoneTypeId || '',
      regionId: z.regionId || '',
      activityIds: z.activityIds || [],
      amenityIds: z.amenityIds || [],
      vertices: z.vertices ? z.vertices.sort((a,b)=>a.seq-b.seq).map(v => ({
        lambertX: v.lambertX.toString(),
        lambertY: v.lambertY.toString(),
      })) : [],
      verticesModified: false, // Les coordonnées ne sont pas modifiées au départ
    })
    setImages([])
    loadExistingImages(z.id)
    setOpen(true)
  }, [loadExistingImages])

  const handleDelete = useCallback(async (id: string) => {
    await fetchApi(`/api/zones/${id}`, { method: 'DELETE' })
    loadZones(currentPage)
  }, [loadZones, currentPage])

  function addNew() {
    setForm({
      id: '',
      name: '',
      description: '',
      address: '',
      totalArea: '',
      price: '',
      priceType: 'FIXED_PRICE',
      constructionType: 'CUSTOM_BUILD',
      status: 'LIBRE',
      zoneTypeId: '',
      regionId: '',
      activityIds: [],
      amenityIds: [],
      vertices: [],
      verticesModified: false,
    })
    setImages([])
    setErrors({})
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Gestion des Zones</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par nom, adresse..."
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
                <th className="p-2">Statut</th>
                <th className="p-2">Région</th>
                <th className="p-2">Coordonnées</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(zones) ? zones : []).map((zone) => (
                <ZoneTableRow
                  key={zone.id}
                  zone={zone}
                  getZoneCoordinates={getZoneCoordinates}
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
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier une zone' : 'Nouvelle zone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}
            
            <div>
              <Label htmlFor="name">Nom de la zone *</Label>
              <Input 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Nom de la zone industrielle"
              />
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                name="description" 
                value={form.description} 
                onChange={handleChange}
                placeholder="Description de la zone (optionnel)"
              />
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input 
                id="address" 
                name="address" 
                value={form.address} 
                onChange={handleChange}
                placeholder="Adresse complète de la zone"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalArea">Superficie (m²)</Label>
                <Input 
                  id="totalArea" 
                  name="totalArea" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalArea} 
                  onChange={handleChange}
                  className={errors.totalArea ? 'border-red-500' : ''}
                  placeholder="Ex: 50000"
                />
                {errors.totalArea && <span className="text-red-500 text-sm mt-1">{errors.totalArea}</span>}
              </div>
              <div>
                <Label htmlFor="price">Prix (DH)</Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price} 
                  onChange={handleChange}
                  className={errors.price ? 'border-red-500' : ''}
                  placeholder="Ex: 1500000"
                />
                {errors.price && <span className="text-red-500 text-sm mt-1">{errors.price}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceType">Type de prix</Label>
                <Select value={form.priceType || undefined} onValueChange={handlePriceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Sélectionnez un type de prix --" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="constructionType">Type de construction</Label>
                <Select value={form.constructionType || undefined} onValueChange={handleConstructionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Sélectionnez un type --" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRUCTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status || undefined} onValueChange={handleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un statut --" />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zoneTypeId">Type</Label>
              <Select value={form.zoneTypeId || undefined} onValueChange={handleZoneType}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un type --" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(allZoneTypes) ? allZoneTypes : []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="countryFilter">Pays (pour filtrer les régions)</Label>
              <Select value={selectedCountryId || undefined} onValueChange={handleCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Tous les pays --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {(Array.isArray(allCountries) ? allCountries : []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regionId">Région</Label>
              <Select value={form.regionId || undefined} onValueChange={handleRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez une région --" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(allRegions) ? allRegions : []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCountryId && allRegions.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Aucune région trouvée pour ce pays
                </p>
              )}
            </div>
            <div>
              <Label>Activités</Label>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(activities) ? activities : []).length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune activité disponible</p>
                ) : (
                  (Array.isArray(activities) ? activities : []).map((a) => (
                    <label key={a.id} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.activityIds.includes(a.id)}
                        onChange={() => toggleActivity(a.id)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <Label>Équipements</Label>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(allAmenities) ? allAmenities : []).length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun équipement disponible</p>
                ) : (
                  (Array.isArray(allAmenities) ? allAmenities : []).map((a) => (
                    <label key={a.id} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.amenityIds.includes(a.id)}
                        onChange={() => toggleAmenity(a.id)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <Label>Photos</Label>
              <Input type="file" multiple onChange={handleFiles} accept="image/*" />
              
              {/* Images existantes */}
              {Array.isArray(existingImages) && existingImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Images existantes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(existingImages) ? existingImages : []).map((img) => (
                      <div key={img.id} className="relative">
                        <img 
                          src={`${getBaseUrl()}/api/zones/${form.id}/images/${img.id}/file`} 
                          className="w-24 h-24 object-cover rounded" 
                          alt={img.originalFilename}
                          title={img.description || img.originalFilename}
                        />
                        {img.isPrimary && (
                          <span className="absolute top-0 left-0 bg-green-600 text-white text-xs px-1 rounded">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteExistingImage(form.id, img.id)}
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                          title="Supprimer cette image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouvelles images à uploader */}
              {Array.isArray(images) && images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Nouvelles images à ajouter:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(images) ? images : []).map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img.url} className="w-24 h-24 object-cover rounded" alt={`Nouvelle image ${idx + 1}`} />
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
              )}

              {(!Array.isArray(images) || images.length === 0) && (!Array.isArray(existingImages) || existingImages.length === 0) && (
                <p className="text-gray-500 text-xs mt-1">Aucune image. Vous pouvez ajouter des images pour illustrer cette zone.</p>
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