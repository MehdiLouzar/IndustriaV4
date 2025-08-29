'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, Building, TrendingUp, Mail, Phone, MapPin, Calendar, 
  Search, Filter, ChevronLeft, ChevronRight, Eye, Trash2, Clock
} from 'lucide-react'
import { secureApiRequest } from '@/lib/auth-actions'
import type { ListResponse } from '@/types'

interface ContactRequest {
  id: string
  contactType: 'AMENAGEUR' | 'INDUSTRIEL_INVESTISSEUR'
  raisonSociale: string
  contactNom: string
  contactPrenom: string
  contactTelephone: string
  contactEmail: string
  
  // Champs aménageur
  regionImplantation?: string
  prefectureImplantation?: string
  superficieNetHa?: number
  nombreLotTotal?: number
  nombreLotNonOccupe?: number
  
  // Champs industriel/investisseur
  descriptionActivite?: string
  montantInvestissement?: number
  nombreEmploisPrevisionnel?: number
  superficieSouhaitee?: number
  regionImplantationSouhaitee?: string
  
  status: 'NOUVEAU' | 'EN_COURS' | 'TRAITE' | 'FERME'
  notes?: string
  createdAt: string
}

type ContactType = 'AMENAGEUR' | 'INDUSTRIEL_INVESTISSEUR'
type ContactRequestStatus = 'NOUVEAU' | 'EN_COURS' | 'TRAITE' | 'FERME'

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactRequestStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<ContactType | 'ALL'>('ALL')
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null)
  const [error, setError] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
      if (typeFilter && typeFilter !== 'ALL') params.append('contactType', typeFilter)
      
      const { data: response, error } = await secureApiRequest<ListResponse<ContactRequest>>(`/api/contact-requests?${params}`)
      
      if (error) {
        console.error('Erreur lors du chargement des demandes:', error)
        setError('Erreur lors du chargement des demandes')
      } else if (response) {
        setRequests(response.items || [])
        setTotalPages(response.totalPages || 1)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: ContactRequestStatus, notes?: string) => {
    const { error } = await secureApiRequest(`/api/contact-requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes })
    })
    
    if (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setError('Erreur lors de la mise à jour du statut')
    } else {
      // Recharger la liste
      loadRequests()
      setSelectedRequest(null)
    }
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return
    
    const { error } = await secureApiRequest(`/api/contact-requests/${id}`, {
      method: 'DELETE'
    })
    
    if (error) {
      console.error('Erreur lors de la suppression:', error)
      setError('Erreur lors de la suppression')
    } else {
      loadRequests()
      setSelectedRequest(null)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [page, searchTerm, statusFilter, typeFilter])

  const getStatusColor = (status: ContactRequestStatus) => {
    switch (status) {
      case 'NOUVEAU': return 'bg-blue-100 text-blue-800'
      case 'EN_COURS': return 'bg-orange-100 text-orange-800'
      case 'TRAITE': return 'bg-green-100 text-green-800'
      case 'FERME': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: ContactRequestStatus) => {
    switch (status) {
      case 'NOUVEAU': return 'Nouveau'
      case 'EN_COURS': return 'En cours'
      case 'TRAITE': return 'Traité'
      case 'FERME': return 'Fermé'
      default: return status
    }
  }

  const getTypeLabel = (type: ContactType) => {
    return type === 'AMENAGEUR' ? 'Aménageur' : 'Industriel/Investisseur'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Demandes de contact</h1>
        <p className="text-gray-600">Gérez les demandes de rendez-vous</p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nom, email, société..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Statut</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContactRequestStatus | 'ALL')}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="NOUVEAU">Nouveau</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="TRAITE">Traité</SelectItem>
                  <SelectItem value="FERME">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ContactType | 'ALL')}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="AMENAGEUR">Aménageur</SelectItem>
                  <SelectItem value="INDUSTRIEL_INVESTISSEUR">Industriel/Investisseur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('ALL')
                  setTypeFilter('ALL')
                  setPage(1)
                }}
                variant="outline"
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des demandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Liste des demandes</CardTitle>
            <CardDescription>
              {requests.length > 0 && `${requests.length} demande(s) trouvée(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucune demande trouvée</div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedRequest?.id === request.id 
                        ? 'border-industria-brown-gold bg-industria-gray-light/50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{request.raisonSociale}</h4>
                        <p className="text-sm text-gray-600">
                          {request.contactPrenom} {request.contactNom}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.contactType === 'AMENAGEUR' ? (
                          <Building className="w-4 h-4 text-industria-brown-gold" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-industria-brown-gold" />
                        )}
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {request.contactEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détails de la demande sélectionnée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Détails de la demande</span>
              {selectedRequest && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRequest(selectedRequest.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRequest ? (
              <div className="text-center py-8 text-gray-500">
                Sélectionnez une demande pour voir les détails
              </div>
            ) : (
              <div className="space-y-4">
                {/* Informations générales */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Informations générales
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {getTypeLabel(selectedRequest.contactType)}</div>
                    <div><strong>Raison sociale:</strong> {selectedRequest.raisonSociale}</div>
                    <div><strong>Contact:</strong> {selectedRequest.contactPrenom} {selectedRequest.contactNom}</div>
                    <div><strong>Email:</strong> {selectedRequest.contactEmail}</div>
                    <div><strong>Téléphone:</strong> {selectedRequest.contactTelephone}</div>
                    <div><strong>Date:</strong> {new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}</div>
                  </div>
                </div>

                {/* Détails spécifiques */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {selectedRequest.contactType === 'AMENAGEUR' ? (
                      <>
                        <Building className="w-4 h-4" />
                        Détails aménageur
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Détails industriel/investisseur
                      </>
                    )}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedRequest.contactType === 'AMENAGEUR' ? (
                      <>
                        <div><strong>Région d'implantation:</strong> {selectedRequest.regionImplantation}</div>
                        <div><strong>Préfecture:</strong> {selectedRequest.prefectureImplantation}</div>
                        <div><strong>Superficie nette:</strong> {selectedRequest.superficieNetHa} Ha</div>
                        <div><strong>Nombre de lots total:</strong> {selectedRequest.nombreLotTotal}</div>
                        <div><strong>Lots non occupés:</strong> {selectedRequest.nombreLotNonOccupe}</div>
                      </>
                    ) : (
                      <>
                        <div><strong>Description activité:</strong> {selectedRequest.descriptionActivite}</div>
                        <div><strong>Montant investissement:</strong> {selectedRequest.montantInvestissement?.toLocaleString()} MAD</div>
                        <div><strong>Emplois prévisionnels:</strong> {selectedRequest.nombreEmploisPrevisionnel}</div>
                        <div><strong>Superficie souhaitée:</strong> {selectedRequest.superficieSouhaitee} m²</div>
                        <div><strong>Région souhaitée:</strong> {selectedRequest.regionImplantationSouhaitee}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions de statut */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Statut
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {(['NOUVEAU', 'EN_COURS', 'TRAITE', 'FERME'] as ContactRequestStatus[]).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedRequest.status === status ? "default" : "outline"}
                        onClick={() => updateStatus(selectedRequest.id, status)}
                        disabled={selectedRequest.status === status}
                      >
                        {getStatusLabel(status)}
                      </Button>
                    ))}
                  </div>
                  {selectedRequest.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <strong>Notes:</strong> {selectedRequest.notes}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}