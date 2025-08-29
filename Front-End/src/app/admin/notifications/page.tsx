'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { secureApiRequest } from '@/lib/auth-actions'
import Pagination from '@/components/Pagination'
import type { ListResponse } from '@/types'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { NOTIFICATION_STATUSES, getEnumLabel, getEnumBadge } from '@/lib/translations'

interface NotificationTemplate {
  id: string
  name: string
}

interface Notification {
  id: string
  recipientEmail: string
  recipientName?: string
  subject: string
  htmlBody: string
  textBody?: string
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED'
  sentAt?: string
  failureReason?: string
  retryCount: number
  maxRetries: number
  createdAt: string
  updatedAt?: string
  templateId?: string
  template?: NotificationTemplate
}

interface NotificationForm {
  id: string
  recipientEmail: string
  recipientName: string
  subject: string
  htmlBody: string
  textBody: string
  status: string
  maxRetries: string
  templateId: string
}

// Les statuts sont maintenant importés de translations.ts

export default function NotificationsAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [form, setForm] = useState<NotificationForm>({
    id: '',
    recipientEmail: '',
    recipientName: '',
    subject: '',
    htmlBody: '',
    textBody: '',
    status: 'PENDING',
    maxRetries: '3',
    templateId: 'NONE'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadNotifications = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const { data: response, error } = await secureApiRequest<ListResponse<Notification>>(
      `/api/admin/notifications?${params.toString()}`
    )
    
    if (error) {
      console.error('Error loading notifications:', error)
      setItems([])
      setTotalPages(1)
      setCurrentPage(1)
      return
    }
    
    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else {
      setItems([])
      setTotalPages(1)
      setCurrentPage(1)
    }
  }, [currentPage, itemsPerPage, searchTerm])

  async function loadTemplates() {
    const { data: templates, error } = await secureApiRequest<NotificationTemplate[]>('/api/admin/notification-templates')
    if (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    } else if (Array.isArray(templates)) {
      setTemplates(templates)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
    loadNotifications(currentPage)
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, router])

  // Effet pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Retour à la page 1 lors d'une recherche
      loadNotifications(1, searchTerm)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, loadNotifications])

  // Fonction de validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validation de l'email destinataire (obligatoire)
    if (!form.recipientEmail.trim()) {
      newErrors.recipientEmail = 'L\'adresse email du destinataire est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) {
      newErrors.recipientEmail = 'Format d\'email invalide'
    }
    
    // Validation du nom destinataire (longueur si renseigné)
    if (form.recipientName && form.recipientName.length < 2) {
      newErrors.recipientName = 'Le nom doit contenir au moins 2 caractères'
    }
    
    // Validation du sujet (obligatoire)
    if (!form.subject.trim()) {
      newErrors.subject = 'Le sujet de la notification est obligatoire'
    } else if (form.subject.length < 5) {
      newErrors.subject = 'Le sujet doit contenir au moins 5 caractères'
    }
    
    // Validation du corps HTML (obligatoire)
    if (!form.htmlBody.trim()) {
      newErrors.htmlBody = 'Le contenu HTML est obligatoire'
    } else if (form.htmlBody.length < 10) {
      newErrors.htmlBody = 'Le contenu HTML doit contenir au moins 10 caractères'
    }
    
    // Validation du nombre de tentatives max
    const maxRetries = parseInt(form.maxRetries)
    if (isNaN(maxRetries) || maxRetries < 1 || maxRetries > 10) {
      newErrors.maxRetries = 'Le nombre de tentatives doit être entre 1 et 10'
    }
    
    // Vérification d'unicité de l'email (pour éviter les doublons récents)
    if (!form.id && form.recipientEmail && form.subject && !newErrors.recipientEmail) {
      const { data: response, error } = await secureApiRequest(`/api/admin/notifications/check-duplicate?email=${encodeURIComponent(form.recipientEmail.trim())}&subject=${encodeURIComponent(form.subject.trim())}`)
      if (error) {
        console.warn('Erreur lors de la vérification de doublon:', error)
      } else if (response && response.exists) {
        newErrors.recipientEmail = 'Une notification avec ce destinataire et ce sujet existe déjà récemment'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function save() {
    setIsSubmitting(true)
    
    try {
      // Validation du formulaire
      const isValid = await validateForm()
      if (!isValid) {
        setIsSubmitting(false)
        return
      }
      
      const payload = {
        ...form,
        recipientEmail: form.recipientEmail.trim(),
        recipientName: form.recipientName?.trim() || undefined,
        subject: form.subject.trim(),
        htmlBody: form.htmlBody.trim(),
        textBody: form.textBody?.trim() || undefined,
        maxRetries: parseInt(form.maxRetries) || 3,
        templateId: form.templateId === 'NONE' ? null : form.templateId
      }
      
      const method = form.id ? 'PUT' : 'POST'
      const url = form.id ? `/api/admin/notifications/${form.id}` : '/api/admin/notifications'
      
      const { error } = await secureApiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (error) {
        throw new Error('Error saving notification')
      }
      
      setOpen(false)
      resetForm()
      loadNotifications(currentPage)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) return
    
    const { error } = await secureApiRequest(`/api/admin/notifications/${id}`, {
      method: 'DELETE'
    })
    
    if (error) {
      console.error('Error deleting notification:', error)
    } else {
      loadNotifications(currentPage)
    }
  }

  async function retryNotification(id: string) {
    const { error } = await secureApiRequest(`/api/admin/notifications/${id}/retry`, {
      method: 'POST'
    })
    
    if (error) {
      console.error('Error retrying notification:', error)
    } else {
      loadNotifications(currentPage)
    }
  }

  function resetForm() {
    setForm({
      id: '',
      recipientEmail: '',
      recipientName: '',
      subject: '',
      htmlBody: '',
      textBody: '',
      status: 'PENDING',
      maxRetries: '3',
      templateId: 'NONE'
    })
    setErrors({})
  }

  function openEdit(item: Notification) {
    setForm({
      id: item.id,
      recipientEmail: item.recipientEmail,
      recipientName: item.recipientName || '',
      subject: item.subject,
      htmlBody: item.htmlBody,
      textBody: item.textBody || '',
      status: item.status,
      maxRetries: item.maxRetries.toString(),
      templateId: item.templateId || ''
    })
    setViewMode(false)
    setOpen(true)
  }

  function openView(item: Notification) {
    setForm({
      id: item.id,
      recipientEmail: item.recipientEmail,
      recipientName: item.recipientName || '',
      subject: item.subject,
      htmlBody: item.htmlBody,
      textBody: item.textBody || '',
      status: item.status,
      maxRetries: item.maxRetries.toString(),
      templateId: item.templateId || ''
    })
    setViewMode(true)
    setOpen(true)
  }

  function openCreate() {
    resetForm()
    setViewMode(false)
    setOpen(true)
  }
  
  const handleFormChange = (field: keyof NotificationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function getStatusBadge(status: string) {
    const badge = getEnumBadge(NOTIFICATION_STATUSES, status)
    return (
      <Badge className={badge.color}>
        {badge.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Gestion des notifications email</p>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Rechercher par sujet, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button onClick={openCreate} className="header-red text-white">
                Nouvelle Notification
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Liste */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.subject}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      À: {item.recipientEmail} {item.recipientName && `(${item.recipientName})`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Créé: {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      {item.sentAt && ` • Envoyé: ${new Date(item.sentAt).toLocaleDateString('fr-FR')}`}
                      {item.retryCount > 0 && ` • Tentatives: ${item.retryCount}/${item.maxRetries}`}
                    </p>
                    {item.failureReason && (
                      <p className="text-sm text-red-600 mt-1">
                        Erreur: {item.failureReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openView(item)}
                    >
                      Voir
                    </Button>
                    {item.status === 'FAILED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700"
                        onClick={() => retryNotification(item.id)}
                      >
                        Réessayer
                      </Button>
                    )}
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
                  Aucune notification trouvée
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

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode ? 'Détails de la notification' : form.id ? 'Modifier' : 'Nouvelle'} notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientEmail">Email destinataire *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={form.recipientEmail}
                  onChange={(e) => handleFormChange('recipientEmail', e.target.value)}
                  placeholder="destinataire@example.com"
                  disabled={viewMode}
                  className={errors.recipientEmail ? 'border-red-500' : ''}
                />
                {errors.recipientEmail && <span className="text-red-500 text-sm mt-1">{errors.recipientEmail}</span>}
              </div>

              <div>
                <Label htmlFor="recipientName">Nom destinataire</Label>
                <Input
                  id="recipientName"
                  value={form.recipientName}
                  onChange={(e) => handleFormChange('recipientName', e.target.value)}
                  placeholder="Nom du destinataire (optionnel)"
                  disabled={viewMode}
                  className={errors.recipientName ? 'border-red-500' : ''}
                />
                {errors.recipientName && <span className="text-red-500 text-sm mt-1">{errors.recipientName}</span>}
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Sujet de la notification *</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => handleFormChange('subject', e.target.value)}
                placeholder="Sujet de l'email (minimum 5 caractères)"
                disabled={viewMode}
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && <span className="text-red-500 text-sm mt-1">{errors.subject}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={form.status} 
                  onValueChange={(value) => setForm({ ...form, status: value })}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxRetries">Nombre de tentatives maximum *</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min="1"
                  max="10"
                  value={form.maxRetries}
                  onChange={(e) => handleFormChange('maxRetries', e.target.value)}
                  disabled={viewMode}
                  className={errors.maxRetries ? 'border-red-500' : ''}
                  placeholder="Ex: 3"
                />
                {errors.maxRetries && <span className="text-red-500 text-sm mt-1">{errors.maxRetries}</span>}
              </div>
            </div>

            {templates.length > 0 && (
              <div>
                <Label htmlFor="templateId">Template</Label>
                <Select 
                  value={form.templateId} 
                  onValueChange={(value) => setForm({ ...form, templateId: value })}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Aucun template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="textBody">Version texte (optionnel)</Label>
              <textarea
                id="textBody"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.textBody}
                onChange={(e) => handleFormChange('textBody', e.target.value)}
                placeholder="Version texte de l'email pour les clients ne supportant pas le HTML"
                rows={4}
                disabled={viewMode}
              />
            </div>

            <div>
              <Label htmlFor="htmlBody">Contenu HTML de la notification *</Label>
              <textarea
                id="htmlBody"
                className={`w-full min-h-[200px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.htmlBody ? 'border-red-500' : 'border-gray-300'}`}
                value={form.htmlBody}
                onChange={(e) => handleFormChange('htmlBody', e.target.value)}
                placeholder="<html><body><h1>Titre</h1><p>Contenu HTML de votre notification...</p></body></html>"
                rows={8}
                disabled={viewMode}
              />
              {errors.htmlBody && <span className="text-red-500 text-sm mt-1">{errors.htmlBody}</span>}
              <p className="text-xs text-gray-500 mt-1">
                Utilisez du HTML valide pour le contenu de votre email
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setOpen(false)
                  setErrors({})
                }}
                disabled={isSubmitting}
              >
                {viewMode ? 'Fermer' : 'Annuler'}
              </Button>
              {!viewMode && (
                <Button 
                  onClick={save} 
                  className="header-red text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enregistrement...' : (form.id ? 'Modifier' : 'Créer')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}