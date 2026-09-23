import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
        }

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)
        const activeUserId = dbUser?.id || user.id

        const { problem_id, team_id } = await request.json()

        if (!problem_id || !team_id) {
            return NextResponse.json({ error: 'Missing problem_id or team_id' }, { status: 400 })
        }

        // 1. Try invoking PostgreSQL atomic stored procedure with row-level locks
        const { data: rpcData, error: rpcError } = await supabase.rpc('select_problem_atomic', {
            p_team_id: team_id,
            p_problem_id: problem_id,
            p_user_id: activeUserId
        })

        if (!rpcError && rpcData) {
            if (rpcData.success) {
                return NextResponse.json({
                    success: true,
                    message: rpcData.message || 'Problem statement successfully locked!'
                })
            } else {
                return NextResponse.json({
                    error: rpcData.error || 'Failed to lock problem statement'
                }, { status: 400 })
            }
        }

        // 2. Fallback in case stored procedure is not yet applied in Supabase
        const { data: teamData, error: teamErr } = await supabase
            .from('teams')
            .select('id, team_name, leader_id, selected_problem_id')
            .eq('id', team_id)
            .single()

        if (teamErr || !teamData) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }

        let isLeader = teamData.leader_id === activeUserId || teamData.leader_id === user.id
        if (!isLeader) {
            return NextResponse.json({ error: 'Only the Team Leader can select and lock a problem statement.' }, { status: 403 })
        }

        if (teamData.selected_problem_id) {
            return NextResponse.json({ error: 'Your team has already locked a problem statement. Changes are not permitted.' }, { status: 400 })
        }

        // Check if the team already has a selection
        const { data: existingSelection } = await supabase
            .from('problem_selections')
            .select('id')
            .eq('team_id', team_id)
            .maybeSingle()

        if (existingSelection) {
            return NextResponse.json({ error: 'Your team has already locked a problem statement. Changes are not permitted.' }, { status: 400 })
        }

        // Verify Problem Statement exists and capacity constraint
        const { data: problemData } = await supabase
            .from('problem_statements')
            .select('id, title, max_teams, statement_code')
            .eq('id', problem_id)
            .single()

        const maxTeams = problemData?.max_teams || 2

        const { count: currentCount } = await supabase
            .from('problem_selections')
            .select('*', { count: 'exact', head: true })
            .eq('problem_id', problem_id)

        if (currentCount !== null && currentCount >= maxTeams) {
            return NextResponse.json({
                error: `This problem statement (${problemData?.statement_code || ''}) is already full (Maximum ${maxTeams} teams). Please choose another statement.`
            }, { status: 400 })
        }

        // Lock the selection
        const { error: insertErr } = await supabase
            .from('problem_selections')
            .insert([{
                problem_id,
                team_id
            }])

        if (insertErr) {
            console.error('Insert selection error:', insertErr)
            return NextResponse.json({
                error: 'Failed to lock problem statement. It may have just reached capacity with another team. Please try again.'
            }, { status: 400 })
        }

        await supabase
            .from('teams')
            .update({ selected_problem_id: problem_id })
            .eq('id', team_id)

        return NextResponse.json({
            success: true,
            message: `Problem statement successfully locked for ${teamData.team_name}!`
        })
    } catch (error: any) {
        console.error('Select problem error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

