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

// In-memory cache for user records to eliminate repeated DB lookups under high concurrency
const userCache = new Map<string, { user: DbUser; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCachedUser(key: string): DbUser | null {
    const entry = userCache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        userCache.delete(key)
        return null
    }
    return entry.user
}

function setCachedUser(user: DbUser) {
    const entry = { user, expiresAt: Date.now() + CACHE_TTL_MS }
    if (user.id) userCache.set(user.id, entry)
    if (user.email) userCache.set(user.email.toLowerCase().trim(), entry)
}

/**
 * Ensures the authenticated user exists in the public.users database table.
 * Uses in-memory caching to eliminate redundant DB queries on high concurrency.
 */
export async function ensureDbUser(sessionUser: { id?: string; email?: string; name?: string; role?: string }): Promise<DbUser | null> {
    if (!sessionUser?.id && !sessionUser?.email) {
        return null
    }

    const emailLower = sessionUser.email?.toLowerCase().trim()

    // 0. Check in-memory cache first
    if (sessionUser.id) {
        const cached = getCachedUser(sessionUser.id)
        if (cached) return cached
    }
    if (emailLower) {
        const cached = getCachedUser(emailLower)
        if (cached) return cached
    }

    const supabase = await createAdminClient()

    // 1. Try finding user by ID
    if (sessionUser.id) {
        const { data: userById } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle()

        if (userById) {
            setCachedUser(userById as DbUser)
            return userById as DbUser
        }
    }

    // 2. Try finding user by email
    if (emailLower) {
        const { data: userByEmail } = await supabase
            .from('users')
            .select('*')
            .eq('email', emailLower)
            .maybeSingle()

        if (userByEmail) {
            setCachedUser(userByEmail as DbUser)
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
            if (fallbackUser) {
                setCachedUser(fallbackUser as DbUser)
                return fallbackUser as DbUser
            }
        }
        return null
    }

    if (insertedUser) {
        setCachedUser(insertedUser as DbUser)
    }

    return insertedUser as DbUser
}

