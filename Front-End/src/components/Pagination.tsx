import { Button } from './ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  if (totalPages <= 1) return null
  const delta = 2
  const pages: (number | '…')[] = []
  const start = Math.max(1, currentPage - delta)
  const end = Math.min(totalPages, currentPage + delta)

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('…')
  }
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('…')
    pages.push(totalPages)
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
  )
}
