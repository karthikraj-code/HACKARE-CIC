import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const problemId = params.id

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
        const { domain, title, description, max_teams, statement_code } = body

        const updates: any = {}
        if (domain !== undefined) updates.domain = String(domain).trim()
        if (title !== undefined) updates.title = String(title).trim()
        if (description !== undefined) updates.description = String(description).trim()
        if (max_teams !== undefined) updates.max_teams = Math.max(1, parseInt(String(max_teams), 10) || 2)
        if (statement_code !== undefined) updates.statement_code = String(statement_code).trim().toUpperCase()

        if (updates.statement_code) {
            // Ensure unique code if changed
            const { data: existingCode } = await supabase
                .from('problem_statements')
                .select('id')
                .eq('statement_code', updates.statement_code)
                .neq('id', problemId)
                .maybeSingle()

            if (existingCode) {
                return NextResponse.json({ 
                    error: `Problem statement code '${updates.statement_code}' is already used by another statement.` 
                }, { status: 400 })
            }
        }

        const { data: updatedProblem, error: updateError } = await supabase
            .from('problem_statements')
            .update(updates)
            .eq('id', problemId)
            .select()
            .single()

        if (updateError) {
            console.error('Update problem error:', updateError)
            return NextResponse.json({ error: updateError.message || 'Failed to update problem statement' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Problem statement updated successfully!',
            problem_statement: updatedProblem
        })
    } catch (error: any) {
        console.error('Problem PUT error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const problemId = params.id

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

        // 1. Delete associated problem selections first
        await supabase
            .from('problem_selections')
            .delete()
            .eq('problem_id', problemId)

        // 2. Unlink any teams referencing this problem_id
        await supabase
            .from('teams')
            .update({ selected_problem_id: null })
            .eq('selected_problem_id', problemId)

        // 3. Delete from problem_statements
        const { error: deleteError } = await supabase
            .from('problem_statements')
            .delete()
            .eq('id', problemId)

        if (deleteError) {
            console.error('Delete problem error:', deleteError)
            return NextResponse.json({ error: deleteError.message || 'Failed to delete problem statement' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Problem statement deleted permanently from the database!'
        })
    } catch (error: any) {
        console.error('Problem DELETE error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
