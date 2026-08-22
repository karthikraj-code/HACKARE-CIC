import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"

// We use the supabase-js client with the service role key to bypass RLS during auth operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njhswgbpznciomguahkk.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseKey)

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 Days
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google" && user.email) {
                const emailLower = user.email.toLowerCase()

                // Concurrently fetch existing user data and whitelist status to eliminate DB cascading delays
                const [
                    { data: userData },
                    { data: orgData },
                    { data: judgeData }
                ] = await Promise.all([
                    supabase.from('users').select('id, role').eq('email', emailLower).maybeSingle(),
                    supabase.from('organizer_emails').select('email').eq('email', emailLower).maybeSingle(),
                    supabase.from('judge_emails').select('email').eq('email', emailLower).maybeSingle()
                ])

                let intendedRole = 'participant'
                if (orgData) {
                    intendedRole = 'organizer'
                } else if (judgeData) {
                    intendedRole = 'judge'
                }

                if (!userData) {
                    // Create new user with explicit UUID
                    const generatedId = crypto.randomUUID()
                    const { data: newUserData, error } = await supabase
                        .from('users')
                        .insert([{
                            id: generatedId,
                            name: user.name || user.email.split('@')[0],
                            email: emailLower,
                            role: intendedRole
                        }])
                        .select()
                        .single()
                    
                    if (error) {
                        console.error('Error creating user:', error)
                        return false // Deny login if we can't create the user
                    }
                    // Attach the DB ID to the NextAuth user object for the JWT
                    user.id = newUserData?.id || generatedId
                    ;(user as any).role = intendedRole
                } else {

                    // If their intended role is different/higher now, update it
                    if (intendedRole !== 'participant' && userData.role !== intendedRole) {
                        await supabase.from('users').update({ role: intendedRole }).eq('id', userData.id)
                        ;(user as any).role = intendedRole
                    } else {
                        ;(user as any).role = userData.role || 'participant'
                    }
                    user.id = userData.id
                }
            }
            return true
        },
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                token.id = user.id
                token.role = (user as any).role
            }
            return token
        },
        async session({ session, token }) {
            // Forward token claims to session
            if (session.user) {
                ;(session.user as any).id = token.id as string
                ;(session.user as any).role = token.role as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
        error: '/login', // Error code passed in query string as ?error=
    }
}
