import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
    const user = session?.user as any
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (userData?.role !== 'organizer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { data: organizers, error: orgErr } = await supabase.from('organizer_emails').select('*').order('created_at', { ascending: false })
        if (orgErr) throw orgErr

        const { data: judges, error: judgeErr } = await supabase.from('judge_emails').select('*').order('created_at', { ascending: false })
        if (judgeErr) throw judgeErr

        return NextResponse.json({ organizers: organizers || [], judges: judges || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
    const user = session?.user as any
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (userData?.role !== 'organizer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { email, role } = await request.json()
        if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })
        if (role !== 'organizer' && role !== 'judge') return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

        const lowerEmail = email.toLowerCase().trim()
        const table = role === 'organizer' ? 'organizer_emails' : 'judge_emails'

        // Prevent duplicates across tables
        if (role === 'organizer') {
            await supabase.from('judge_emails').delete().eq('email', lowerEmail)
        } else {
            await supabase.from('organizer_emails').delete().eq('email', lowerEmail)
        }

        const { data, error } = await supabase
            .from(table)
            .insert([{ email: lowerEmail, added_by: user.id }])
            .select()
            .single()

        if (error) throw error

        // Update public.users if they already exist
        await supabase.from('users').update({ role: role }).eq('email', lowerEmail)

        return NextResponse.json({ success: true, invite: data })
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Email already added' }, { status: 400 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
    const user = session?.user as any
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (userData?.role !== 'organizer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { email, role } = await request.json()
        if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })

        const table = role === 'organizer' ? 'organizer_emails' : 'judge_emails'
        const { error } = await supabase.from(table).delete().eq('email', email)
        if (error) throw error

        // Revert them to participant if they exist, to revoke access
        await supabase.from('users').update({ role: 'participant' }).eq('email', email).eq('role', role)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
