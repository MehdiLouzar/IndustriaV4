import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers })
  }

  const response = NextResponse.next()
  headers.forEach((value, key) => response.headers.set(key, value))
  return response
}

export const config = {
  matcher: '/api/:path*'
}
