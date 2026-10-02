import { createAdminClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export interface AttendanceSession {
    id: string
    name: string
    slot: 'morning' | 'afternoon' | 'evening' | 'night' | 'custom'
    date: string
    is_active?: boolean
    created_by?: string
    created_at?: string
}

export interface AttendanceRecord {
    id: string
    session_id: string
    user_id: string
    status: 'present' | 'absent'
    marked_by?: string
    marked_at?: string
    notes?: string
}

export interface VolunteerEmail {
    email: string
    added_by?: string | null
    created_at: string
}

function getInitialSessions(): Omit<AttendanceSession, 'created_at'>[] {
    const today = new Date().toISOString().slice(0, 10)
    return [
        {
            id: crypto.randomUUID(),
            name: 'Day 1 - Morning Check-in',
            slot: 'morning',
            date: today,
            is_active: true
        },
        {
            id: crypto.randomUUID(),
            name: 'Day 1 - Afternoon Session',
            slot: 'afternoon',
            date: today,
            is_active: false
        },
        {
            id: crypto.randomUUID(),
            name: 'Day 1 - Evening Review',
            slot: 'evening',
            date: today,
            is_active: false
        },
        {
            id: crypto.randomUUID(),
            name: 'Day 1 - Night Hack Session',
            slot: 'night',
            date: today,
            is_active: false
        }
    ]
}

// ==========================================
// VOLUNTEER EMAILS (Supabase public.volunteer_emails)
// ==========================================
export async function getVolunteerEmails(): Promise<VolunteerEmail[]> {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('volunteer_emails')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[attendanceStore] getVolunteerEmails error:', error.message)
            return []
        }
        return data || []
    } catch (e) {
        console.error('[attendanceStore] getVolunteerEmails exception:', e)
        return []
    }
}

export async function isVolunteerEmail(email: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim()
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('volunteer_emails')
            .select('email')
            .eq('email', cleanEmail)
            .maybeSingle()

        if (!error && data) return true
        return false
    } catch (e) {
        console.error('[attendanceStore] isVolunteerEmail exception:', e)
        return false
    }
}

export async function addVolunteerEmail(email: string, addedBy?: string): Promise<VolunteerEmail> {
    const cleanEmail = email.toLowerCase().trim()
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('volunteer_emails')
        .insert([{ email: cleanEmail, added_by: addedBy || null }])
        .select()
        .single()

    if (error) {
        console.error('[attendanceStore] addVolunteerEmail error:', error.message)
        throw error
    }
    return data
}

export async function removeVolunteerEmail(email: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim()
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('volunteer_emails')
        .delete()
        .eq('email', cleanEmail)

    if (error) {
        console.error('[attendanceStore] removeVolunteerEmail error:', error.message)
        throw error
    }
    return true
}

// ==========================================
// ATTENDANCE SESSIONS (Supabase public.attendance_sessions)
// ==========================================
export async function getAttendanceSessions(): Promise<AttendanceSession[]> {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('attendance_sessions')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            if (data.length > 0) {
                return data
            }
            // Seed initial sessions into Supabase table if empty
            const initial = getInitialSessions()
            const { data: seeded, error: seedErr } = await supabase
                .from('attendance_sessions')
                .insert(initial)
                .select('*')
                .order('created_at', { ascending: false })

            if (!seedErr && seeded && seeded.length > 0) {
                return seeded
            }
            return initial as AttendanceSession[]
        }
        return []
    } catch (err) {
        console.error('[attendanceStore] getAttendanceSessions error:', err)
        return []
    }
}

export async function createAttendanceSession(
    name: string,
    slot: 'morning' | 'afternoon' | 'evening' | 'night' | 'custom',
    date?: string,
    createdBy?: string
): Promise<AttendanceSession> {
    const today = date || new Date().toISOString().slice(0, 10)
    const newSession = {
        id: crypto.randomUUID(),
        name: name.trim(),
        slot: slot,
        date: today,
        is_active: true,
        created_by: createdBy || null
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([newSession])
        .select()
        .single()

    if (error) {
        console.error('[attendanceStore] createAttendanceSession error:', error.message)
        throw error
    }
    return data
}

export async function deleteAttendanceSession(sessionId: string): Promise<boolean> {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('id', sessionId)

    if (error) {
        console.error('[attendanceStore] deleteAttendanceSession error:', error.message)
        throw error
    }
    return true
}

// ==========================================
// ATTENDANCE RECORDS (Supabase public.attendance_records)
// ==========================================
export async function getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('session_id', sessionId)

        if (error) {
            console.error('[attendanceStore] getAttendanceRecords error:', error.message)
            return []
        }
        return data || []
    } catch (e) {
        console.error('[attendanceStore] getAttendanceRecords exception:', e)
        return []
    }
}

export async function markAttendance(
    sessionId: string,
    userId: string,
    status: 'present' | 'absent',
    markedBy?: string,
    notes?: string
): Promise<AttendanceRecord> {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('attendance_records')
        .upsert([{
            session_id: sessionId,
            user_id: userId,
            status: status,
            marked_by: markedBy || null,
            marked_at: new Date().toISOString(),
            notes: notes || null
        }], {
            onConflict: 'session_id, user_id'
        })
        .select()
        .single()

    if (error) {
        console.error('[attendanceStore] markAttendance error:', error.message)
        throw error
    }
    return data
}

export async function bulkMarkAttendance(
    sessionId: string,
    userIds: string[],
    status: 'present' | 'absent',
    markedBy?: string
): Promise<number> {
    const now = new Date().toISOString()
    const records = userIds.map(uid => ({
        session_id: sessionId,
        user_id: uid,
        status: status,
        marked_by: markedBy || null,
        marked_at: now
    }))

    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('attendance_records')
        .upsert(records, {
            onConflict: 'session_id, user_id'
        })

    if (error) {
        console.error('[attendanceStore] bulkMarkAttendance error:', error.message)
        throw error
    }
    return userIds.length
}
