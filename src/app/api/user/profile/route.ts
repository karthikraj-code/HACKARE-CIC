import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()

        // 1. Fetch user data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 2. Fetch team data if user is in a team
        const { data: membership } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .single()

        let team = null
        if (membership?.team_id) {
            const { data: teamData } = await supabase
                .from('teams')
                .select(`
                    id,
                    team_name,
                    team_code,
                    leader_id,
                    invite_code,
                    team_members (
                        user_id,
                        users (id, name, email, reg_no, dept, section, year)
                    )
                `)

                .eq('id', membership.team_id)
                .single()

            team = teamData
        }

        return NextResponse.json({
            success: true,
            user: userData,
            team: team
        })
    } catch (error: any) {
        console.error('Profile GET error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { reg_no, dept, section, year, name } = await request.json()

        const supabase = await createAdminClient()

        const updates: any = {}
        if (reg_no !== undefined) updates.reg_no = reg_no ? String(reg_no).trim() : null
        if (dept !== undefined) updates.dept = dept ? String(dept).trim() : null
        if (section !== undefined) updates.section = section ? String(section).trim() : null
        if (year !== undefined) updates.year = year ? String(year).trim() : null
        if (name !== undefined && String(name).trim()) updates.name = String(name).trim()

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) {
            console.error('Update profile error:', updateError)
            return NextResponse.json({ error: updateError.message || 'Failed to update profile' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully!',
            user: updatedUser
        })
    } catch (error: any) {
        console.error('Profile POST error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
