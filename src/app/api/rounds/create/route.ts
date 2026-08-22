import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

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
            name,
            description,
            start_time,
            end_time,
            submission_type,
            rubric
        } = await request.json()

        // Default rubric if not provided
        const finalRubric = rubric || {
            Innovation: 10,
            'Technical feasibility': 10,
            Presentation: 10,
            Impact: 10
        }

        const { data, error } = await supabase
            .from('rounds')
            .insert([
                {
                    name,
                    description,
                    start_time,
                    end_time,
                    submission_type,
                    rubric: finalRubric
                }
            ])
            .select()
            .single()

        if (error) {
            console.error(error)
            return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
        }

        return NextResponse.json({ success: true, round: data })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
