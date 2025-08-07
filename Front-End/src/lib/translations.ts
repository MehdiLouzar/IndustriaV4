// Traductions centralisées des enums backend

export interface EnumOption {
  value: string
  label: string
  color?: string
}

// Types de prix
export const PRICE_TYPES: EnumOption[] = [
  { value: 'PER_SQUARE_METER', label: 'Prix au m²' },
  { value: 'FIXED_PRICE', label: 'Prix fixe' }
]

// Types de construction  
export const CONSTRUCTION_TYPES: EnumOption[] = [
  { value: 'CUSTOM_BUILD', label: 'Construction personnalisée' },
  { value: 'OWNER_BUILT', label: 'Auto-construction' },
  { value: 'LAND_LEASE_ONLY', label: 'Location terrain uniquement' },
  { value: 'TURNKEY', label: 'Clé en main' }
]

// Statuts des zones
export const ZONE_STATUSES: EnumOption[] = [
  { value: 'LIBRE', label: 'Libre', color: 'bg-green-100 text-green-800' },
  { value: 'RESERVEE', label: 'Réservée', color: 'bg-orange-100 text-orange-800' },
  { value: 'INDISPONIBLE', label: 'Indisponible', color: 'bg-red-100 text-red-800' },
  { value: 'VENDU', label: 'Vendu', color: 'bg-blue-100 text-blue-800' },
  { value: 'EN_DEVELOPPEMENT', label: 'En développement', color: 'bg-purple-100 text-purple-800' }
]

// Statuts des parcelles  
export const PARCEL_STATUSES: EnumOption[] = [
  { value: 'LIBRE', label: 'Libre', color: 'bg-green-100 text-green-800' },
  { value: 'RESERVEE', label: 'Réservée', color: 'bg-orange-100 text-orange-800' },
  { value: 'INDISPONIBLE', label: 'Indisponible', color: 'bg-red-100 text-red-800' },
  { value: 'VENDU', label: 'Vendu', color: 'bg-blue-100 text-blue-800' },
  { value: 'EN_DEVELOPPEMENT', label: 'En développement', color: 'bg-purple-100 text-purple-800' }
]

// Statuts des notifications
export const NOTIFICATION_STATUSES: EnumOption[] = [
  { value: 'PENDING', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SENT', label: 'Envoyé', color: 'bg-green-100 text-green-800' },
  { value: 'FAILED', label: 'Échec', color: 'bg-red-100 text-red-800' },
  { value: 'DELIVERED', label: 'Livré', color: 'bg-blue-100 text-blue-800' }
]

// Statuts des rendez-vous
export const APPOINTMENT_STATUSES: EnumOption[] = [
  { value: 'PENDING', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-800' },
  { value: 'RESCHEDULED', label: 'Reprogrammé', color: 'bg-orange-100 text-orange-800' }
]

// Rôles des utilisateurs
export const USER_ROLES: EnumOption[] = [
  { value: 'USER', label: 'Utilisateur', color: 'bg-gray-100 text-gray-800' },
  { value: 'ZONE_MANAGER', label: 'Gestionnaire de zone', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTENT_MANAGER', label: 'Gestionnaire de contenu', color: 'bg-purple-100 text-purple-800' },
  { value: 'ADMIN', label: 'Administrateur', color: 'bg-red-100 text-red-800' }
]

// Actions d'audit
export const AUDIT_ACTIONS: EnumOption[] = [
  { value: 'CREATE', label: 'Création', color: 'bg-green-100 text-green-800' },
  { value: 'UPDATE', label: 'Modification', color: 'bg-blue-100 text-blue-800' },
  { value: 'DELETE', label: 'Suppression', color: 'bg-red-100 text-red-800' },
  { value: 'SOFT_DELETE', label: 'Suppression logique', color: 'bg-orange-100 text-orange-800' },
  { value: 'RESTORE', label: 'Restauration', color: 'bg-teal-100 text-teal-800' },
  { value: 'LOGIN', label: 'Connexion', color: 'bg-purple-100 text-purple-800' },
  { value: 'LOGOUT', label: 'Déconnexion', color: 'bg-gray-100 text-gray-800' },
  { value: 'APPOINTMENT_CONFIRMED', label: 'RDV confirmé', color: 'bg-blue-100 text-blue-800' },
  { value: 'APPOINTMENT_CANCELLED', label: 'RDV annulé', color: 'bg-red-100 text-red-800' },
  { value: 'APPOINTMENT_RESCHEDULED', label: 'RDV reprogrammé', color: 'bg-orange-100 text-orange-800' }
]

// Fonction utilitaire pour obtenir le label d'un enum
export function getEnumLabel(enumArray: EnumOption[], value: string): string {
  const option = enumArray.find(option => option.value === value)
  return option?.label || value
}

// Fonction utilitaire pour obtenir la couleur d'un enum
export function getEnumColor(enumArray: EnumOption[], value: string): string {
  const option = enumArray.find(option => option.value === value)
  return option?.color || 'bg-gray-100 text-gray-800'
}

// Fonction pour créer un badge avec traduction
export function getEnumBadge(enumArray: EnumOption[], value: string): { label: string; color: string } {
  const option = enumArray.find(option => option.value === value)
  return {
    label: option?.label || value,
    color: option?.color || 'bg-gray-100 text-gray-800'
  }
}