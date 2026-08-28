import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()

        // Ensure user exists in public.users to satisfy foreign key constraint
        const dbUser = await ensureDbUser(user)
        if (!dbUser) {
            return NextResponse.json({ error: 'Failed to verify user record in database. Please re-login.' }, { status: 500 })
        }

        const { invite_code } = await request.json()

        if (!invite_code?.trim()) {
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
        }

        const trimmedCode = invite_code.trim().toUpperCase()

        // Check if user is already in a team
        const { data: existingMember } = await supabase
            .from('team_members')
            .select('team_id')
            .in('user_id', [dbUser.id, user.id].filter(Boolean))
            .maybeSingle()

        if (existingMember) {
            return NextResponse.json({ error: 'You are already in a team' }, { status: 400 })
        }

        // Find the team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, team_members(count)')
            .eq('invite_code', trimmedCode)
            .maybeSingle()

        if (teamError || !team) {
            return NextResponse.json({ error: 'Invalid invite code or team not found' }, { status: 404 })
        }

        // Validate team size (max 4)
        const currentMemberCount = team.team_members?.[0]?.count || 0
        if (currentMemberCount >= 4) {
            return NextResponse.json({ error: 'Team is already full (max 4 members)' }, { status: 400 })
        }

        // Add user to team
        const { error: joinError } = await supabase
            .from('team_members')
            .insert([
                {
                    team_id: team.id,
                    user_id: dbUser.id
                }
            ])

        if (joinError) {
            console.error('Join team error:', joinError)
            return NextResponse.json({ error: joinError.message || 'Failed to join team' }, { status: 500 })
        }

        return NextResponse.json({ success: true, team_id: team.id })
    } catch (error: any) {
        console.error('Team join API error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
