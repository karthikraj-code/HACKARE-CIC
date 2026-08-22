import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin, protocol, host } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    // Handle Vercel deployment correctly using forwarded proxy headers
    const forwardedProto = request.headers.get('x-forwarded-proto') || protocol
    const forwardedHost = request.headers.get('x-forwarded-host') || host
    
    // Construct the absolute base URL based on where the request actually arrived
    const finalOrigin = `${forwardedProto}://${forwardedHost}`

    if (code) {
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            // Check if user exists in public.users table
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single()

            // Check if this email is in the DB organizer or judge list
            let intendedRole = 'participant'

            if (data.user.email) {
                const emailLower = data.user.email.toLowerCase()

                // 1. Check if they are an organizer
                const { data: orgData } = await supabase
                    .from('organizer_emails')
                    .select('email')
                    .eq('email', emailLower)
                    .single()

                if (orgData) {
                    intendedRole = 'organizer'
                } else {
                    // 2. If not an organizer, check if they are a judge
                    const { data: judgeData } = await supabase
                        .from('judge_emails')
                        .select('email')
                        .eq('email', emailLower)
                        .single()

                    if (judgeData) {
                        intendedRole = 'judge'
                    }
                }
            }

            let finalRole = intendedRole

            // If user doesn't exist, insert them
            if (!userData) {
                await supabase.from('users').insert([{
                    id: data.user.id,
                    name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                    email: data.user.email,
                    role: intendedRole
                }])
            } else {
                // If their intended role is higher/different than their current role (e.g. they were added to a whitelist after registering)
                if (intendedRole !== 'participant' && userData.role !== intendedRole) {
                    await supabase.from('users').update({ role: intendedRole }).eq('id', data.user.id)
                    finalRole = intendedRole
                } else {
                    finalRole = userData.role || 'participant'
                }
            }

            // Redirect to correct dashboard based on role
            return NextResponse.redirect(`${finalOrigin}/dashboard/${finalRole}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${finalOrigin}/login?error=auth-failed`)
}
