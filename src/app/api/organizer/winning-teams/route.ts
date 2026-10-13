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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Try reading from winning_teams table first
        const { data: wtData, error: wtError } = await supabase
            .from('winning_teams')
            .select('*')
            .order('rank', { ascending: true })

        if (!wtError && wtData && wtData.length > 0) {
            const maxRank = Math.max(...wtData.map(w => w.rank), 3)
            const winningTeams: string[] = Array(maxRank).fill('')
            wtData.forEach(w => {
                if (w.rank >= 1 && w.rank <= maxRank) {
                    winningTeams[w.rank - 1] = w.team_name
                }
            })
            return NextResponse.json({
                success: true,
                winnerCount: maxRank,
                winningTeams
            })
        }

        // Fallback: check teams table for winner_rank
        const { data: teamsData } = await supabase
            .from('teams')
            .select('team_name, winner_rank')
            .not('winner_rank', 'is', null)
            .order('winner_rank', { ascending: true })

        if (teamsData && teamsData.length > 0) {
            const maxRank = Math.max(...teamsData.map((t: any) => t.winner_rank || 1), 3)
            const winningTeams: string[] = Array(maxRank).fill('')
            teamsData.forEach((t: any) => {
                if (t.winner_rank >= 1 && t.winner_rank <= maxRank) {
                    winningTeams[t.winner_rank - 1] = t.team_name
                }
            })
            return NextResponse.json({
                success: true,
                winnerCount: maxRank,
                winningTeams
            })
        }

        return NextResponse.json({
            success: true,
            winnerCount: 3,
            winningTeams: ['', '', '']
        })
    } catch (err: any) {
        console.error('Error fetching winning teams:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { winnerCount, winningTeams } = body

        if (!Array.isArray(winningTeams)) {
            return NextResponse.json({ error: 'winningTeams must be an array' }, { status: 400 })
        }

        const count = typeof winnerCount === 'number' ? Math.max(1, Math.min(25, winnerCount)) : winningTeams.length

        // 1. Update teams table winner_rank column
        try {
            // Reset all previous winner_ranks to null
            await supabase
                .from('teams')
                .update({ winner_rank: null })
                .not('winner_rank', 'is', null)

            // Set new ranks
            for (let i = 0; i < count; i++) {
                const teamName = (winningTeams[i] || '').trim()
                if (teamName) {
                    await supabase
                        .from('teams')
                        .update({ winner_rank: i + 1 })
                        .ilike('team_name', teamName)
                }
            }
        } catch (teamErr) {
            console.warn('Could not update winner_rank on teams table:', teamErr)
        }

        // 2. Update winning_teams table if it exists
        try {
            // Delete old records
            await supabase
                .from('winning_teams')
                .delete()
                .neq('rank', 0)

            // Insert new configured rows
            const rowsToInsert = []
            for (let i = 0; i < count; i++) {
                const teamName = (winningTeams[i] || '').trim()
                if (teamName) {
                    rowsToInsert.push({
                        rank: i + 1,
                        team_name: teamName,
                        award_title: i === 0 ? '1st Place Winner' : i === 1 ? '2nd Place Winner' : i === 2 ? '3rd Place Winner' : `Winner Rank ${i + 1}`,
                        updated_at: new Date().toISOString()
                    })
                }
            }

            if (rowsToInsert.length > 0) {
                await supabase
                    .from('winning_teams')
                    .insert(rowsToInsert)
            }
        } catch (wtErr) {
            console.warn('Could not insert into winning_teams table:', wtErr)
        }

        return NextResponse.json({
            success: true,
            winnerCount: count,
            winningTeams: winningTeams.slice(0, count),
            message: `Successfully saved ${winningTeams.filter(t => t && t.trim()).length} winning teams to Supabase database!`
        })
    } catch (err: any) {
        console.error('Error updating winning teams in database:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
