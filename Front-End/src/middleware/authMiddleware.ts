import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/auth')

  // Clone the URL to avoid modifying the original
  const url = request.nextUrl.clone()

  // If hitting /admin without a token, send to login with redirect back
  if (isAdminRoute && !token) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', `${pathname}${search || ''}`)
    return NextResponse.redirect(url)
  }

  // If already logged in and visiting /auth pages, bounce to intended redirect or /admin
  if (isAuthRoute && token) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/admin'
    // Ensure redirectTo is a relative path
    if (redirectTo.startsWith('/')) {
      url.pathname = redirectTo
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}