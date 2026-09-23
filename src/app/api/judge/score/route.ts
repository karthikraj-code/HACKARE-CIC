import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)
        const activeUserId = dbUser?.id || user.id

        const isJudge = user.role === 'judge' || dbUser?.role === 'judge'
        if (!isJudge) {
            return NextResponse.json({ error: 'Forbidden: Judge access required' }, { status: 403 })
        }

        const { team_id, round_id, score, feedback, criteria_scores } = await request.json()

        if (!team_id || !round_id || score === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Verify judge is assigned to this team
        const { data: assignment } = await supabase
            .from('judge_assignments')
            .select('team_id')
            .eq('team_id', team_id)
            .in('judge_id', [activeUserId, user.id].filter(Boolean))
            .maybeSingle()

        if (!assignment) {
            return NextResponse.json({ error: 'You are not assigned to grade this team' }, { status: 403 })
        }

        // 2. Perform Atomic Upsert for Score
        const { error: upsertError } = await supabase
            .from('scores')
            .upsert([{
                team_id,
                round_id,
                judge_id: activeUserId,
                score: Number(score),
                feedback: feedback || '',
                criteria_scores: criteria_scores || {},
                graded_at: new Date().toISOString()
            }], {
                onConflict: 'team_id, round_id, judge_id'
            })

        if (upsertError) {
            console.error('Score upsert error:', upsertError)
            throw upsertError
        }

        return NextResponse.json({ success: true, message: 'Score recorded successfully!' })
    } catch (error: any) {
        console.error('Score submit error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
