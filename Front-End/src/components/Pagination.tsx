/**
 * Composant Pagination - Navigation paginée intelligente
 * 
 * Fournit une interface de pagination complète avec :
 * - Boutons Précédente/Suivante avec désactivation automatique
 * - Numérotation des pages avec ellipses pour les grandes listes
 * - Algorithme de regroupement intelligent (delta = 2)
 * - Affichage conditionnel (masqué si une seule page)
 * - Navigation directe vers n'importe quelle page
 * 
 * Logique d'affichage :
 * - Affiche toujours la page courante ± 2 pages
 * - Affiche toujours la première et dernière page
 * - Utilise des ellipses pour les gaps > 1
 * 
 * Exemple : [1] ... [8] [9] [10] [11] [12] ... [20]
 * 
 * @param totalItems Nombre total d'éléments
 * @param itemsPerPage Nombre d'éléments par page
 * @param currentPage Page actuellement sélectionnée (1-indexé)
 * @param onPageChange Callback appelé lors du changement de page
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Props du composant Pagination
 */
interface PaginationProps {
  /** Nombre total d'éléments à paginer */
  totalItems: number;
  /** Nombre d'éléments par page */
  itemsPerPage: number;
  /** Page actuellement sélectionnée (1-indexée) */
  currentPage: number;
  /** Callback appelé lors du changement de page */
  onPageChange: (page: number) => void;
}

export default function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  if (totalPages <= 1) return null;
  
  const delta = 2;
  const pages: (number | '…')[] = [];
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('…');
  }
  
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />Précédente
      </Button>
      <div className="flex gap-1">
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-2">…</span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Suivante <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
