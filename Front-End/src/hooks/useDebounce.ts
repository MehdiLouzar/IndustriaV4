/**
 * Hook de debouncing pour optimisation des performances
 * 
 * Retarde l'exécution d'une mise à jour de valeur jusqu'à ce qu'un délai
 * spécifié se soit écoulé depuis la dernière tentative de changement.
 * 
 * Particulièrement utile pour :
 * - Optimiser les champs de recherche en temps réel
 * - Réduire la fréquence des appels API
 * - Éviter les re-rendus excessifs
 * 
 * @template T Type de la valeur à débouncer
 * @param value Valeur à débouncer
 * @param delay Délai en millisecondes avant mise à jour
 * @returns Valeur debouncée
 * 
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 300)
 * 
 * // L'API n'est appelée que 300ms après l'arrêt de la saisie
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm)
 *   }
 * }, [debouncedSearchTerm])
 * ```
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}