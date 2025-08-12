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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface Appointment {
  id: string
  contactName: string
  contactEmail: string
  contactPhone: string
  companyName: string
  activityType: string
  projectDescription: string
  investmentBudget: string
  preferredDate: string
  preferredTime: string
  urgency: string
  requestedDate: string
  parcelId: string
  status: string
}

interface ParcelDto {
  id: string
  reference: string
}

const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function AppointmentsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Appointment[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [parcels, setParcels] = useState<ParcelDto[]>([])
  const [form, setForm] = useState<Appointment>({
    id: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    activityType: '',
    projectDescription: '',
    investmentBudget: '',
    preferredDate: '',
    preferredTime: '',
    urgency: '',
    requestedDate: '',
    parcelId: '',
    status: 'PENDING',
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
    
    const response = await fetchApi<ListResponse<Appointment>>(
      `/api/appointments?${params.toString()}`
    ).catch(() => null)
    
    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else if (Array.isArray(response)) {
      setItems(response as Appointment[])
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
    fetchApi<ParcelDto[]>("/api/parcels/all")
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setParcels(arr)
      })
      .catch(() => setParcels([]))
  }, [])

  // Fonction de validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validation du nom de contact
    if (!form.contactName.trim()) {
      newErrors.contactName = 'Le nom de contact est obligatoire'
    } else if (form.contactName.length < 2) {
      newErrors.contactName = 'Le nom doit contenir au moins 2 caractères'
    }
    
    // Validation de l'email
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = 'Format d\'email invalide'
    }
    
    // Validation du téléphone
    if (form.contactPhone && !/^(\+212|0)[567]\d{8}$/.test(form.contactPhone.replace(/\s/g, ''))) {
      newErrors.contactPhone = 'Format de téléphone marocain invalide (ex: +212 6 XX XX XX XX)'
    }
    
    // Validation des dates
    if (form.preferredDate && new Date(form.preferredDate) > new Date('2030-12-31')) {
      newErrors.preferredDate = 'Date trop éloignée dans le futur'
    }
    
    if (form.requestedDate) {
      const today = new Date()
      const requestedDate = new Date(form.requestedDate)
      if (requestedDate < today) {
        newErrors.requestedDate = 'La date programmée ne peut pas être dans le passé'
      }
    }
    
    // Vérification d'unicité de l'email (si modification)
    if (form.contactEmail && !form.id) {
      try {
        const existingAppointments = await fetchApi<ListResponse<Appointment>>(`/api/appointments?search=${form.contactEmail}`)
        if (existingAppointments?.items?.some(apt => apt.contactEmail === form.contactEmail && apt.status === 'PENDING')) {
          newErrors.contactEmail = 'Un rendez-vous en attente existe déjà pour cet email'
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification d\'unicité:', error)
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleStatus = (value: string) => {
    setForm({ ...form, status: value })
  }

  const handleParcel = (value: string) => {
    setForm({ ...form, parcelId: value })
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
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        activityType: form.activityType || undefined,
        projectDescription: form.projectDescription.trim() || undefined,
        investmentBudget: form.investmentBudget || undefined,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        urgency: form.urgency || undefined,
        requestedDate: form.requestedDate || undefined,
        parcelId: form.parcelId || undefined,
        status: form.status,
      }

      if (form.id) {
        await fetchApi(`/api/appointments/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetchApi('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      
      // Réinitialiser le formulaire
      setForm({
        id: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        companyName: '',
        activityType: '',
        projectDescription: '',
        investmentBudget: '',
        preferredDate: '',
        preferredTime: '',
        urgency: '',
        requestedDate: '',
        parcelId: '',
        status: 'PENDING',
      })
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

  function edit(it: Appointment) {
    setForm({
      id: it.id,
      contactName: it.contactName,
      contactEmail: it.contactEmail ?? '',
      contactPhone: it.contactPhone ?? '',
      companyName: it.companyName ?? '',
      activityType: it.activityType ?? '',
      projectDescription: it.projectDescription ?? '',
      investmentBudget: it.investmentBudget ?? '',
      preferredDate: it.preferredDate ?? '',
      preferredTime: it.preferredTime ?? '',
      urgency: it.urgency ?? '',
      requestedDate: it.requestedDate ? it.requestedDate.slice(0, 10) : '',
      parcelId: it.parcelId ?? '',
      status: it.status,
    })
    setOpen(true)
  }
  async function del(id: string) {
    await fetchApi(`/api/appointments/${id}`, { method: 'DELETE' })
    load(currentPage)
  }

  function addNew() {
    setForm({
      id: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      companyName: '',
      activityType: '',
      projectDescription: '',
      investmentBudget: '',
      preferredDate: '',
      preferredTime: '',
      urgency: '',
      requestedDate: '',
      parcelId: '',
      status: 'PENDING',
    })
    setOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Rendez-vous</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par contact, email..."
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
                <th className="p-2">Contact</th>
                <th className="p-2">Société</th>
                <th className="p-2">Activité</th>
                <th className="p-2">Description du projet</th>
                <th className="p-2">Urgence</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Parcelle</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-2 align-top">
                    <div className="font-medium">{a.contactName}</div>
                    <div className="text-xs text-gray-500">{a.contactEmail}</div>
                  </td>
                  <td className="p-2 align-top">{a.companyName}</td>
                  <td className="p-2 align-top">{a.activityType}</td>
                  <td className="p-2 align-top">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate" title={a.projectDescription || 'Aucune description'}>
                        {a.projectDescription || 'Aucune description'}
                      </p>
                    </div>
                  </td>
                  <td className="p-2 align-top">
                    <span className={`px-2 py-1 rounded text-xs ${
                      a.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                      a.urgency === 'moyen-terme' ? 'bg-yellow-100 text-yellow-800' :
                      a.urgency === 'long-terme' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {a.urgency}
                    </span>
                  </td>
                  <td className="p-2 align-top">
                    <span className={`px-2 py-1 rounded text-xs ${
                      a.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      a.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-2 align-top">{a.parcelId}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(a)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={`Rendez-vous de ${a.contactName}`}
                      onConfirm={() => del(a.id)}
                      description={`Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.`}
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
            <DialogTitle>{form.id ? 'Modifier' : 'Nouveau RDV'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}
            <div>
              <Label htmlFor="contactName">Contact *</Label>
              <Input 
                id="contactName" 
                name="contactName" 
                value={form.contactName} 
                onChange={handleChange} 
                required 
                className={errors.contactName ? 'border-red-500' : ''}
                placeholder="Nom complet du contact"
              />
              {errors.contactName && <span className="text-red-500 text-sm">{errors.contactName}</span>}
            </div>
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input 
                id="contactEmail" 
                name="contactEmail" 
                type="email"
                value={form.contactEmail} 
                onChange={handleChange}
                className={errors.contactEmail ? 'border-red-500' : ''}
                placeholder="email@entreprise.com"
              />
              {errors.contactEmail && <span className="text-red-500 text-sm">{errors.contactEmail}</span>}
            </div>
            <div>
              <Label htmlFor="contactPhone">Téléphone</Label>
              <Input 
                id="contactPhone" 
                name="contactPhone" 
                type="tel"
                value={form.contactPhone} 
                onChange={handleChange}
                className={errors.contactPhone ? 'border-red-500' : ''}
                placeholder="+212 6 XX XX XX XX"
              />
              {errors.contactPhone && <span className="text-red-500 text-sm">{errors.contactPhone}</span>}
            </div>
            <div>
              <Label htmlFor="companyName">Société</Label>
              <Input 
                id="companyName" 
                name="companyName" 
                value={form.companyName} 
                onChange={handleChange}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div>
              <Label htmlFor="activityType">Type d'activité</Label>
              <Select value={form.activityType || undefined} onValueChange={(value) => setForm({...form, activityType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le secteur d'activité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industrie-automobile">Industrie automobile</SelectItem>
                  <SelectItem value="textile">Textile</SelectItem>
                  <SelectItem value="agroalimentaire">Agroalimentaire</SelectItem>
                  <SelectItem value="pharmaceutique">Pharmaceutique</SelectItem>
                  <SelectItem value="logistique">Logistique et distribution</SelectItem>
                  <SelectItem value="metallurgie">Métallurgie</SelectItem>
                  <SelectItem value="chimie">Chimie</SelectItem>
                  <SelectItem value="electronique">Électronique</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="projectDescription">Description du projet</Label>
              <Input 
                id="projectDescription" 
                name="projectDescription" 
                value={form.projectDescription} 
                onChange={handleChange}
                placeholder="Description succincte du projet industriel"
              />
            </div>
            <div>
              <Label htmlFor="investmentBudget">Budget d'investissement</Label>
              <Select value={form.investmentBudget || undefined} onValueChange={(value) => setForm({...form, investmentBudget: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Fourchette de budget (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moins-1m">Moins de 1M DH</SelectItem>
                  <SelectItem value="1m-5m">1M - 5M DH</SelectItem>
                  <SelectItem value="5m-10m">5M - 10M DH</SelectItem>
                  <SelectItem value="10m-50m">10M - 50M DH</SelectItem>
                  <SelectItem value="plus-50m">Plus de 50M DH</SelectItem>
                  <SelectItem value="confidentiel">Confidentiel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="preferredDate">Date demandée par le client</Label>
              <Input 
                id="preferredDate" 
                name="preferredDate" 
                type="date" 
                value={form.preferredDate} 
                onChange={handleChange}
                max="2030-12-31"
                className={errors.preferredDate ? 'border-red-500' : ''}
              />
              {errors.preferredDate && <span className="text-red-500 text-sm">{errors.preferredDate}</span>}
            </div>
            <div>
              <Label htmlFor="preferredTime">Créneau préféré</Label>
              <Select value={form.preferredTime || undefined} onValueChange={(value) => setForm({...form, preferredTime: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un créneau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matin-9h-12h">Matin (9h-12h)</SelectItem>
                  <SelectItem value="apres-midi-14h-17h">Après-midi (14h-17h)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency">Urgence</Label>
              <Select value={form.urgency || undefined} onValueChange={(value) => setForm({...form, urgency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le niveau d'urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent (décision sous 1 mois)</SelectItem>
                  <SelectItem value="moyen-terme">Moyen terme (3-6 mois)</SelectItem>
                  <SelectItem value="long-terme">Long terme (6 mois+)</SelectItem>
                  <SelectItem value="etude">Phase d'étude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="requestedDate">Date programmée/confirmée</Label>
              <Input 
                id="requestedDate" 
                name="requestedDate" 
                type="date" 
                value={form.requestedDate} 
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                max="2030-12-31"
                className={errors.requestedDate ? 'border-red-500' : ''}
              />
              {errors.requestedDate && <span className="text-red-500 text-sm">{errors.requestedDate}</span>}
            </div>
            <div>
              <Label htmlFor="parcelId">Parcelle</Label>
              <Select value={form.parcelId || undefined} onValueChange={handleParcel}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez une parcelle --" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(parcels) ? parcels : [])
                    .filter((p) => p.id && String(p.id).trim() !== "")
                    .map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.reference}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status || undefined} onValueChange={handleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Sélectionnez un statut --" />
                </SelectTrigger>
                <SelectContent>
                  {statuses
                    .filter((s) => s && s.trim() !== "")
                    .map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOpen(false)
                  setErrors({})
                }}
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