'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { fetchApi } from '@/lib/utils'

interface Parcel {
  id: string
  reference: string
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
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await fetchApi('/api/public/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contactName, 
        contactEmail, 
        contactPhone,
        parcelId: parcel?.id 
      })
    })
    setOpen(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Prendre rendez-vous{parcel ? ` – ${parcel.reference}` : ''}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Input id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit">Envoyer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
