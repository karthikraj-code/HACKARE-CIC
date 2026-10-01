import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'

        if (!isOrganizer) {
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        // Fetch all participants
        const { data: participants, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, reg_no, dept, section, year, role, created_at')
            .eq('role', 'participant')
            .order('name', { ascending: true })

        if (usersError) {
            console.error('Error fetching participants:', usersError)
            return NextResponse.json({ error: usersError.message }, { status: 500 })
        }

        // Fetch all team memberships
        const { data: memberships, error: memError } = await supabase
            .from('team_members')
            .select(`
                user_id,
                team_id,
                teams (
                    id,
                    team_name,
                    team_code,
                    leader_id
                )
            `)

        if (memError) {
            console.error('Error fetching team memberships:', memError)
            return NextResponse.json({ error: memError.message }, { status: 500 })
        }

        // Map memberships by user_id
        const membershipMap = new Map<string, any>()
        if (memberships) {
            for (const m of memberships) {
                membershipMap.set(m.user_id, {
                    team_id: m.team_id,
                    team: m.teams
                })
            }
        }

        const students = (participants || []).map(p => {
            const memberInfo = membershipMap.get(p.id)
            return {
                ...p,
                is_assigned: Boolean(memberInfo),
                team_id: memberInfo?.team_id || null,
                team: memberInfo?.team || null,
                is_leader: memberInfo?.team ? memberInfo.team.leader_id === p.id : false
            }
        })

        return NextResponse.json({
            success: true,
            students: students
        })
    } catch (error: any) {
        console.error('Organizer GET students error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
