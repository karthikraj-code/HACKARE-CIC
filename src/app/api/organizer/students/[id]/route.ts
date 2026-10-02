import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser, invalidateUserCache } from '@/lib/ensureUser'

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const studentId = params.id

        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'

        if (!isOrganizer) {
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
        }

        // Safety check: Cannot delete own organizer account
        if (studentId === user.id || studentId === dbUser?.id || (user.email && studentId.toLowerCase() === user.email.toLowerCase())) {
            return NextResponse.json({ error: 'Cannot delete your own active organizer account' }, { status: 400 })
        }

        // 1. Fetch user to verify existence and get details
        let targetUser: any = null
        const { data: userById } = await supabase
            .from('users')
            .select('*')
            .eq('id', studentId)
            .maybeSingle()

        if (userById) {
            targetUser = userById
        } else {
            const { data: userByEmail } = await supabase
                .from('users')
                .select('*')
                .eq('email', studentId.toLowerCase().trim())
                .maybeSingle()
            targetUser = userByEmail
        }

        if (!targetUser) {
            return NextResponse.json({ error: 'Participant not found in database' }, { status: 404 })
        }

        const resolvedUserId = targetUser.id
        const studentName = targetUser.name || targetUser.email

        // 2. Fetch all teams this student belongs to
        const { data: teamMemberships } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', resolvedUserId)

        const teamIds = (teamMemberships || []).map(m => m.team_id)

        // 3. Remove from team_members
        const { error: teamMemDeleteError } = await supabase
            .from('team_members')
            .delete()
            .eq('user_id', resolvedUserId)

        if (teamMemDeleteError) {
            console.error('Error removing student from team_members:', teamMemDeleteError)
            return NextResponse.json({ error: 'Failed to remove student from team memberships: ' + teamMemDeleteError.message }, { status: 500 })
        }

        // 4. Handle team leader replacement if this student was the leader
        for (const tid of teamIds) {
            const { data: teamData } = await supabase
                .from('teams')
                .select('id, leader_id')
                .eq('id', tid)
                .maybeSingle()

            if (teamData && teamData.leader_id === resolvedUserId) {
                const { data: remainingMembers } = await supabase
                    .from('team_members')
                    .select('user_id')
                    .eq('team_id', tid)

                if (remainingMembers && remainingMembers.length > 0) {
                    await supabase
                        .from('teams')
                        .update({ leader_id: remainingMembers[0].user_id })
                        .eq('id', tid)
                } else {
                    await supabase
                        .from('teams')
                        .update({ leader_id: null })
                        .eq('id', tid)
                }
            }
        }

        // 5. Delete from public.users table
        const { error: userDeleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', resolvedUserId)

        if (userDeleteError) {
            console.error('Error deleting user from users table:', userDeleteError)
            return NextResponse.json({ error: 'Failed to delete student record: ' + userDeleteError.message }, { status: 500 })
        }

        // 6. Delete from Supabase Auth if applicable
        try {
            await supabase.auth.admin.deleteUser(resolvedUserId)
        } catch (authError) {
            console.log('Notice: Could not delete from Supabase Auth admin (may not exist):', authError)
        }

        // 7. Clear in-memory caches
        invalidateUserCache(resolvedUserId)
        if (targetUser.email) {
            invalidateUserCache(targetUser.email)
        }

        return NextResponse.json({
            success: true,
            message: `Participant "${studentName}" (${targetUser.email}) was permanently removed from the website and database.`
        })
    } catch (error: any) {
        console.error('Organizer DELETE student/[id] error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const studentId = params.id

        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'

        if (!isOrganizer) {
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        const body = await request.json()
        const { name, email, reg_no, dept, section, year } = body

        const updates: any = {}
        if (name !== undefined) updates.name = String(name).trim()
        if (email !== undefined) updates.email = String(email).trim().toLowerCase()
        if (reg_no !== undefined) updates.reg_no = reg_no ? String(reg_no).trim() : null
        if (dept !== undefined) updates.dept = dept ? String(dept).trim() : null
        if (section !== undefined) updates.section = section ? String(section).trim() : null
        if (year !== undefined) updates.year = year ? String(year).trim() : null

        const { data: updatedUser, error: updateErr } = await supabase
            .from('users')
            .update(updates)
            .eq('id', studentId)
            .select()
            .single()

        if (updateErr) {
            return NextResponse.json({ error: updateErr.message }, { status: 500 })
        }

        invalidateUserCache(studentId)
        if (updatedUser?.email) invalidateUserCache(updatedUser.email)

        return NextResponse.json({
            success: true,
            message: `Updated profile for "${updatedUser?.name || updatedUser?.email}".`,
            student: updatedUser
        })
    } catch (error: any) {
        console.error('Organizer PUT student/[id] error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
