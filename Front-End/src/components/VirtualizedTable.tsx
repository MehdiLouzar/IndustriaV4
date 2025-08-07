import { memo, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'

interface VirtualizedTableProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  headers: string[]
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