'use client'

import * as Icons from 'lucide-react'

function toPascal(name: string) {
  return name
    .split(/[-_\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export default function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null
  const key = toPascal(name)
  const Icon = (Icons as Record<string, React.FC<{ className?: string }>>)[key]
  if (!Icon) return null
  return <Icon className={className} />
}
