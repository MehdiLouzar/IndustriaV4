'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Lock, Loader } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
  requiredFunction?: string
  fallback?: React.ReactNode
}

export default function AdminGuard({ children, requiredFunction, fallback }: AdminGuardProps) {
  const { permissions, loading, error, canAccessFunction, hasAnyAdminRole } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !hasAnyAdminRole()) {
      // Rediriger vers la page d'accueil si pas d'accès admin
      router.push('/')
    }
  }, [loading, hasAnyAdminRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin" />
              <span>Vérification des permissions...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de permissions</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAnyAdminRole()) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
            <p className="text-gray-600">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiredFunction && !canAccessFunction(requiredFunction)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fonction non autorisée</h2>
            <p className="text-gray-600">
              Votre rôle ({permissions?.role}) ne permet pas d'accéder à cette fonction.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}