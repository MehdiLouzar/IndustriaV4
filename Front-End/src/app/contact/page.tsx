'use client'
import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import AppointmentForm from '@/components/AppointmentForm'

export default function ContactPage() {
  const [open, setOpen] = useState(false)
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-12 space-y-6 text-center">
        <h1 className="text-3xl font-bold">Contactez-nous</h1>
        <p>Vous souhaitez proposer une nouvelle zone industrielle ? Prenez rendez-vous avec notre équipe.</p>
        <Button className="header-red text-white" onClick={() => setOpen(true)}>
          Prise de rendez-vous
        </Button>
      </div>
      <Footer />
      {open && <AppointmentForm onClose={() => setOpen(false)} />}
    </main>
  )
}
