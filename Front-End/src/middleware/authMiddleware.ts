import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/auth')

  // If hitting /admin without a token, send to login with redirect back
  if (isAdminRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', `${pathname}${search || ''}`)
    return NextResponse.redirect(loginUrl)
  }

  // If already logged in and visiting /auth pages, bounce to intended redirect or /admin
  if (isAuthRoute && token) {
    const url = new URL(request.url)
    const redirectTo = url.searchParams.get('redirect') || '/admin'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}
