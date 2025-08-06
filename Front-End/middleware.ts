import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Allow public pages
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = req.cookies.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }

