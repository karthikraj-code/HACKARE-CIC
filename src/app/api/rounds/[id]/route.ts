import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ensureDbUser } from '@/lib/ensureUser'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)

        // Verify user is an organizer
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'
        if (!isOrganizer) {
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        const body = await request.json()
        const { round_number, name, description, start_time, end_time, submission_type, rubric } = body

        const updatePayload: any = {}
        if (name !== undefined) updatePayload.name = String(name).trim()
        if (description !== undefined) updatePayload.description = description
        if (start_time !== undefined) updatePayload.start_time = start_time
        if (end_time !== undefined) updatePayload.end_time = end_time
        if (round_number !== undefined && round_number !== null) updatePayload.round_number = Number(round_number)
        if (submission_type !== undefined) updatePayload.submission_type = submission_type
        if (rubric !== undefined) updatePayload.rubric = rubric

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('rounds')
            .update(updatePayload)
            .eq('id', resolvedParams.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating round:', error)
            return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 })
        }

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Unexpected error updating round:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
