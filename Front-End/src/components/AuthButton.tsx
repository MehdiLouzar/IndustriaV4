'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AuthButton() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'))
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    window.location.href = '/'
  }

  if (token) {
    return (
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut className="w-4 h-4 mr-2" />
        Déconnexion
      </Button>
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
