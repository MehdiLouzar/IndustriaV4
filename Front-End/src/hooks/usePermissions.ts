'use client'

import { useState, useEffect } from 'react'
import { fetchApi } from '@/lib/utils'

interface PermissionData {
  hasAccess: boolean
  role?: string
  availableFunctions?: string[]
  message?: string
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetchApi<PermissionData>('/api/admin/access')
      setPermissions(response)
      setError(null)
    } catch (err) {
      setError('Erreur lors de la vérification des permissions')
      setPermissions({ hasAccess: false })
    } finally {
      setLoading(false)
    }
  }

  const canAccessFunction = (functionName: string): boolean => {
    if (!permissions?.hasAccess) return false
    return permissions.availableFunctions?.includes(functionName) ?? false
  }

  const isAdmin = (): boolean => {
    return permissions?.role === 'ADMIN'
  }

  const isManager = (): boolean => {
    return permissions?.role === 'ZONE_MANAGER' || permissions?.role === 'MANAGER'
  }

  const hasAnyAdminRole = (): boolean => {
    return permissions?.hasAccess ?? false
  }

  return {
    permissions,
    loading,
    error,
    canAccessFunction,
    isAdmin,
    isManager,
    hasAnyAdminRole,
    refetch: checkPermissions
  }
}