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
import { User, Calendar, Shield, Mail, LogOut } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  roles: string[]
  emailVerified: boolean
  enabled: boolean
  createdTimestamp?: number
}

interface TokenPayload {
  sub: string
  email?: string
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  realm_access?: {
    roles?: string[]
  }
  iat?: number
  exp?: number
}

function parseJwt(token: string): TokenPayload | null {
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/auth/login')
      return
    }

    const payload = parseJwt(token)
    if (!payload) {
      setError('Token invalide')
      setLoading(false)
      return
    }

    setTokenPayload(payload)

    // Créer un profil basé sur les données du token JWT
    const userProfile: UserProfile = {
      id: payload.sub,
      email: payload.email || payload.preferred_username || '',
      name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.preferred_username || '',
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: payload.realm_access?.roles?.filter(role => role !== 'default-roles-industria') || [],
      emailVerified: true, // Assumé vrai si l'utilisateur est connecté
      enabled: true,
      createdTimestamp: payload.iat ? payload.iat * 1000 : undefined
    }

    setProfile(userProfile)
    setLoading(false)
  }, [router])

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'ZONE_MANAGER':
        return 'bg-blue-100 text-blue-800'
      case 'CONTENT_MANAGER':
        return 'bg-green-100 text-green-800'
      case 'USER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-purple-100 text-purple-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur'
      case 'ZONE_MANAGER':
        return 'Gestionnaire de zones'
      case 'CONTENT_MANAGER':
        return 'Gestionnaire de contenu'
      case 'USER':
        return 'Utilisateur'
      default:
        return role
    }
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

  if (error || !profile || !tokenPayload) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Erreur</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {error || 'Impossible de charger les informations du profil.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/')} variant="outline">
                  Retour à l'accueil
                </Button>
                <Button onClick={logout} variant="destructive">
                  Se reconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
            <p className="text-gray-600">Informations de votre compte utilisateur</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nom d'utilisateur</Label>
                  <p className="text-lg font-medium">{tokenPayload.preferred_username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nom complet</Label>
                  <p className="text-lg">{profile.name || 'Non défini'}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Prénom</Label>
                  <p>{profile.firstName || 'Non défini'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nom de famille</Label>
                  <p>{profile.lastName || 'Non défini'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Adresse email
                </Label>
                <p className="text-lg flex items-center gap-2">
                  {profile.email}
                  {profile.emailVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Vérifié
                    </Badge>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rôles et permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Rôles et permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Rôles assignés</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.length > 0 ? (
                    profile.roles.map((role, index) => (
                      <Badge key={index} className={getRoleColor(role)}>
                        {getRoleLabel(role)}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">Utilisateur standard</Badge>
                  )}
                </div>
                
                {profile.roles.includes('ADMIN') && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      🛡️ Vous disposez de privilèges administrateur complets sur la plateforme.
                    </p>
                  </div>
                )}
                
                {profile.roles.includes('ZONE_MANAGER') && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-700">
                      🏭 Vous pouvez gérer les zones industrielles et leurs parcelles.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informations du compte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informations du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Identifiant unique</Label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">{profile.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Statut du compte</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={profile.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {profile.enabled ? '✓ Actif' : '✗ Désactivé'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {profile.createdTimestamp && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Membre depuis</Label>
                  <p>{new Date(profile.createdTimestamp).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              )}

              {tokenPayload.exp && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Session expire le</Label>
                  <p>{new Date(tokenPayload.exp * 1000).toLocaleString('fr-FR')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Link href="/">
                  <Button variant="outline">
                    ← Retour à l'accueil
                  </Button>
                </Link>
                
                {(profile.roles.includes('ADMIN') || profile.roles.includes('ZONE_MANAGER')) && (
                  <Link href="/admin">
                    <Button variant="outline">
                      🛠️ Dashboard Admin
                    </Button>
                  </Link>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => window.open('http://localhost:8081/realms/industria/account', '_blank')}
                >
                  ⚙️ Gérer le compte Keycloak
                </Button>

                <Button variant="destructive" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-700">
                  💡 <strong>Astuce :</strong> Pour modifier vos informations personnelles (nom, email, mot de passe), 
                  utilisez le lien "Gérer le compte Keycloak" ci-dessus.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  )
}