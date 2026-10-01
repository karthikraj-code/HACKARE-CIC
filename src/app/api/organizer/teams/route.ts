import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function GET() {
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

        const { data: teams, error } = await supabase
            .from('teams')
            .select(`
                id, 
                team_name, 
                team_code,
                leader_id,
                invite_code,
                selected_problem_id,
                created_at,
                team_members (
                    user_id,
                    users (
                        id,
                        name,
                        email,
                        reg_no,
                        dept,
                        section,
                        year,
                        role
                    )
                ),
                problem_selections (
                    problem_id,
                    problem_statements (
                        id,
                        statement_code,
                        title,
                        domain,
                        max_teams
                    )
                ),
                judge_assignments (
                    judge_id
                )
            `)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching teams:', error)
            return NextResponse.json({ error: error.message || 'Failed to fetch teams' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            teams: teams || []
        })
    } catch (error: any) {
        console.error('Organizer GET teams error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
