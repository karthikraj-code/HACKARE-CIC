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

        if (userData?.role !== 'organizer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { is_released } = await request.json()

        const { error } = await supabase
            .from('leaderboard_config')
            .update({ is_released })
            .eq('id', 1)

        if (error) throw error

        return NextResponse.json({ success: true, is_released })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
