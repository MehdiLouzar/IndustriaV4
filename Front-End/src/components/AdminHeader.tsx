'use client'

import Link from 'next/link'

export default function AdminHeader() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 h-12 flex items-center justify-end">
        <Link
          href="/admin"
          className="text-sm text-gray-700 hover:text-red-600"
        >
          Retour au dashboard
        </Link>
      </div>
    </header>
  )
}
