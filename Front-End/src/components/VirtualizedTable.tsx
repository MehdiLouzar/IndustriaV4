/**
 * Composant VirtualizedTable - Table haute performance avec virtualisation
 * 
 * Implémente une table virtualisée pour afficher efficacement de grandes
 * quantités de données sans impacter les performances du navigateur.
 * 
 * Caractéristiques :
 * - Virtualisation via react-window pour optimiser le rendu
 * - Support des milliers d'entrées sans ralentissement
 * - Mémorisation des composants pour éviter les re-rendus
 * - En-tête de table fixe avec headers personnalisables
 * - Gestion gracieuse des états vides
 * 
 * Utilisée dans l'interface d'administration pour afficher les listes
 * de zones, utilisateurs, et autres données volumineuses.
 * 
 * @template T Type des éléments à afficher (doit avoir un id)
 * @param items Tableau des données à afficher
 * @param height Hauteur fixe de la table en pixels
 * @param itemHeight Hauteur de chaque ligne en pixels
 * @param renderItem Fonction de rendu pour chaque élément
 * @param headers Titres des colonnes
 * @param className Classes CSS supplémentaires
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

import { memo, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'

/**
 * Props du composant VirtualizedTable
 */
interface VirtualizedTableProps<T> {
  /** Tableau des éléments à afficher */
  items: T[]
  /** Hauteur totale de la table */
  height: number
  /** Hauteur de chaque ligne */
  itemHeight: number
  /** Fonction de rendu pour chaque élément */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Titres des colonnes */
  headers: string[]
  /** Classes CSS optionnelles */
  className?: string
}

function VirtualizedTableComponent<T extends { id: string }>({ 
  items, 
  height, 
  itemHeight, 
  renderItem,
  headers,
  className = ""
}: VirtualizedTableProps<T>) {
  
  const Row = memo(({ index, style }: { index: number, style: any }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  ))
  
  Row.displayName = 'VirtualizedRow'

  const memoizedItems = useMemo(() => items, [items])

  if (items.length === 0) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              {headers.map((header, i) => (
                <th key={i} className="p-2">{header}</th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="p-8 text-center text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            {headers.map((header, i) => (
              <th key={i} className="p-2">{header}</th>
            ))}
          </tr>
        </thead>
      </table>
      <List
        height={height}
        itemCount={memoizedItems.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </List>
    </div>
  )
}

export const VirtualizedTable = memo(VirtualizedTableComponent) as <T extends { id: string }>(
  props: VirtualizedTableProps<T>
) => JSX.Element