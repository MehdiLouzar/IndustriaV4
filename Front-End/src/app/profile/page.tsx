'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { fetchApi } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string
  company?: string
  phone?: string
  role?: string
}

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64)
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState<User & { password?: string }>({
    id: '',
    email: '',
    name: '',
    company: '',
    phone: '',
    role: ''
  })

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/auth/login')
      return
    }
    const payload = parseJwt(token)
    const id = payload?.sub
    if (!id) return
    fetchApi<User>(`/api/users/${id}`).then((u) => {
      if (u) {
        setUser(u)
        setForm({ id: u.id, email: u.email, name: u.name || '', company: u.company || '', phone: u.phone || '', role: u.role })
      }
    })
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = { email: form.email, name: form.name, company: form.company || undefined, phone: form.phone || undefined, password: form.password }
    await fetchApi(`/api/users/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    router.push('/')
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="company">Société</Label>
                <Input id="company" name="company" value={form.company} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input id="password" name="password" type="password" value={form.password || ''} onChange={handleChange} />
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-red-600">← Retour à l'accueil</Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
