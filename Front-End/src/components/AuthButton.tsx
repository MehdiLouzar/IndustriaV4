/**
 * Composant AuthButton - Bouton d'authentification intelligent
 * 
 * Gère l'affichage conditionnel de l'interface d'authentification :
 * - Boutons de connexion/inscription si utilisateur non connecté
 * - Profil utilisateur avec nom, rôle et actions si connecté
 * - Décodage automatique du token JWT pour extraire les informations
 * - Gestion des rôles Keycloak (ADMIN, ZONE_MANAGER, CONTENT_MANAGER)
 * - Déconnexion avec nettoyage du localStorage
 * 
 * Intègre parfaitement avec l'authentification Keycloak/OAuth2
 * utilisée par la plateforme Industria.
 * 
 * @returns Composant React adapté à l'état d'authentification
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCurrentUser, logout as logoutAction } from '@/lib/auth-actions'




export default function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    loadUser()
  }, [])

  const logout = async () => {
  await logoutAction() // This will handle cleanup and redirect
  }

  if (loading) {
  return null // Or a loading spinner
  }

  if (user) {
    const userRole = user.role
    const hasAdmin = userRole === 'ADMIN' || userRole === 'ZONE_MANAGER' || userRole === 'CONTENT_MANAGER'
    const name = user.name || user.email
    return (
      <div className="flex items-center gap-2">
        {name && <span className="text-sm">{name}</span>}
        {userRole && <Badge variant="secondary">{userRole}</Badge>}
        <Link href="/profile">
          <Button variant="outline" size="sm">Profil</Button>
        </Link>
        {hasAdmin && (
          <Link href="/admin">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="outline" size="sm">
          <User className="w-4 h-4 mr-2" />
          Connexion
        </Button>
      </Link>
      <Link href="/auth/register">
        <Button className="header-red text-white hover:opacity-90" size="sm">
          S'inscrire
        </Button>
      </Link>
    </div>
  )
}
