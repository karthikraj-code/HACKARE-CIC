import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { PROBLEM_STATEMENTS_DATA } from '@/app/api/seed-problems/route'
import { ensureDbUser } from '@/lib/ensureUser'

export async function GET() {
    try {
        const supabase = await createAdminClient()
        const session = await getServerSession(authOptions);
        const user = session?.user as any

        // 0. Fetch problem statements release status
        const { data: config } = await supabase
            .from('leaderboard_config')
            .select('is_problems_released')
            .eq('id', 1)
            .single()

        const isProblemsReleased = config?.is_problems_released ?? false

        // Fetch user role
        let userRole = 'participant'
        if (user?.id) {
            const { data: uData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()
            if (uData?.role) userRole = uData.role
        }

        const isPrivileged = userRole === 'organizer' || userRole === 'judge'

        // 1. Fetch all problem statements from DB
        const { data: dbProblems, error: psError } = await supabase
            .from('problem_statements')
            .select('*')
            .order('statement_code', { ascending: true })

        // If DB table empty or not yet migrated, fallback to static list
        let problemList = dbProblems && dbProblems.length > 0 ? dbProblems : PROBLEM_STATEMENTS_DATA.map((p, idx) => ({
            id: `static-${p.statement_code}`,
            ...p,
            max_teams: 2
        }))

        // 2. Fetch all current selections
        const { data: selections } = await supabase
            .from('problem_selections')
            .select('problem_id, team_id, teams(team_name)')

        // Also check if any team selections exist
        const countMap: Record<string, number> = {}
        const teamMap: Record<string, string[]> = {}

        selections?.forEach((s: any) => {
            countMap[s.problem_id] = (countMap[s.problem_id] || 0) + 1
            if (!teamMap[s.problem_id]) teamMap[s.problem_id] = []
            if (s.teams?.team_name) teamMap[s.problem_id].push(s.teams.team_name)
        })

        // 3. Check current user's team selection
        let userTeamSelection: any = null
        let userTeam: any = null
        let isLeader = false
        let dbUser: any = null
        let activeUserId: string | undefined = undefined

        if (user?.id || user?.email) {
            dbUser = await ensureDbUser(user)
            activeUserId = dbUser?.id || user?.id
            const userIds = [activeUserId, user?.id].filter(Boolean)

            const { data: membership } = await supabase
                .from('team_members')
                .select('team_id, teams(*)')
                .in('user_id', userIds)
                .maybeSingle()

            if (membership?.team_id) {
                userTeam = membership.teams

                const { data: teamSel } = await supabase
                    .from('problem_selections')
                    .select('*, problem_statements(*)')
                    .eq('team_id', membership.team_id)
                    .maybeSingle()

                userTeamSelection = teamSel
            }
        }

        if (userTeam) {
            if (userTeam.leader_id === activeUserId || userTeam.leader_id === user?.id) {
                isLeader = true
            } else if (user?.email || dbUser?.email) {
                const userEmail = (dbUser?.email || user.email)?.toLowerCase().trim()
                const { data: leaderUser } = await supabase
                    .from('users')
                    .select('email')
                    .eq('id', userTeam.leader_id)
                    .maybeSingle()

                if (leaderUser?.email?.toLowerCase().trim() === userEmail) {
                    isLeader = true
                }
            }
        }

        const enrichedProblems = problemList.map((p: any) => {
            const currentTeams = countMap[p.id] || countMap[p.statement_code] || 0
            const maxTeams = p.max_teams || 2
            return {
                ...p,
                current_teams: currentTeams,
                max_teams: maxTeams,
                slots_remaining: Math.max(0, maxTeams - currentTeams),
                is_full: currentTeams >= maxTeams,
                assigned_teams: teamMap[p.id] || []
            }
        })

        // If not released yet and user is a participant, hide problem list from view
        if (!isProblemsReleased && !isPrivileged) {
            return NextResponse.json({
                success: true,
                is_released: false,
                problem_statements: [],
                user_team: userTeam,
                is_leader: isLeader,
                user_team_selection: userTeamSelection
            })
        }

        return NextResponse.json({
            success: true,
            is_released: isProblemsReleased,
            problem_statements: enrichedProblems,
            user_team: userTeam,
            is_leader: isLeader,
            user_team_selection: userTeamSelection
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

