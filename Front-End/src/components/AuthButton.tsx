'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Payload { name?: string; preferred_username?: string; realm_access?: { roles?: string[] }; sub?: string }

function parseJwt(token: string): Payload | null {
  try {
    const base = token.split('.')[1]
    const json = atob(base)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export default function AuthButton() {
  const [token, setToken] = useState<string | null>(null)
  const [payload, setPayload] = useState<Payload | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('token')
      setToken(t)
      if (t) setPayload(parseJwt(t))
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setPayload(null)
    window.location.href = '/'
  }

  if (token && payload) {
    const roles = payload.realm_access?.roles || []
    const role = roles.find(r => r !== 'default-roles-industria') || roles[0]
    const hasAdmin = roles.includes('ADMIN') || roles.includes('ZONE_MANAGER') || roles.includes('CONTENT_MANAGER')
    const name = payload.name || payload.preferred_username
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
