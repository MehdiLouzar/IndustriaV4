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
    templateId: ''
  })

  async function loadNotifications(page = currentPage) {
    const response = await fetchApi<ListResponse<Notification>>(
      `/api/admin/notifications?page=${page}&limit=${itemsPerPage}`
    ).catch(() => null)
    
    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else {
      setItems([])
    }
  }

  async function loadTemplates() {
    const templates = await fetchApi<NotificationTemplate[]>('/api/admin/notification-templates').catch(() => [])
    if (Array.isArray(templates)) {
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
    loadNotifications()
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, router])

  async function save() {
    if (!form.recipientEmail.trim() || !form.subject.trim()) return
    
    const payload = {
      ...form,
      maxRetries: parseInt(form.maxRetries) || 3
    }
    
    const method = form.id ? 'PUT' : 'POST'
    const url = form.id ? `/api/admin/notifications/${form.id}` : '/api/admin/notifications'
    
    await fetchApi(url, {
      method,
      body: JSON.stringify(payload)
    }).catch(console.error)
    
    setOpen(false)
    resetForm()
    loadNotifications()
  }

  async function deleteItem(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) return
    
    await fetchApi(`/api/admin/notifications/${id}`, {
      method: 'DELETE'
    }).catch(console.error)
    
    loadNotifications()
  }

  async function retryNotification(id: string) {
    await fetchApi(`/api/admin/notifications/${id}/retry`, {
      method: 'POST'
    }).catch(console.error)
    
    loadNotifications()
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
      templateId: ''
    })
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode ? 'Détails de la notification' : form.id ? 'Modifier' : 'Nouvelle'} notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientEmail">Email destinataire *</Label>
                <Input
                  id="recipientEmail"
                  value={form.recipientEmail}
                  onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                  placeholder="destinataire@example.com"
                  disabled={viewMode}
                />
              </div>

              <div>
                <Label htmlFor="recipientName">Nom destinataire</Label>
                <Input
                  id="recipientName"
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="Nom du destinataire"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Sujet *</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Sujet de l'email"
                disabled={viewMode}
              />
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
                <Label htmlFor="maxRetries">Tentatives max</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min="1"
                  max="10"
                  value={form.maxRetries}
                  onChange={(e) => setForm({ ...form, maxRetries: e.target.value })}
                  disabled={viewMode}
                />
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
                    <SelectItem value="">Aucun template</SelectItem>
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
              <Label htmlFor="textBody">Corps (texte)</Label>
              <textarea
                id="textBody"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.textBody}
                onChange={(e) => setForm({ ...form, textBody: e.target.value })}
                placeholder="Version texte de l'email"
                rows={4}
                disabled={viewMode}
              />
            </div>

            <div>
              <Label htmlFor="htmlBody">Corps (HTML) *</Label>
              <textarea
                id="htmlBody"
                className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.htmlBody}
                onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
                placeholder="<html><body>Contenu HTML de l'email</body></html>"
                rows={8}
                disabled={viewMode}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {viewMode ? 'Fermer' : 'Annuler'}
              </Button>
              {!viewMode && (
                <Button onClick={save} className="header-red text-white">
                  {form.id ? 'Modifier' : 'Créer'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}