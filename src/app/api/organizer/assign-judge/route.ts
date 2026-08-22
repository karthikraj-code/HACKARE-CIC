import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Trust the role from the NextAuth session token (set during sign-in in auth.ts).
        // This avoids a redundant DB lookup that can silently return null when RLS or
        // network issues arise, incorrectly triggering the 403.
        const userRole = user.role
        console.log('[assign-judge] user.id:', user.id, 'role from session:', userRole)

        if (userRole !== 'organizer') {
            return NextResponse.json({ error: 'Forbidden', debug: { userId: user.id, role: userRole } }, { status: 403 })
        }

        const { team_id, judge_id, action } = await request.json()
        console.log('[assign-judge] incoming request:', { team_id, judge_id, action })

        if (!judge_id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (action === 'assign') {
            if (!team_id) return NextResponse.json({ error: 'Team ID required for assign' }, { status: 400 })
            const { error } = await supabase
                .from('judge_assignments')
                .insert([{ team_id, judge_id }])
            if (error) throw error
        } else if (action === 'remove') {
            if (!team_id) return NextResponse.json({ error: 'Team ID required for remove' }, { status: 400 })
            const { error } = await supabase
                .from('judge_assignments')
                .delete()
                .eq('team_id', team_id)
                .eq('judge_id', judge_id)
            if (error) throw error
        } else if (action === 'bulk_assign') {
            // Fetch all team IDs
            const { data: teams, error: teamsErr } = await supabase.from('teams').select('id')
            if (teamsErr) throw teamsErr
            
            if (teams && teams.length > 0) {
                // Prepare upsert to avoid duplicates if some are already assigned
                const assignments = teams.map(t => ({ team_id: t.id, judge_id }))
                const { error: bulkErr } = await supabase
                    .from('judge_assignments')
                    .upsert(assignments, { onConflict: 'team_id,judge_id' })
                if (bulkErr) throw bulkErr
            }
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
