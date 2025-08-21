import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulateur d\'investissement | Industria',
  description: 'Simulez vos primes d\'investissement selon la Charte de l\'investissement du Maroc',
}

export default function SimulateurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}