/**
 * Définitions de types TypeScript pour l'application Industria
 * 
 * Centralise les interfaces et types communs utilisés à travers
 * l'application frontend pour assurer la cohérence des données
 * et la sécurité de type.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

/**
 * Réponse paginee standard de l'API
 * 
 * Format standardisé pour toutes les listes paginées retournees
 * par l'API backend (zones, régions, utilisateurs, etc.).
 * 
 * @template T Type des éléments contenus dans la liste
 */
export interface ListResponse<T> {
  /** Tableau des éléments de la page courante */
  items: T[]
  /** Nombre total d'éléments dans la collection */
  totalItems: number
  /** Nombre total de pages disponibles */
  totalPages: number
  /** Numéro de la page courante (commence à 0) */
  page: number
  /** Nombre d'éléments par page */
  limit: number
}
