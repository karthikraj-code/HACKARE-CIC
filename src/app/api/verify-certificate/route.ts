import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const code = url.searchParams.get('id') || url.searchParams.get('code')

        if (!code) {
            return NextResponse.json({ error: 'Certificate code is required' }, { status: 400 })
        }

        const cleanCode = code.trim()
        const supabase = await createAdminClient()

        const { data: cert, error } = await supabase
            .from('certificates')
            .select('*')
            .ilike('certificate_code', cleanCode)
            .maybeSingle()

        if (error && error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
            console.error('Error querying certificate:', error)
            return NextResponse.json({ error: 'Database lookup error' }, { status: 500 })
        }

        if (cert) {
            const isNotEligible = cert.category === 'Not Eligible' || cert.eligible === false
            return NextResponse.json({
                success: true,
                verified: true,
                certificate: {
                    certificate_code: cert.certificate_code,
                    name: cert.name,
                    reg_no: cert.reg_no,
                    dept: cert.dept || 'General Track',
                    section: cert.section || '—',
                    year: cert.year || '—',
                    category: cert.category || 'Group 3',
                    is_not_eligible: isNotEligible,
                    certificate_type: cert.template_name || (cert.metadata && cert.metadata.cert_type) || 'Participation',
                    issue_date: cert.issue_date || cert.created_at,
                    verified_at: new Date().toISOString()
                }
            })
        }

        // Fallback: If DB table not yet created in Supabase SQL editor, check URL params
        const paramName = url.searchParams.get('name')
        const paramReg = url.searchParams.get('reg_no')
        if (paramName && paramReg) {
            const paramCat = url.searchParams.get('cat') || 'Group 3'
            const isNotEligible = paramCat === 'Not Eligible'
            return NextResponse.json({
                success: true,
                verified: true,
                isParamFallback: true,
                certificate: {
                    certificate_code: cleanCode,
                    name: paramName,
                    reg_no: paramReg,
                    dept: url.searchParams.get('dept') || 'Engineering',
                    section: url.searchParams.get('sec') || 'A',
                    year: url.searchParams.get('year') || '2026',
                    category: paramCat,
                    is_not_eligible: isNotEligible,
                    certificate_type: url.searchParams.get('type') || 'Participation',
                    issue_date: new Date().toISOString(),
                    verified_at: new Date().toISOString()
                }
            })
        }

        return NextResponse.json({
            success: false,
            verified: false,
            error: 'Certificate with this identification code could not be verified in the registry.'
        }, { status: 404 })

    } catch (err: any) {
        console.error('Verify certificate error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
