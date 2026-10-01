import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'
import crypto from 'crypto'

export async function GET(
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

        const { data: team, error } = await supabase
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
                        domain,
                        description,
                        max_teams
                    )
                ),
                judge_assignments (
                    judge_id,
                    users (
                        id,
                        name,
                        email
                    )
                )
            `)
            .eq('id', teamId)
            .single()

        if (error || !team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, team })
    } catch (error: any) {
        console.error('Organizer GET team error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(
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
        const {
            team_name,
            team_code,
            leader_id,
            invite_code,
            problem_id,
            members,
            remove_member_user_ids,
            add_member_email
        } = body

        // 1. Verify team exists
        const { data: existingTeam, error: teamCheckErr } = await supabase
            .from('teams')
            .select('id, team_name, team_code, leader_id, selected_problem_id')
            .eq('id', teamId)
            .single()

        if (teamCheckErr || !existingTeam) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        }

        // 2. Validate & Update team_code if changed
        const teamUpdates: any = {}
        if (team_name !== undefined && String(team_name).trim()) {
            teamUpdates.team_name = String(team_name).trim()
        }

        if (team_code !== undefined && String(team_code).trim()) {
            const trimmedCode = String(team_code).trim().toUpperCase()
            // Check uniqueness
            const { data: duplicateCode } = await supabase
                .from('teams')
                .select('id')
                .eq('team_code', trimmedCode)
                .neq('id', teamId)
                .maybeSingle()

            if (duplicateCode) {
                return NextResponse.json({
                    error: `Team ID / Code '${trimmedCode}' is already taken by another team.`
                }, { status: 400 })
            }
            teamUpdates.team_code = trimmedCode
        }

        if (leader_id !== undefined && String(leader_id).trim()) {
            teamUpdates.leader_id = String(leader_id).trim()
        }

        if (invite_code !== undefined && String(invite_code).trim()) {
            teamUpdates.invite_code = String(invite_code).trim().toUpperCase()
        }

        // 3. Handle problem statement assignment / update / removal
        if (problem_id !== undefined) {
            if (problem_id && problem_id !== 'none' && problem_id !== 'null') {
                // Verify problem statement exists
                const { data: psData, error: psErr } = await supabase
                    .from('problem_statements')
                    .select('id, statement_code, title')
                    .eq('id', problem_id)
                    .single()

                if (psErr || !psData) {
                    return NextResponse.json({ error: 'Selected problem statement does not exist' }, { status: 400 })
                }

                // Delete existing problem selection
                await supabase
                    .from('problem_selections')
                    .delete()
                    .eq('team_id', teamId)

                // Insert new selection
                const { error: selErr } = await supabase
                    .from('problem_selections')
                    .insert([{
                        team_id: teamId,
                        problem_id: problem_id
                    }])

                if (selErr) {
                    console.error('Error updating problem selection:', selErr)
                    return NextResponse.json({ error: selErr.message || 'Failed to assign problem statement' }, { status: 500 })
                }

                teamUpdates.selected_problem_id = problem_id
            } else {
                // Remove selection
                await supabase
                    .from('problem_selections')
                    .delete()
                    .eq('team_id', teamId)

                teamUpdates.selected_problem_id = null
            }
        }

        // Apply team table updates if any
        if (Object.keys(teamUpdates).length > 0) {
            const { error: teamUpdateErr } = await supabase
                .from('teams')
                .update(teamUpdates)
                .eq('id', teamId)

            if (teamUpdateErr) {
                console.error('Error updating team:', teamUpdateErr)
                return NextResponse.json({ error: teamUpdateErr.message || 'Failed to update team details' }, { status: 500 })
            }
        }

        // 4. Update member profile details if provided
        if (Array.isArray(members) && members.length > 0) {
            for (const member of members) {
                if (!member.user_id) continue

                const userUpdates: any = {}
                if (member.name !== undefined) userUpdates.name = String(member.name || '').trim()
                if (member.email !== undefined) userUpdates.email = String(member.email || '').trim().toLowerCase()
                if (member.reg_no !== undefined) userUpdates.reg_no = member.reg_no ? String(member.reg_no).trim() : null
                if (member.dept !== undefined) userUpdates.dept = member.dept ? String(member.dept).trim() : null
                if (member.section !== undefined) userUpdates.section = member.section ? String(member.section).trim() : null
                if (member.year !== undefined) userUpdates.year = member.year ? String(member.year).trim() : null

                if (Object.keys(userUpdates).length > 0) {
                    const { error: userErr } = await supabase
                        .from('users')
                        .update(userUpdates)
                        .eq('id', member.user_id)

                    if (userErr) {
                        console.error(`Error updating user ${member.user_id}:`, userErr)
                    }
                }
            }
        }

        // 5. Remove members if requested
        if (Array.isArray(remove_member_user_ids) && remove_member_user_ids.length > 0) {
            await supabase
                .from('team_members')
                .delete()
                .eq('team_id', teamId)
                .in('user_id', remove_member_user_ids)

            // If leader was removed, check remaining members
            const { data: remainingMembers } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', teamId)

            if (remainingMembers && remainingMembers.length > 0) {
                const currentLeaderStillThere = remainingMembers.some(m => m.user_id === (teamUpdates.leader_id || existingTeam.leader_id))
                if (!currentLeaderStillThere) {
                    await supabase
                        .from('teams')
                        .update({ leader_id: remainingMembers[0].user_id })
                        .eq('id', teamId)
                }
            }
        }

        // 6. Add member(s) if requested
        const membersToAdd: any[] = []
        if (body.add_members && Array.isArray(body.add_members)) {
            membersToAdd.push(...body.add_members)
        } else if (body.add_member && typeof body.add_member === 'object') {
            membersToAdd.push(body.add_member)
        } else if (add_member_email && String(add_member_email).trim()) {
            membersToAdd.push({ email: add_member_email })
        }

        for (const mToAdd of membersToAdd) {
            const emailToAdd = mToAdd.email ? String(mToAdd.email).trim().toLowerCase() : ''
            const userIdToAdd = mToAdd.user_id ? String(mToAdd.user_id).trim() : ''

            if (!emailToAdd && !userIdToAdd) continue

            // Find user in users table
            let targetUser: any = null
            if (userIdToAdd) {
                const { data: uById } = await supabase
                    .from('users')
                    .select('id, name, email, reg_no, dept, section, year, role')
                    .eq('id', userIdToAdd)
                    .maybeSingle()
                targetUser = uById
            }

            if (!targetUser && emailToAdd) {
                const { data: uByEmail } = await supabase
                    .from('users')
                    .select('id, name, email, reg_no, dept, section, year, role')
                    .eq('email', emailToAdd)
                    .maybeSingle()
                targetUser = uByEmail
            }

            if (!targetUser) {
                // Auto create user record
                const newUserId = userIdToAdd || crypto.randomUUID()
                const studentName = mToAdd.name?.trim() || (emailToAdd ? emailToAdd.split('@')[0] : 'Participant')

                const { data: newUser, error: createErr } = await supabase
                    .from('users')
                    .insert([{
                        id: newUserId,
                        email: emailToAdd,
                        name: studentName,
                        role: 'participant',
                        reg_no: mToAdd.reg_no ? String(mToAdd.reg_no).trim() : null,
                        dept: mToAdd.dept ? String(mToAdd.dept).trim() : null,
                        section: mToAdd.section ? String(mToAdd.section).trim() : null,
                        year: mToAdd.year ? String(mToAdd.year).trim() : null
                    }])
                    .select('id, name, email')
                    .single()

                if (createErr || !newUser) {
                    return NextResponse.json({ error: 'Could not create participant record for ' + (emailToAdd || userIdToAdd) }, { status: 500 })
                }
                targetUser = newUser
            } else {
                // Update profile fields if provided
                const profileUpdates: any = {}
                if (mToAdd.name && mToAdd.name !== targetUser.name) profileUpdates.name = String(mToAdd.name).trim()
                if (mToAdd.reg_no !== undefined) profileUpdates.reg_no = mToAdd.reg_no ? String(mToAdd.reg_no).trim() : null
                if (mToAdd.dept !== undefined) profileUpdates.dept = mToAdd.dept ? String(mToAdd.dept).trim() : null
                if (mToAdd.section !== undefined) profileUpdates.section = mToAdd.section ? String(mToAdd.section).trim() : null
                if (mToAdd.year !== undefined) profileUpdates.year = mToAdd.year ? String(mToAdd.year).trim() : null

                if (Object.keys(profileUpdates).length > 0) {
                    await supabase.from('users').update(profileUpdates).eq('id', targetUser.id)
                }
            }

            // Check if user is already in any team
            const { data: existingMembership } = await supabase
                .from('team_members')
                .select('team_id, teams(team_name, team_code)')
                .eq('user_id', targetUser.id)
                .maybeSingle()

            if (existingMembership) {
                if (existingMembership.team_id === teamId) {
                    continue // Already in this team
                }
                const existingTeamName = (existingMembership.teams as any)?.team_name || 'another team'
                const existingTeamCode = (existingMembership.teams as any)?.team_code
                const teamDisplay = existingTeamCode ? `${existingTeamName} (${existingTeamCode})` : existingTeamName

                return NextResponse.json({
                    error: `Student ${targetUser.name || targetUser.email} (${targetUser.email}) is already a member of "${teamDisplay}".`
                }, { status: 400 })
            }

            // Check team member count limit (max 4)
            const { count: memberCount } = await supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId)

            if ((memberCount || 0) >= 4) {
                return NextResponse.json({
                    error: 'Team already has the maximum allowed 4 members.'
                }, { status: 400 })
            }

            // Add to team_members
            const { error: addErr } = await supabase
                .from('team_members')
                .insert([{
                    team_id: teamId,
                    user_id: targetUser.id
                }])

            if (addErr) {
                return NextResponse.json({ error: addErr.message || 'Failed to add member to team' }, { status: 500 })
            }

            // If set as leader requested
            if (mToAdd.is_leader) {
                await supabase.from('teams').update({ leader_id: targetUser.id }).eq('id', teamId)
            }
        }

        // Fetch refreshed team data
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
            message: 'Team and profile details updated successfully!',
            team: updatedTeam
        })
    } catch (error: any) {
        console.error('Organizer PUT team error:', error)
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

        // 1. Delete scores
        await supabase.from('scores').delete().eq('team_id', teamId)

        // 2. Delete submissions
        await supabase.from('submissions').delete().eq('team_id', teamId)

        // 3. Delete judge assignments
        await supabase.from('judge_assignments').delete().eq('team_id', teamId)

        // 4. Delete problem selections
        await supabase.from('problem_selections').delete().eq('team_id', teamId)

        // 5. Delete team members
        await supabase.from('team_members').delete().eq('team_id', teamId)

        // 6. Delete team
        const { error: deleteErr } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId)

        if (deleteErr) {
            console.error('Error deleting team:', deleteErr)
            return NextResponse.json({ error: deleteErr.message || 'Failed to delete team' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Team deleted permanently.'
        })
    } catch (error: any) {
        console.error('Organizer DELETE team error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
