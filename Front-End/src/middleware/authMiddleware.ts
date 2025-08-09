import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Vérifier si l'utilisateur essaie d'accéder aux pages admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Vérifier la présence du token
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      // Rediriger vers la page de connexion si pas de token
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Le token existe, mais nous devons vérifier les permissions côté serveur
    // Pour l'instant, laisser passer et la vérification sera faite dans le composant
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}