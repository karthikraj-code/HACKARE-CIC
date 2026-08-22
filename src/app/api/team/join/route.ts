import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
    const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { invite_code } = await request.json()

        if (!invite_code) {
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
        }

        // Check if user is already in a team
        const { data: existingMember } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .single()

        if (existingMember) {
            return NextResponse.json({ error: 'You are already in a team' }, { status: 400 })
        }

        // Find the team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, team_members(count)')
            .eq('invite_code', invite_code.toUpperCase())
            .single()

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
                    user_id: user.id
                }
            ])

        if (joinError) {
            return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
        }

        return NextResponse.json({ success: true, team_id: team.id })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
