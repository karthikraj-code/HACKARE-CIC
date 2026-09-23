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

        // 1. Fetch user role and DB user from cache
        let dbUser: any = null
        let activeUserId: string | undefined = undefined
        let userRole = user?.role || 'participant'

        if (user?.id || user?.email) {
            dbUser = await ensureDbUser(user)
            activeUserId = dbUser?.id || user?.id
            userRole = user?.role || dbUser?.role || 'participant'
        }

        const isPrivileged = userRole === 'organizer' || userRole === 'judge'
        const userIds = [activeUserId, user?.id].filter(Boolean)

        // 2. Fetch config, problem statements, selections, and user's team membership in parallel
        const [
            { data: config },
            { data: dbProblems },
            { data: selections },
            userMembershipResult
        ] = await Promise.all([
            supabase.from('leaderboard_config').select('is_problems_released').eq('id', 1).single(),
            supabase.from('problem_statements').select('*').order('statement_code', { ascending: true }),
            supabase.from('problem_selections').select('problem_id, team_id, teams(team_name)'),
            userIds.length > 0 
                ? supabase.from('team_members').select('team_id, teams(*)').in('user_id', userIds).maybeSingle()
                : Promise.resolve({ data: null })
        ])

        const isProblemsReleased = config?.is_problems_released ?? false

        // If DB table empty or not yet migrated, fallback to static list
        let problemList = dbProblems && dbProblems.length > 0 ? dbProblems : PROBLEM_STATEMENTS_DATA.map((p) => ({
            id: `static-${p.statement_code}`,
            ...p,
            max_teams: 2
        }))

        // Count selections per problem
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

        const membership = userMembershipResult?.data as any
        if (membership?.team_id) {
            userTeam = membership.teams

            const { data: teamSel } = await supabase
                .from('problem_selections')
                .select('*, problem_statements(*)')
                .eq('team_id', membership.team_id)
                .maybeSingle()

            userTeamSelection = teamSel

            if (userTeam) {
                isLeader = userTeam.leader_id === activeUserId || userTeam.leader_id === user?.id
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
            }, {
                headers: {
                    'Cache-Control': 'private, max-age=4, stale-while-revalidate=8'
                }
            })
        }

        return NextResponse.json({
            success: true,
            is_released: isProblemsReleased,
            problem_statements: enrichedProblems,
            user_team: userTeam,
            is_leader: isLeader,
            user_team_selection: userTeamSelection
        }, {
            headers: {
                'Cache-Control': 'private, max-age=4, stale-while-revalidate=8'
            }
        })
    } catch (error: any) {
        console.error('API problems error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

