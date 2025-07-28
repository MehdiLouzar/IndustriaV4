import { Button } from './ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-center space-x-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />Page précédente
      </Button>
      <div className="flex space-x-1">
        {pages.map(p => (
          <Button
            key={p}
            variant={p === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p)}
            className={p === currentPage ? 'header-red text-white' : ''}
          >
            {p}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Page suivante <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )
}
