import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'
import { isVolunteerEmail } from '@/lib/attendanceStore'
import crypto from 'crypto'

export async function GET() {
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

        const { data: teams, error } = await supabase
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
                        max_teams
                    )
                ),
                judge_assignments (
                    judge_id
                )
            `)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching teams:', error)
            return NextResponse.json({ error: error.message || 'Failed to fetch teams' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            teams: teams || []
        })
    } catch (error: any) {
        console.error('Organizer GET teams error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
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
        const {
            team_name,
            team_code,
            invite_code: customInviteCode,
            problem_id,
            members = [],
            leader_email,
            leader_user_id
        } = body

        if (!team_name || !String(team_name).trim()) {
            return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
        }

        const trimmedTeamName = String(team_name).trim()

        // 1. Determine and validate team_code
        let finalTeamCode = team_code ? String(team_code).trim().toUpperCase() : ''
        if (!finalTeamCode) {
            // Auto generate team code
            const randomSuffix = Math.floor(100 + Math.random() * 900)
            finalTeamCode = `TEAM-${randomSuffix}`
        }

        // Check uniqueness of team_code
        const { data: existingCode } = await supabase
            .from('teams')
            .select('id, team_name')
            .eq('team_code', finalTeamCode)
            .maybeSingle()

        if (existingCode) {
            return NextResponse.json({
                error: `Team ID / Code '${finalTeamCode}' is already in use by team "${existingCode.team_name}". Please choose another Team ID.`
            }, { status: 400 })
        }

        // 2. Determine and validate invite_code
        let finalInviteCode = customInviteCode ? String(customInviteCode).trim().toUpperCase() : ''
        if (!finalInviteCode) {
            finalInviteCode = crypto.randomBytes(3).toString('hex').substring(0, 5).toUpperCase()
        }

        // Ensure invite_code uniqueness
        let inviteCheck = await supabase.from('teams').select('id').eq('invite_code', finalInviteCode).maybeSingle()
        while (inviteCheck.data) {
            finalInviteCode = crypto.randomBytes(3).toString('hex').substring(0, 5).toUpperCase()
            inviteCheck = await supabase.from('teams').select('id').eq('invite_code', finalInviteCode).maybeSingle()
        }

        // 3. Process and validate members (max 4)
        if (Array.isArray(members) && members.length > 4) {
            return NextResponse.json({ error: 'A team can have a maximum of 4 members.' }, { status: 400 })
        }

        // Deduplicate member inputs by email or user_id
        const uniqueMembers: any[] = []
        const seenEmails = new Set<string>()
        const seenUserIds = new Set<string>()

        if (Array.isArray(members)) {
            for (const m of members) {
                const email = m.email ? String(m.email).trim().toLowerCase() : ''
                const userId = m.user_id ? String(m.user_id).trim() : ''

                if (!email && !userId) continue
                if (email && seenEmails.has(email)) continue
                if (userId && seenUserIds.has(userId)) continue

                if (email) seenEmails.add(email)
                if (userId) seenUserIds.add(userId)

                uniqueMembers.push({
                    ...m,
                    email,
                    user_id: userId,
                    name: m.name ? String(m.name).trim() : '',
                    reg_no: m.reg_no ? String(m.reg_no).trim() : null,
                    dept: m.dept ? String(m.dept).trim() : null,
                    section: m.section ? String(m.section).trim() : null,
                    year: m.year ? String(m.year).trim() : null,
                    is_leader: Boolean(m.is_leader)
                })
            }
        }

        if (uniqueMembers.length > 4) {
            return NextResponse.json({ error: 'A team can have a maximum of 4 members.' }, { status: 400 })
        }

        // Resolve each member to a user record in `users`
        const resolvedUsers: Array<{
            id: string
            name: string
            email: string
            is_leader: boolean
        }> = []

        for (const member of uniqueMembers) {
            let userRecord: any = null

            if (member.user_id) {
                const { data: uById } = await supabase
                    .from('users')
                    .select('id, name, email')
                    .eq('id', member.user_id)
                    .maybeSingle()
                userRecord = uById
            }

            if (!userRecord && member.email) {
                const { data: uByEmail } = await supabase
                    .from('users')
                    .select('id, name, email')
                    .eq('email', member.email)
                    .maybeSingle()
                userRecord = uByEmail
            }

            if (!userRecord) {
                // Create participant user record
                const newUserId = member.user_id || crypto.randomUUID()
                const participantName = member.name || (member.email ? member.email.split('@')[0] : 'Participant')
                const participantEmail = member.email || `${newUserId}@hackare.local`

                const { data: newUser, error: createErr } = await supabase
                    .from('users')
                    .insert([{
                        id: newUserId,
                        name: participantName,
                        email: participantEmail,
                        role: 'participant',
                        reg_no: member.reg_no || null,
                        dept: member.dept || null,
                        section: member.section || null,
                        year: member.year || null
                    }])
                    .select('id, name, email')
                    .single()

                if (createErr || !newUser) {
                    console.error('Error creating participant user record:', createErr)
                    return NextResponse.json({
                        error: `Failed to create student account for ${member.email}: ${createErr?.message || 'Unknown error'}`
                    }, { status: 500 })
                }
                userRecord = newUser
            } else {
                // Update profile fields if provided
                const profileUpdates: any = {}
                if (member.name && member.name !== userRecord.name) profileUpdates.name = member.name
                if (member.reg_no) profileUpdates.reg_no = member.reg_no
                if (member.dept) profileUpdates.dept = member.dept
                if (member.section) profileUpdates.section = member.section
                if (member.year) profileUpdates.year = member.year

                if (Object.keys(profileUpdates).length > 0) {
                    await supabase.from('users').update(profileUpdates).eq('id', userRecord.id)
                }
            }

            // Verify if student is already in a team
            const { data: existingMembership } = await supabase
                .from('team_members')
                .select('team_id, teams(team_name, team_code)')
                .eq('user_id', userRecord.id)
                .maybeSingle()

            if (existingMembership) {
                const existingTeamName = (existingMembership.teams as any)?.team_name || 'another team'
                const existingTeamCode = (existingMembership.teams as any)?.team_code
                const teamDisplay = existingTeamCode ? `${existingTeamName} (${existingTeamCode})` : existingTeamName

                return NextResponse.json({
                    error: `Student "${userRecord.name || userRecord.email}" (${userRecord.email}) is already in team "${teamDisplay}". Remove them from that team before adding here.`
                }, { status: 400 })
            }

            resolvedUsers.push({
                id: userRecord.id,
                name: userRecord.name,
                email: userRecord.email,
                is_leader: Boolean(member.is_leader)
            })
        }

        // Determine Team Leader ID
        let leaderId: string | null = null

        // Check if explicit is_leader flagged
        const flaggedLeader = resolvedUsers.find(u => u.is_leader)
        if (flaggedLeader) {
            leaderId = flaggedLeader.id
        } else if (leader_user_id && resolvedUsers.some(u => u.id === leader_user_id)) {
            leaderId = leader_user_id
        } else if (leader_email) {
            const matchByEmail = resolvedUsers.find(u => u.email.toLowerCase() === String(leader_email).trim().toLowerCase())
            if (matchByEmail) leaderId = matchByEmail.id
        }

        // If not set yet and we have members, pick the first member
        if (!leaderId && resolvedUsers.length > 0) {
            leaderId = resolvedUsers[0].id
        }

        // If still no leader (e.g. creating empty team), fallback to current organizer's dbUser ID
        if (!leaderId) {
            leaderId = dbUser?.id || user.id
        }

        // 4. Insert Team into teams table
        const newTeamId = crypto.randomUUID()
        const { data: createdTeam, error: teamInsertErr } = await supabase
            .from('teams')
            .insert([{
                id: newTeamId,
                team_name: trimmedTeamName,
                team_code: finalTeamCode,
                invite_code: finalInviteCode,
                leader_id: leaderId,
                selected_problem_id: (problem_id && problem_id !== 'none' && problem_id !== 'null') ? problem_id : null
            }])
            .select()
            .single()

        if (teamInsertErr || !createdTeam) {
            console.error('Error inserting team:', teamInsertErr)
            return NextResponse.json({
                error: teamInsertErr?.message || 'Failed to create team record'
            }, { status: 500 })
        }

        // 5. Add members to team_members table
        if (resolvedUsers.length > 0) {
            const memberInserts = resolvedUsers.map(u => ({
                team_id: newTeamId,
                user_id: u.id
            }))

            const { error: membersErr } = await supabase
                .from('team_members')
                .insert(memberInserts)

            if (membersErr) {
                console.error('Error inserting team members:', membersErr)
                // Cleanup team
                await supabase.from('teams').delete().eq('id', newTeamId)
                return NextResponse.json({
                    error: membersErr.message || 'Failed to add students to team'
                }, { status: 500 })
            }
        }

        // 6. Handle problem statement assignment
        if (problem_id && problem_id !== 'none' && problem_id !== 'null') {
            const { error: selErr } = await supabase
                .from('problem_selections')
                .insert([{
                    team_id: newTeamId,
                    problem_id: problem_id
                }])

            if (selErr) {
                console.warn('Problem statement assignment warning:', selErr)
            }
        }

        // 7. Fetch full team data to return
        const { data: fullTeam, error: fetchErr } = await supabase
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
                        max_teams
                    )
                ),
                judge_assignments (
                    judge_id
                )
            `)
            .eq('id', newTeamId)
            .single()

        return NextResponse.json({
            success: true,
            message: `Team "${trimmedTeamName}" (ID: ${finalTeamCode}) created successfully with ${resolvedUsers.length} member(s)!`,
            team: fullTeam || createdTeam
        }, { status: 201 })

    } catch (error: any) {
        console.error('Organizer POST teams error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
