import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { ensureDbUser } from '@/lib/ensureUser'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)
        const activeUserId = dbUser?.id || user.id

        const {
            round_id,
            text_response,
            file_url,
            link,
            github_url,
            chatgpt_link_2
        } = await request.json()

        if (!round_id) {
            return NextResponse.json({ error: 'Round ID is required' }, { status: 400 })
        }

        // 1. Check if user is in a team and is the leader
        const { data: membership } = await supabase
            .from('team_members')
            .select('team_id')
            .in('user_id', [activeUserId, user.id].filter(Boolean))
            .maybeSingle()

        if (!membership) return NextResponse.json({ error: 'You must join or create a team before submitting.' }, { status: 400 })

        const { data: team } = await supabase
            .from('teams')
            .select('id, leader_id, team_name')
            .eq('id', membership.team_id)
            .single()

        const isLeader = team?.leader_id === activeUserId || team?.leader_id === user.id

        if (!isLeader) {
            return NextResponse.json({ error: 'Only the Team Leader can submit work for the team.' }, { status: 403 })
        }

        // 2. Validate round time and mandatory fields
        const { data: round } = await supabase
            .from('rounds')
            .select('id, name, round_number, end_time, submission_type')
            .eq('id', round_id)
            .single()

        if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 })

        const now = new Date()
        const endTime = new Date(round.end_time)

        if (now > endTime) {
            return NextResponse.json({ error: 'Submission deadline has passed for this round.' }, { status: 400 })
        }

        const config = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
        if (config.fields.text.enabled && config.fields.text.required && !text_response?.trim()) {
            return NextResponse.json({ error: `${config.fields.text.label || 'Written response'} is required.` }, { status: 400 })
        }
        if (config.fields.live_demo.enabled && config.fields.live_demo.required && !file_url?.trim()) {
            return NextResponse.json({ error: `${config.fields.live_demo.label || 'Live link / Demo URL'} is required.` }, { status: 400 })
        }
        if (config.fields.github.enabled && config.fields.github.required && !github_url?.trim()) {
            return NextResponse.json({ error: `${config.fields.github.label || 'GitHub repository URL'} is required.` }, { status: 400 })
        }
        if (config.fields.ppt.enabled && config.fields.ppt.required && !link?.trim()) {
            return NextResponse.json({ error: `${config.fields.ppt.label || 'Presentation link'} is required.` }, { status: 400 })
        }

        // 3. Upsert submission
        const { data: existingSub } = await supabase
            .from('submissions')
            .select('id')
            .eq('team_id', membership.team_id)
            .eq('round_id', round_id)
            .maybeSingle()

        let submissionResult;

        if (existingSub) {
            const { data, error } = await supabase
                .from('submissions')
                .update({
                    text_response,
                    file_url,
                    link,
                    github_url,
                    chatgpt_link_2,
                    submitted_at: new Date().toISOString()
                })
                .eq('id', existingSub.id)
                .select()
                .single()

            if (error) throw error
            submissionResult = data
        } else {
            const { data, error } = await supabase
                .from('submissions')
                .insert([{
                    team_id: membership.team_id,
                    round_id,
                    text_response,
                    file_url,
                    link,
                    github_url,
                    chatgpt_link_2,
                    submitted_at: new Date().toISOString()
                }])
                .select()
                .single()

            if (error) throw error
            submissionResult = data
        }

        return NextResponse.json({ success: true, submission: submissionResult, message: 'Submission recorded successfully!' })
    } catch (error: any) {
        console.error('Submit error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
