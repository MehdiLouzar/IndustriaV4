'use client'

/**
 * Hook de gestion des permissions utilisateur
 * 
 * Vérifie les droits d'accès de l'utilisateur connecté pour l'interface
 * d'administration avec support des rôles hiérarchiques.
 * 
 * Rôles supportés :
 * - ADMIN : Accès complet
 * - ZONE_MANAGER : Gestion des zones assignées
 * - MANAGER : Accès limité aux fonctions de gestion
 * - USER : Pas d'accès admin
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

import { useState, useEffect } from 'react'
import { useSecureApi } from '@/hooks/use-api'

/**
 * Structure des données de permissions retournées par l'API
 */
interface PermissionData {
  /** Indique si l'utilisateur a accès à l'administration */
  hasAccess: boolean
  /** Rôle de l'utilisateur (ADMIN, ZONE_MANAGER, MANAGER) */
  role?: string
  /** Liste des fonctions admin accessibles */
  availableFunctions?: string[]
  /** Message d'information ou d'erreur */
  message?: string
}

/**
 * Hook principal de gestion des permissions
 * 
 * @returns Objet avec permissions, loading, error et fonctions utilitaires
 */
export function usePermissions() {
  const { data: permissions, loading, error, refetch } = useSecureApi<PermissionData>('/api/admin/access')

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
    refetch
  }
}