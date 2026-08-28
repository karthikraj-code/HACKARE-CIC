import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeRubric } from '@/lib/rubricConfig'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'organizer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const {
            round_number,
            name,
            description,
            start_time,
            end_time,
            submission_type,
            rubric
        } = await request.json()

        if (!name || !start_time || !end_time) {
            return NextResponse.json({ error: 'Missing required fields: name, start_time, or end_time' }, { status: 400 })
        }

        // Default rubric if not provided
        const finalRubric = rubric || normalizeRubric(null, round_number ? Number(round_number) : 1, name)

        const { data, error } = await supabase
            .from('rounds')
            .insert([
                {
                    round_number: round_number ? Number(round_number) : 1,
                    name,
                    description,
                    start_time,
                    end_time,
                    submission_type: submission_type || ['text'],
                    rubric: finalRubric
                }
            ])
            .select()
            .single()

        if (error) {
            console.error('Error creating round:', error)
            return NextResponse.json({ error: error.message || 'Failed to create round' }, { status: 500 })
        }

        return NextResponse.json({ success: true, round: data })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
