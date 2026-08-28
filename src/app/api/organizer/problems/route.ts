import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createAdminClient()
        const dbUser = await ensureDbUser(user)

        // Verify organizer permissions
        const isOrganizer = user.role === 'organizer' || dbUser?.role === 'organizer'
        if (!isOrganizer) {
            return NextResponse.json({ error: 'Forbidden: Organizer access required' }, { status: 403 })
        }

        const body = await request.json()
        const { domain, title, description, max_teams, statement_code } = body

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Problem Statement Title is required' }, { status: 400 })
        }
        if (!domain?.trim()) {
            return NextResponse.json({ error: 'Domain / Track is required' }, { status: 400 })
        }
        if (!description?.trim()) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 })
        }

        const parsedMaxTeams = Math.max(1, parseInt(String(max_teams || 2), 10) || 2)

        // Generate or validate statement code
        let finalCode = statement_code?.trim()?.toUpperCase()
        if (!finalCode) {
            // Find existing count to auto-generate PS-XX
            const { count } = await supabase
                .from('problem_statements')
                .select('*', { count: 'exact', head: true })
            
            const nextIndex = (count || 0) + 1
            finalCode = `PS-${String(nextIndex).padStart(2, '0')}`
        }

        // Check if statement_code already exists
        const { data: existingCode } = await supabase
            .from('problem_statements')
            .select('id')
            .eq('statement_code', finalCode)
            .maybeSingle()

        if (existingCode) {
            return NextResponse.json({ 
                error: `Problem statement code '${finalCode}' is already in use. Please specify a unique code.` 
            }, { status: 400 })
        }

        // Insert new problem statement
        const { data: newProblem, error: insertError } = await supabase
            .from('problem_statements')
            .insert([{
                statement_code: finalCode,
                domain: domain.trim(),
                title: title.trim(),
                description: description.trim(),
                max_teams: parsedMaxTeams
            }])
            .select()
            .single()

        if (insertError) {
            console.error('Error inserting problem statement:', insertError)
            return NextResponse.json({ error: insertError.message || 'Failed to create problem statement' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Problem statement '${finalCode}' created successfully!`,
            problem_statement: newProblem
        })
    } catch (error: any) {
        console.error('Create problem error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
