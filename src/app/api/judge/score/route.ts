import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
    const user = session?.user as any

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'judge') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { team_id, round_id, score, feedback } = await request.json()

        if (!team_id || !round_id || score === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Verify judge is assigned to this team
        const { data: assignment } = await supabase
            .from('judge_assignments')
            .select('team_id')
            .eq('team_id', team_id)
            .eq('judge_id', user.id)
            .single()

        if (!assignment) {
            return NextResponse.json({ error: 'You are not assigned to grade this team' }, { status: 403 })
        }

        // 2. Perform Upsert for Score
        // Since unique constraint exists on (team_id, round_id, judge_id), we can check and update or insert
        const { data: existingScore } = await supabase
            .from('scores')
            .select('id')
            .eq('team_id', team_id)
            .eq('round_id', round_id)
            .eq('judge_id', user.id)
            .single()

        if (existingScore) {
            const { error } = await supabase
                .from('scores')
                .update({ score, feedback, graded_at: new Date().toISOString() })
                .eq('id', existingScore.id)

            if (error) throw error
        } else {
            const { error } = await supabase
                .from('scores')
                .insert([{ team_id, round_id, judge_id: user.id, score, feedback }])

            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
