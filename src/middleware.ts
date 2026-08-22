import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    // Only check auth state if we're on a dashboard or auth route
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
    
    // Skip token checks entirely for public API routes or non-dashboard routes to save latency
    if (!isAuthRoute && !isDashboardRoute) return NextResponse.next()

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    // If user is not logged in and trying to access protected route, redirect to login
    if (!token && isDashboardRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is logged in
    if (token) {
        const role = token.role as string || 'participant'

        // Route them properly out of generic root and login views
        if (isAuthRoute || request.nextUrl.pathname === '/dashboard') {
            const url = request.nextUrl.clone()
            url.pathname = `/dashboard/${role}`
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
