import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser, invalidateUserCache } from '@/lib/ensureUser'
import { getVolunteerEmails, addVolunteerEmail, removeVolunteerEmail } from '@/lib/attendanceStore'

export async function GET() {
    try {
        const supabase = await createAdminClient()
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await ensureDbUser(user)
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'
        if (!isOrganizer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const [
            { data: organizers, error: orgErr },
            { data: judges, error: judgeErr },
            volunteers
        ] = await Promise.all([
            supabase.from('organizer_emails').select('*').order('created_at', { ascending: false }),
            supabase.from('judge_emails').select('*').order('created_at', { ascending: false }),
            getVolunteerEmails()
        ])

        if (orgErr) console.error('Error fetching organizer emails:', orgErr)
        if (judgeErr) console.error('Error fetching judge emails:', judgeErr)

        return NextResponse.json({
            organizers: organizers || [],
            judges: judges || [],
            volunteers: volunteers || []
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createAdminClient()
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await ensureDbUser(user)
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'
        if (!isOrganizer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { email, role } = await request.json()
        if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })
        if (role !== 'organizer' && role !== 'judge' && role !== 'volunteer') {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        const lowerEmail = email.toLowerCase().trim()

        // Clean up from other lists to prevent conflicting roles
        if (role === 'organizer') {
            await supabase.from('judge_emails').delete().eq('email', lowerEmail)
            await removeVolunteerEmail(lowerEmail)
            const { data, error } = await supabase
                .from('organizer_emails')
                .insert([{ email: lowerEmail, added_by: dbUser?.id || user.id }])
                .select()
                .single()
            if (error) throw error
            await supabase.from('users').update({ role: 'organizer' }).eq('email', lowerEmail)
            invalidateUserCache(lowerEmail)
            return NextResponse.json({ success: true, invite: data })
        } else if (role === 'judge') {
            await supabase.from('organizer_emails').delete().eq('email', lowerEmail)
            await removeVolunteerEmail(lowerEmail)
            const { data, error } = await supabase
                .from('judge_emails')
                .insert([{ email: lowerEmail, added_by: dbUser?.id || user.id }])
                .select()
                .single()
            if (error) throw error
            await supabase.from('users').update({ role: 'judge' }).eq('email', lowerEmail)
            invalidateUserCache(lowerEmail)
            return NextResponse.json({ success: true, invite: data })
        } else if (role === 'volunteer') {
            await supabase.from('organizer_emails').delete().eq('email', lowerEmail)
            await supabase.from('judge_emails').delete().eq('email', lowerEmail)
            const volRecord = await addVolunteerEmail(lowerEmail, dbUser?.id || user.id)
            invalidateUserCache(lowerEmail)
            return NextResponse.json({ success: true, invite: volRecord })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Email already added' }, { status: 400 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createAdminClient()
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await ensureDbUser(user)
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'
        if (!isOrganizer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { email, role } = await request.json()
        if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })

        const lowerEmail = email.toLowerCase().trim()

        if (role === 'volunteer') {
            await removeVolunteerEmail(lowerEmail)
        } else {
            const table = role === 'organizer' ? 'organizer_emails' : 'judge_emails'
            await supabase.from(table).delete().eq('email', lowerEmail)
            // Revert them to participant if they exist in DB
            await supabase.from('users').update({ role: 'participant' }).eq('email', lowerEmail).eq('role', role)
        }

        invalidateUserCache(lowerEmail)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
