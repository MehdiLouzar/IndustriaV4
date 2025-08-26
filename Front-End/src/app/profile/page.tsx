'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { User, Shield, Mail, LogOut } from 'lucide-react'
import { logout } from '@/lib/utils'

interface UserProfile {
  id: string
  email: string
  name: string
  roles?: string[]
  role?: string
  company?: string
  phone?: string
  isActive?: boolean
  zoneCount?: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const info = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null
    if (!info) {
      router.push('/auth/login')
      return
    }
    try {
      setProfile(JSON.parse(info))
    } catch {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    logout()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!profile) {
    return null
  }

  const roles = profile.roles || (profile.role ? [profile.role] : [])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nom complet</Label>
                <p className="text-lg">{profile.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Adresse email
                </Label>
                <p className="text-lg">{profile.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Rôles et permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roles.length > 0 ? (
                  roles.map((role, index) => (
                    <Badge key={index} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">Utilisateur</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Link href="/">
                  <Button variant="outline">← Retour à l'accueil</Button>
                </Link>
                {(roles.includes('ADMIN') || roles.includes('ZONE_MANAGER')) && (
                  <Link href="/admin">
                    <Button variant="outline">🛠️ Dashboard Admin</Button>
                  </Link>
                )}
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  )
}
