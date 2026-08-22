import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

        // Check if user is already in a team
        const { data: existingMember } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .single()

        if (existingMember) {
            return NextResponse.json({ error: 'You are already in a team' }, { status: 400 })
        }

        // Generate unique 5 character invite code
        const invite_code = crypto.randomBytes(3).toString('hex').substring(0, 5).toUpperCase()

        // Create the team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert([
                {
                    team_name: trimmedTeamName,
                    team_code: trimmedTeamCode,
                    leader_id: user.id,
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
                    user_id: user.id
                }
            ])

        if (memberError) {
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
