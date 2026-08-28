import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { ensureDbUser } from '@/lib/ensureUser'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()

        // Ensure user exists in public.users to satisfy foreign key constraint (teams_leader_id_fkey)
        const dbUser = await ensureDbUser(user)
        if (!dbUser) {
            return NextResponse.json({ error: 'Failed to verify user record in database. Please re-login.' }, { status: 500 })
        }

        const { team_name, team_code } = await request.json()

        if (!team_name?.trim()) {
            return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
        }

        if (!team_code?.trim()) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
        }

        const trimmedTeamName = team_name.trim()
        const trimmedTeamCode = team_code.trim().toUpperCase()

        // Check if user is already in a team (check with both dbUser.id and user.id)
        const { data: existingMember } = await supabase
            .from('team_members')
            .select('team_id')
            .in('user_id', [dbUser.id, user.id].filter(Boolean))
            .maybeSingle()

        if (existingMember) {
            return NextResponse.json({ error: 'You are already in a team' }, { status: 400 })
        }

        // Generate unique 5 character invite code
        const invite_code = crypto.randomBytes(3).toString('hex').substring(0, 5).toUpperCase()

        // Create the team with guaranteed valid dbUser.id as leader_id
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert([
                {
                    team_name: trimmedTeamName,
                    team_code: trimmedTeamCode,
                    leader_id: dbUser.id,
                    invite_code
                }
            ])
            .select()
            .single()

        if (teamError) {
            console.error('Error creating team:', teamError)
            return NextResponse.json({ error: teamError.message }, { status: 500 })
        }

        // Add leader to team_members
        const { error: memberError } = await supabase
            .from('team_members')
            .insert([
                {
                    team_id: team.id,
                    user_id: dbUser.id
                }
            ])

        if (memberError) {
            console.error('Error adding team member:', memberError)
            // Cleanup team if member insertion fails
            await supabase.from('teams').delete().eq('id', team.id)
            return NextResponse.json({ error: 'Failed to add user to team' }, { status: 500 })
        }

        return NextResponse.json({ team })
    } catch (error: any) {
        console.error('Team create API error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
