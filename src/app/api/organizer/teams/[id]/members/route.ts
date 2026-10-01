import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'
import crypto from 'crypto'

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const teamId = params.id

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

        // Verify team exists
        const { data: team, error: teamErr } = await supabase
            .from('teams')
            .select('id, team_name, team_code, leader_id')
            .eq('id', teamId)
            .single()

        if (teamErr || !team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }

        const body = await request.json()
        const { email, user_id, name, reg_no, dept, section, year, set_as_leader } = body

        if (!email && !user_id) {
            return NextResponse.json({ error: 'Student email or user ID is required' }, { status: 400 })
        }

        const emailLower = email ? String(email).trim().toLowerCase() : ''

        // 1. Resolve user in users table
        let targetUser: any = null

        if (user_id) {
            const { data: uById } = await supabase
                .from('users')
                .select('id, name, email, reg_no, dept, section, year, role')
                .eq('id', user_id)
                .maybeSingle()
            targetUser = uById
        }

        if (!targetUser && emailLower) {
            const { data: uByEmail } = await supabase
                .from('users')
                .select('id, name, email, reg_no, dept, section, year, role')
                .eq('email', emailLower)
                .maybeSingle()
            targetUser = uByEmail
        }

        if (!targetUser) {
            // Auto create new participant
            const newUserId = user_id || crypto.randomUUID()
            const studentName = name?.trim() || (emailLower ? emailLower.split('@')[0] : 'Participant')

            const { data: createdUser, error: createErr } = await supabase
                .from('users')
                .insert([{
                    id: newUserId,
                    email: emailLower,
                    name: studentName,
                    role: 'participant',
                    reg_no: reg_no ? String(reg_no).trim() : null,
                    dept: dept ? String(dept).trim() : null,
                    section: section ? String(section).trim() : null,
                    year: year ? String(year).trim() : null
                }])
                .select('id, name, email, reg_no, dept, section, year, role')
                .single()

            if (createErr || !createdUser) {
                console.error('Error creating student user:', createErr)
                return NextResponse.json({ error: 'Could not create participant record: ' + (createErr?.message || '') }, { status: 500 })
            }
            targetUser = createdUser
        } else {
            // Update profile fields if provided
            const updates: any = {}
            if (name !== undefined && String(name).trim()) updates.name = String(name).trim()
            if (reg_no !== undefined) updates.reg_no = reg_no ? String(reg_no).trim() : null
            if (dept !== undefined) updates.dept = dept ? String(dept).trim() : null
            if (section !== undefined) updates.section = section ? String(section).trim() : null
            if (year !== undefined) updates.year = year ? String(year).trim() : null

            if (Object.keys(updates).length > 0) {
                await supabase.from('users').update(updates).eq('id', targetUser.id)
            }
        }

        // 2. Check if student is already in a team
        const { data: existingMembership } = await supabase
            .from('team_members')
            .select('team_id, teams(team_name, team_code)')
            .eq('user_id', targetUser.id)
            .maybeSingle()

        if (existingMembership) {
            if (existingMembership.team_id === teamId) {
                return NextResponse.json({ error: `Student "${targetUser.name || targetUser.email}" is already in this team.` }, { status: 400 })
            }
            const existingTeamName = (existingMembership.teams as any)?.team_name || 'another team'
            const existingTeamCode = (existingMembership.teams as any)?.team_code
            const teamDisplay = existingTeamCode ? `${existingTeamName} (${existingTeamCode})` : existingTeamName

            return NextResponse.json({
                error: `Student "${targetUser.name || targetUser.email}" (${targetUser.email}) is already a member of "${teamDisplay}".`
            }, { status: 400 })
        }

        // 3. Check team member count limit (max 4)
        const { count: memberCount } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)

        if ((memberCount || 0) >= 4) {
            return NextResponse.json({
                error: `Team "${team.team_name}" already has the maximum allowed 4 members.`
            }, { status: 400 })
        }

        // 4. Add to team_members
        const { error: addErr } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamId,
                user_id: targetUser.id
            }])

        if (addErr) {
            console.error('Error adding member to team:', addErr)
            return NextResponse.json({ error: addErr.message || 'Failed to add student to team' }, { status: 500 })
        }

        // 5. Update team leader if requested or if no leader currently set
        if (set_as_leader || !team.leader_id) {
            await supabase
                .from('teams')
                .update({ leader_id: targetUser.id })
                .eq('id', teamId)
        }

        // 6. Fetch refreshed team data
        const { data: updatedTeam } = await supabase
            .from('teams')
            .select(`
                id,
                team_name,
                team_code,
                leader_id,
                invite_code,
                selected_problem_id,
                created_at,
                team_members (
                    user_id,
                    users (
                        id,
                        name,
                        email,
                        reg_no,
                        dept,
                        section,
                        year,
                        role
                    )
                ),
                problem_selections (
                    problem_id,
                    problem_statements (
                        id,
                        statement_code,
                        title,
                        domain
                    )
                )
            `)
            .eq('id', teamId)
            .single()

        return NextResponse.json({
            success: true,
            message: `Student "${targetUser.name || targetUser.email}" successfully added to "${team.team_name}"!`,
            team: updatedTeam
        })

    } catch (error: any) {
        console.error('Organizer POST team member error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const teamId = params.id

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
        const { user_id } = body

        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
        }

        // Delete from team_members
        const { error: delErr } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', user_id)

        if (delErr) {
            return NextResponse.json({ error: delErr.message || 'Failed to remove member' }, { status: 500 })
        }

        // If removed user was leader, pick new leader from remaining members
        const { data: remainingMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId)

        const { data: teamData } = await supabase
            .from('teams')
            .select('leader_id')
            .eq('id', teamId)
            .single()

        if (teamData?.leader_id === user_id && remainingMembers && remainingMembers.length > 0) {
            await supabase
                .from('teams')
                .update({ leader_id: remainingMembers[0].user_id })
                .eq('id', teamId)
        }

        return NextResponse.json({
            success: true,
            message: 'Student removed from team successfully.'
        })
    } catch (error: any) {
        console.error('Organizer DELETE team member error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
