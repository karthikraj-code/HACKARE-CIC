import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser, invalidateUserCache } from '@/lib/ensureUser'
import { isVolunteerEmail } from '@/lib/attendanceStore'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'
        const isVolunteer = user.role === 'volunteer' || dbUser?.role === 'volunteer' || (user.email && await isVolunteerEmail(user.email))

        if (!isOrganizer && !isVolunteer) {
            return NextResponse.json({ error: 'Forbidden: Organizer or Volunteer access required' }, { status: 403 })
        }

        // Fetch all participants (query category if column exists, fallback gracefully if not)
        let participants: any[] | null = null
        let usersError: any = null

        const res = await supabase
            .from('users')
            .select('id, name, email, reg_no, dept, section, year, role, created_at, category')
            .eq('role', 'participant')
            .order('created_at', { ascending: false })

        if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('category'))) {
            const fallback = await supabase
                .from('users')
                .select('id, name, email, reg_no, dept, section, year, role, created_at')
                .eq('role', 'participant')
                .order('created_at', { ascending: false })
            participants = fallback.data
            usersError = fallback.error
        } else {
            participants = res.data
            usersError = res.error
        }

        if (usersError) {
            console.error('Error fetching participants:', usersError)
            return NextResponse.json({ error: usersError.message }, { status: 500 })
        }

        // Fetch all team memberships
        const { data: memberships, error: memError } = await supabase
            .from('team_members')
            .select(`
                user_id,
                team_id,
                teams (
                    id,
                    team_name,
                    team_code,
                    leader_id,
                    selected_problem_id
                )
            `)

        if (memError) {
            console.error('Error fetching team memberships:', memError)
            return NextResponse.json({ error: memError.message }, { status: 500 })
        }

        // Map memberships by user_id
        const membershipMap = new Map<string, any>()
        if (memberships) {
            for (const m of memberships) {
                membershipMap.set(m.user_id, {
                    team_id: m.team_id,
                    team: m.teams
                })
            }
        }

        const students = (participants || []).map(p => {
            const memberInfo = membershipMap.get(p.id)
            return {
                ...p,
                is_assigned: Boolean(memberInfo),
                team_id: memberInfo?.team_id || null,
                team: memberInfo?.team || null,
                is_leader: memberInfo?.team ? memberInfo.team.leader_id === p.id : false
            }
        })

        return NextResponse.json({
            success: true,
            students: students
        })
    } catch (error: any) {
        console.error('Organizer GET students error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

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
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        const url = new URL(request.url)
        let studentId = url.searchParams.get('id') || url.searchParams.get('student_id') || url.searchParams.get('user_id')

        // If not in query params, check JSON body
        if (!studentId) {
            try {
                const body = await request.json()
                studentId = body.id || body.student_id || body.user_id || body.email
            } catch {
                // No JSON body
            }
        }

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID or email is required for deletion' }, { status: 400 })
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
                // Find remaining members in this team
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
            // Optional: User might not have auth record or service key restrictions
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
        console.error('Organizer DELETE student error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
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
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        const body = await request.json()

        // Support bulk category updates
        if (Array.isArray(body.students)) {
            let updatedCount = 0
            for (const s of body.students) {
                if (s.id && s.category !== undefined) {
                    const { error } = await supabase
                        .from('users')
                        .update({ category: String(s.category).trim() })
                        .eq('id', s.id)
                    if (!error) {
                        updatedCount++
                        invalidateUserCache(s.id)
                    }
                }
            }
            return NextResponse.json({
                success: true,
                message: `Successfully updated categories for ${updatedCount} participant(s) in database.`,
                count: updatedCount
            })
        }

        const { id, name, email, reg_no, dept, section, year, category } = body

        if (!id) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
        }

        const updates: any = {}
        if (name !== undefined) updates.name = String(name).trim()
        if (email !== undefined) updates.email = String(email).trim().toLowerCase()
        if (reg_no !== undefined) updates.reg_no = reg_no ? String(reg_no).trim() : null
        if (dept !== undefined) updates.dept = dept ? String(dept).trim() : null
        if (section !== undefined) updates.section = section ? String(section).trim() : null
        if (year !== undefined) updates.year = year ? String(year).trim() : null
        if (category !== undefined) updates.category = category ? String(category).trim() : null

        const { data: updatedUser, error: updateErr } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (updateErr) {
            return NextResponse.json({ error: updateErr.message }, { status: 500 })
        }

        invalidateUserCache(id)
        if (updatedUser?.email) invalidateUserCache(updatedUser.email)

        return NextResponse.json({
            success: true,
            message: `Updated profile for "${updatedUser?.name || updatedUser?.email}".`,
            student: updatedUser
        })
    } catch (error: any) {
        console.error('Organizer PUT student error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    return PUT(request)
}
