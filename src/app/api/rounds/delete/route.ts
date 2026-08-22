import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
    const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify Organizer role
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'organizer') {
            return NextResponse.json({ error: 'Forbidden. Organizers only.' }, { status: 403 })
        }

        const { roundId } = await request.json()

        if (!roundId) {
            return NextResponse.json({ error: 'Round ID is required' }, { status: 400 })
        }

        // Delete the round. Since we used "ON DELETE CASCADE" in the schema, 
        // all submissions, scores, and quiz questions associated with this round will automatically be deleted too.
        const { error } = await supabase
            .from('rounds')
            .delete()
            .eq('id', roundId)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
