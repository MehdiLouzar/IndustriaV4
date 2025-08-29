import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const userInfo = request.cookies.get('user_info')?.value
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/auth')

  // Debug logging
  console.log('[Middleware Debug]', {
    pathname,
    hasAccessToken: !!token,
    hasUserInfo: !!userInfo,
    tokenLength: token?.length || 0,
    cookies: request.cookies.getAll().map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })),
    isAdminRoute,
    isAuthRoute,
    headers: {
      host: request.headers.get('host'),
      cookie: request.headers.get('cookie')?.substring(0, 100) + '...'
    }
  })

  // Clone URL for redirects
  const url = request.nextUrl.clone()

  // If hitting /admin without a token, send to login with redirect back
  if (isAdminRoute && !token) {
    console.log('[Middleware] No token for admin route, redirecting to login')
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', `${pathname}${search || ''}`)
    return NextResponse.redirect(url)
  }

  // If already logged in and visiting /auth pages, bounce to intended redirect or /admin
  if (isAuthRoute && token) {
    console.log('[Middleware] Has token on auth route, redirecting away')
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