import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PROBLEM_STATEMENTS_DATA } from '@/app/api/seed-problems/route'
import { ensureDbUser } from '@/lib/ensureUser'

// In-memory short TTL cache (3 seconds) for the catalog & counts under high-concurrency swarms
let cachedCatalog: {
    data: {
        isProblemsReleased: boolean
        enrichedProblems: any[]
    }
    expiresAt: number
} | null = null

const CATALOG_CACHE_TTL = 3000 // 3 seconds

export async function GET() {
    try {
        const supabase = await createAdminClient()
        const now = Date.now()

        // 1. Fast path session check: Only invoke expensive cryptographic session decoding if session cookie exists
        const cookieStore = await cookies()
        const hasSessionCookie = cookieStore.getAll().some(c => c.name.includes('session-token'))

        let session: any = null
        if (hasSessionCookie) {
            session = await getServerSession(authOptions).catch(() => null)
        }
        const user = session?.user as any

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

        // 2. Fetch or reuse cached problem catalog
        let isProblemsReleased = false
        let enrichedProblems: any[] = []

        if (cachedCatalog && cachedCatalog.expiresAt > now) {
            isProblemsReleased = cachedCatalog.data.isProblemsReleased
            enrichedProblems = cachedCatalog.data.enrichedProblems
        } else {
            const [
                { data: config },
                { data: dbProblems },
                { data: selections }
            ] = await Promise.all([
                supabase.from('leaderboard_config').select('is_problems_released').eq('id', 1).maybeSingle(),
                supabase.from('problem_statements').select('*').order('statement_code', { ascending: true }),
                supabase.from('problem_selections').select('problem_id, team_id, teams(team_name)')
            ])

            isProblemsReleased = config?.is_problems_released ?? false

            const problemList = dbProblems && dbProblems.length > 0 ? dbProblems : PROBLEM_STATEMENTS_DATA.map((p) => ({
                id: `static-${p.statement_code}`,
                ...p,
                max_teams: 2
            }))

            const countMap: Record<string, number> = {}
            const teamMap: Record<string, string[]> = {}

            selections?.forEach((s: any) => {
                countMap[s.problem_id] = (countMap[s.problem_id] || 0) + 1
                if (!teamMap[s.problem_id]) teamMap[s.problem_id] = []
                if (s.teams?.team_name) teamMap[s.problem_id].push(s.teams.team_name)
            })

            enrichedProblems = problemList.map((p: any) => {
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

            cachedCatalog = {
                data: { isProblemsReleased, enrichedProblems },
                expiresAt: now + CATALOG_CACHE_TTL
            }
        }

        // 3. User team selection check (if logged in)
        let userTeamSelection: any = null
        let userTeam: any = null
        let isLeader = false

        if (userIds.length > 0) {
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

                if (userTeam) {
                    isLeader = userTeam.leader_id === activeUserId || userTeam.leader_id === user?.id
                }
            }
        }

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
                    'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=6'
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
                'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=6'
            }
        })
    } catch (error: any) {
        console.error('API problems error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
