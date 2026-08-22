import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const requestUrl = new URL(request.url)

    const response = NextResponse.redirect(`${requestUrl.origin}/login`, {
        status: 302,
    })
    
    // Clear both localhost and secure Vercel edge/TLS NextAuth session cookies
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.session-token')
    
    return response
}
