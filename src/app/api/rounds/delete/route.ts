import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function DELETE(request: Request) {
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
            return NextResponse.json({ error: 'Forbidden. Organizers only.' }, { status: 403 })
        }

        const { roundId } = await request.json()

        if (!roundId) {
            return NextResponse.json({ error: 'Round ID is required' }, { status: 400 })
        }

        // Delete the round. With ON DELETE CASCADE, child records are also cleaned up.
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
