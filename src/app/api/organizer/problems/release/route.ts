import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createAdminClient()
        const { data: config } = await supabase
            .from('leaderboard_config')
            .select('is_problems_released')
            .eq('id', 1)
            .single()

        return NextResponse.json({
            success: true,
            is_released: config?.is_problems_released ?? false
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch release status' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()

        // Verify organizer permissions
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'organizer') {
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        const body = await request.json()
        const isReleased = Boolean(body.is_released)

        const { data, error } = await supabase
            .from('leaderboard_config')
            .upsert({ id: 1, is_problems_released: isReleased }, { onConflict: 'id' })
            .select()
            .single()

        if (error) {
            console.error('Error updating problem release status:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            is_released: isReleased,
            message: isReleased 
                ? 'Problem statements successfully released to participants!' 
                : 'Problem statements successfully hidden from participants.'
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
