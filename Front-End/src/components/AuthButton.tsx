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
import { logout } from '@/lib/utils'

/**
 * Structure du payload JWT décodé de Keycloak
 */
interface UserInfo {
  name?: string
  email?: string
  roles?: string[]
  role?: string
}

export default function AuthButton() {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = localStorage.getItem('userInfo')
      if (info) setUser(JSON.parse(info))
    }
  }, [])

  const handleLogout = () => {
    logout()
  }

  if (user) {
    const roles = user.roles || (user.role ? [user.role] : [])
    const role = roles.find(r => r !== 'default-roles-industria') || roles[0]
    const hasAdmin = roles.includes('ADMIN') || roles.includes('ZONE_MANAGER') || roles.includes('CONTENT_MANAGER')
    const name = user.name || user.email
    return (
      <div className="flex items-center gap-2">
        {name && <span className="text-sm">{name}</span>}
        {role && <Badge variant="secondary">{role}</Badge>}
        <Link href="/profile">
          <Button variant="outline" size="sm">Profil</Button>
        </Link>
        {hasAdmin && (
          <Link href="/admin">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
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
