import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const role = (request.cookies.get('role')?.value || '').trim()
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/auth/login', '/auth/change-password', '/auth/forgot-password']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Root route role landing
  if (pathname === '/') {
    if (role === 'super_admin' || role === 'admin' || role === 'super_admin_viewer') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Removed super-admin routes: always redirect to /admin for allowed roles.
  if (pathname.startsWith('/super-admin')) {
    if (role === 'super_admin' || role === 'admin' || role === 'super_admin_viewer') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'super_admin' && role !== 'admin' && role !== 'super_admin_viewer') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Legacy accountant routes should no longer be accessible
  if (pathname.startsWith('/accountant') || pathname.startsWith('/owners')) {
    if (role === 'super_admin' || role === 'admin' || role === 'super_admin_viewer') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Specify which routes the proxy applies to
export const config = {
  matcher: ['/', '/super-admin/:path*', '/admin/:path*', '/accountant/:path*', '/owners/:path*'],
}
