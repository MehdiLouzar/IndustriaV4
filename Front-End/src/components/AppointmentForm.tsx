'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchApi } from '@/lib/utils'

interface Parcel {
  id: string
  reference: string
  area?: number
}

interface Props {
  parcel?: Parcel
  onClose: () => void
}

export default function AppointmentForm({ parcel, onClose }: Props) {
  const [open, setOpen] = useState(true)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [company, setCompany] = useState('')
  const [activityType, setActivityType] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [investmentBudget, setInvestmentBudget] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [urgency, setUrgency] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetchApi('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactName,
          contactEmail, 
          contactPhone,
          company,
          activityType,
          projectDescription,
          investmentBudget,
          preferredDate,
          preferredTime,
          urgency,
          parcelId: parcel?.id 
        })
      })
      alert('Votre demande de rendez-vous a été envoyée avec succès ! Nous vous contacterons bientôt.')
      setOpen(false)
      onClose()
    } catch (error) {
      alert('Erreur lors de l\'envoi de votre demande. Veuillez réessayer.')
    }
  }

  // Obtenir la date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Demande de rendez-vous pour visite{parcel ? ` - Parcelle ${parcel.reference}` : ''}
          </DialogTitle>
          {parcel?.area && (
            <p className="text-sm text-gray-600">Surface: {parcel.area.toLocaleString()} m²</p>
          )}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input 
                id="name" 
                value={contactName} 
                onChange={(e) => setContactName(e.target.value)} 
                required 
                placeholder="Votre nom et prénom"
              />
            </div>
            <div>
              <Label htmlFor="company">Entreprise *</Label>
              <Input 
                id="company" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
                required 
                placeholder="Nom de votre entreprise"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                value={contactEmail} 
                onChange={(e) => setContactEmail(e.target.value)} 
                required 
                placeholder="votre.email@entreprise.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={contactPhone} 
                onChange={(e) => setContactPhone(e.target.value)} 
                required
                placeholder="+212 6 XX XX XX XX"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="activityType">Type d'activité envisagée *</Label>
            <Select value={activityType} onValueChange={setActivityType} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre secteur d'activité" />
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
            <Label htmlFor="projectDescription">Description du projet *</Label>
            <Textarea 
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              required
              placeholder="Décrivez brièvement votre projet industriel, vos besoins en superficie, équipements..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="investmentBudget">Budget d'investissement estimé</Label>
            <Select value={investmentBudget} onValueChange={setInvestmentBudget}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une fourchette (optionnel)" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredDate">Date souhaitée pour la visite</Label>
              <Input 
                id="preferredDate" 
                type="date" 
                value={preferredDate} 
                min={today}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="preferredTime">Créneau horaire préféré</Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
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
          </div>

          <div>
            <Label htmlFor="urgency">Urgence du projet</Label>
            <Select value={urgency} onValueChange={setUrgency}>
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); onClose() }}>
              Annuler
            </Button>
            <Button type="submit" className="bg-industria-brown-gold hover:bg-industria-olive-light">
              Envoyer la demande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
