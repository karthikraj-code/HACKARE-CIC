import { createAdminClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export interface DbUser {
    id: string
    name: string
    email: string
    role: string
    reg_no?: string
    dept?: string
    section?: string
    year?: string
    created_at?: string
}

/**
 * Ensures the authenticated user exists in the public.users database table.
 * If not present, creates the user record with the admin client to satisfy foreign key constraints.
 */
export async function ensureDbUser(sessionUser: { id?: string; email?: string; name?: string; role?: string }): Promise<DbUser | null> {
    if (!sessionUser?.id && !sessionUser?.email) {
        return null
    }

    const supabase = await createAdminClient()
    const emailLower = sessionUser.email?.toLowerCase().trim()

    // 1. Try finding user by ID
    if (sessionUser.id) {
        const { data: userById, error: idError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle()

        if (userById) {
            return userById as DbUser
        }
    }

    // 2. Try finding user by email
    if (emailLower) {
        const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', emailLower)
            .maybeSingle()

        if (userByEmail) {
            return userByEmail as DbUser
        }
    }

    // 3. User does not exist in users table -> Insert now using Admin client
    const intendedRole = sessionUser.role || 'participant'
    const generatedId = sessionUser.id || crypto.randomUUID()
    const userName = sessionUser.name?.trim() || (emailLower ? emailLower.split('@')[0] : 'Participant')
    const userEmail = emailLower || `${generatedId}@hackare.local`

    const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert([{
            id: generatedId,
            name: userName,
            email: userEmail,
            role: intendedRole
        }])
        .select('*')
        .single()

    if (insertError) {
        console.error('[ensureDbUser] Error inserting user into public.users:', insertError)
        
        // Concurrent insert fallback
        if (emailLower) {
            const { data: fallbackUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', emailLower)
                .maybeSingle()
            if (fallbackUser) return fallbackUser as DbUser
        }
        return null
    }

    return insertedUser as DbUser
}
