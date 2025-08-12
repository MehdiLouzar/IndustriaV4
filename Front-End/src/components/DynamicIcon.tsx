/**
 * Composant DynamicIcon - Rendu dynamique d'icônes Lucide React
 * 
 * Permet d'afficher des icônes Lucide React de manière dynamique
 * à partir de leur nom sous forme de chaîne de caractères.
 * 
 * Transforme automatiquement les noms avec tirets/underscores
 * en PascalCase pour correspondre aux noms des composants Lucide :
 * - 'map-pin' -> 'MapPin'
 * - 'user_circle' -> 'UserCircle'
 * - 'building 2' -> 'Building2'
 * 
 * Utilisé pour afficher les icônes d'activités et d'équipements
 * stockées en base de données sous forme de chaînes.
 * 
 * @param name Nom de l'icône (format kebab-case, snake_case ou espaces)
 * @param className Classes CSS à appliquer à l'icône
 * @returns Composant icône Lucide ou null si non trouvée
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

'use client'

import * as Icons from 'lucide-react'

/**
 * Convertit une chaîne en PascalCase
 * 
 * @param name Nom à convertir
 * @returns Nom en PascalCase
 */
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
