'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, Phone, Building, MapPin, TrendingUp, Users } from 'lucide-react'
import { fetchApi } from '@/lib/utils'

interface Region {
  value: string
  label: string
}

interface Prefecture {
  value: string
  label: string
}

interface ContactFormData {
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
  
  zoneId?: string
  parcelId?: string
}

function ContactForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState<ContactFormData>({
    contactType: 'INDUSTRIEL_INVESTISSEUR',
    raisonSociale: '',
    contactNom: '',
    contactPrenom: '',
    contactTelephone: '',
    contactEmail: '',
  })
  
  const [regions, setRegions] = useState<Region[]>([])
  const [prefectures, setPrefectures] = useState<Prefecture[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  useEffect(() => {
    // Récupérer les paramètres URL
    const zoneId = searchParams.get('zone')
    const parcelId = searchParams.get('parcel')
    
    if (zoneId) {
      setFormData(prev => ({ ...prev, zoneId }))
    }
    if (parcelId) {
      setFormData(prev => ({ ...prev, parcelId }))
    }
    
    // Charger les régions
    loadRegions()
  }, [searchParams])
  
  useEffect(() => {
    // Charger les préfectures quand une région est sélectionnée
    if (formData.regionImplantation || formData.regionImplantationSouhaitee) {
      const region = formData.contactType === 'AMENAGEUR' 
        ? formData.regionImplantation 
        : formData.regionImplantationSouhaitee
      if (region) {
        loadPrefectures(region)
      }
    }
  }, [formData.regionImplantation, formData.regionImplantationSouhaitee, formData.contactType])
  
  const loadRegions = async () => {
    try {
      const data = await fetchApi<Region[]>('/api/contact-requests/regions')
      setRegions(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des régions:', error)
    }
  }
  
  const loadPrefectures = async (region: string) => {
    try {
      const data = await fetchApi<Prefecture[]>(`/api/contact-requests/prefectures?region=${region}`)
      setPrefectures(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des préfectures:', error)
      setPrefectures([])
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await fetchApi('/api/contact-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      setSuccess(true)
      // Rediriger après 3 secondes
      setTimeout(() => {
        router.push('/')
      }, 3000)
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du formulaire:', error)
      setError('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }
  
  const updateFormData = (field: keyof ContactFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Reset des préfectures quand on change de région
    if (field === 'regionImplantation' || field === 'regionImplantationSouhaitee') {
      setPrefectures([])
      if (field === 'regionImplantation') {
        setFormData(prev => ({ ...prev, prefectureImplantation: undefined }))
      }
    }
    
    // Reset des champs non pertinents quand on change de type
    if (field === 'contactType') {
      if (value === 'AMENAGEUR') {
        setFormData(prev => ({
          ...prev,
          descriptionActivite: undefined,
          montantInvestissement: undefined,
          nombreEmploisPrevisionnel: undefined,
          superficieSouhaitee: undefined,
          regionImplantationSouhaitee: undefined,
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          regionImplantation: undefined,
          prefectureImplantation: undefined,
          superficieNetHa: undefined,
          nombreLotTotal: undefined,
          nombreLotNonOccupe: undefined,
        }))
      }
    }
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Demande envoyée avec succès !</h2>
              <p className="text-gray-600 mb-4">
                Votre demande de contact a été envoyée avec succès. Vous recevrez un email de confirmation
                et notre équipe vous recontactera dans les plus brefs délais.
              </p>
              <p className="text-sm text-gray-500">
                Vous allez être redirigé vers la page d'accueil dans quelques secondes...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Prise de rendez-vous</h1>
          <p className="text-gray-600 mt-2">
            Remplissez le formulaire ci-dessous pour nous faire part de votre projet
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Type de demande
              </CardTitle>
              <CardDescription>
                Sélectionnez le type qui correspond le mieux à votre profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.contactType} 
                onValueChange={(value) => updateFormData('contactType', value as 'AMENAGEUR' | 'INDUSTRIEL_INVESTISSEUR')}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="AMENAGEUR" id="amenageur" />
                  <Label htmlFor="amenageur" className="flex items-center gap-2 cursor-pointer">
                    <Building className="w-4 h-4" />
                    Aménageur
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="INDUSTRIEL_INVESTISSEUR" id="industriel" />
                  <Label htmlFor="industriel" className="flex items-center gap-2 cursor-pointer">
                    <TrendingUp className="w-4 h-4" />
                    Industriel/Investisseur
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Informations sur votre société et contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="raisonSociale">Raison sociale *</Label>
                <Input
                  id="raisonSociale"
                  value={formData.raisonSociale}
                  onChange={(e) => updateFormData('raisonSociale', e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPrenom">Prénom du contact *</Label>
                  <Input
                    id="contactPrenom"
                    value={formData.contactPrenom}
                    onChange={(e) => updateFormData('contactPrenom', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactNom">Nom du contact *</Label>
                  <Input
                    id="contactNom"
                    value={formData.contactNom}
                    onChange={(e) => updateFormData('contactNom', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactTelephone">Numéro de téléphone *</Label>
                  <Input
                    id="contactTelephone"
                    type="tel"
                    value={formData.contactTelephone}
                    onChange={(e) => updateFormData('contactTelephone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Adresse email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Champs spécifiques aux aménageurs */}
          {formData.contactType === 'AMENAGEUR' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informations aménageur
                </CardTitle>
                <CardDescription>
                  Détails sur votre zone d'aménagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="regionImplantation">Région d'implantation *</Label>
                    <Select value={formData.regionImplantation} onValueChange={(value) => updateFormData('regionImplantation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prefectureImplantation">Préfecture d'implantation *</Label>
                    <Select 
                      value={formData.prefectureImplantation} 
                      onValueChange={(value) => updateFormData('prefectureImplantation', value)}
                      disabled={!formData.regionImplantation}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une préfecture" />
                      </SelectTrigger>
                      <SelectContent>
                        {prefectures.map((prefecture) => (
                          <SelectItem key={prefecture.value} value={prefecture.value}>
                            {prefecture.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="superficieNetHa">Superficie nette (Ha) *</Label>
                    <Input
                      id="superficieNetHa"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.superficieNetHa || ''}
                      onChange={(e) => updateFormData('superficieNetHa', parseFloat(e.target.value) || undefined)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombreLotTotal">Nombre de lots total *</Label>
                    <Input
                      id="nombreLotTotal"
                      type="number"
                      min="0"
                      value={formData.nombreLotTotal || ''}
                      onChange={(e) => updateFormData('nombreLotTotal', parseInt(e.target.value) || undefined)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombreLotNonOccupe">Nombre de lots non occupés *</Label>
                    <Input
                      id="nombreLotNonOccupe"
                      type="number"
                      min="0"
                      value={formData.nombreLotNonOccupe || ''}
                      onChange={(e) => updateFormData('nombreLotNonOccupe', parseInt(e.target.value) || undefined)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Champs spécifiques aux industriels/investisseurs */}
          {formData.contactType === 'INDUSTRIEL_INVESTISSEUR' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Informations industriel/investisseur
                </CardTitle>
                <CardDescription>
                  Détails sur votre projet d'investissement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="descriptionActivite">Description de l'activité * (max 100 caractères)</Label>
                  <Textarea
                    id="descriptionActivite"
                    maxLength={100}
                    value={formData.descriptionActivite || ''}
                    onChange={(e) => updateFormData('descriptionActivite', e.target.value)}
                    placeholder="Décrivez brièvement votre activité..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {(formData.descriptionActivite || '').length}/100 caractères
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montantInvestissement">Montant d'investissement prévisionnel (MAD) *</Label>
                    <Input
                      id="montantInvestissement"
                      type="number"
                      min="0"
                      value={formData.montantInvestissement || ''}
                      onChange={(e) => updateFormData('montantInvestissement', parseFloat(e.target.value) || undefined)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombreEmploisPrevisionnel">Nombre d'emplois prévisionnels *</Label>
                    <Input
                      id="nombreEmploisPrevisionnel"
                      type="number"
                      min="0"
                      value={formData.nombreEmploisPrevisionnel || ''}
                      onChange={(e) => updateFormData('nombreEmploisPrevisionnel', parseInt(e.target.value) || undefined)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="superficieSouhaitee">Superficie souhaitée (m²) *</Label>
                    <Input
                      id="superficieSouhaitee"
                      type="number"
                      min="0"
                      value={formData.superficieSouhaitee || ''}
                      onChange={(e) => updateFormData('superficieSouhaitee', parseFloat(e.target.value) || undefined)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="regionImplantationSouhaitee">Région d'implantation souhaitée *</Label>
                    <Select 
                      value={formData.regionImplantationSouhaitee} 
                      onValueChange={(value) => updateFormData('regionImplantationSouhaitee', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ContactForm />
    </Suspense>
  )
}
