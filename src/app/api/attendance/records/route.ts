import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'
import { 
    getAttendanceRecords, 
    markAttendance, 
    bulkMarkAttendance,
    isVolunteerEmail 
} from '@/lib/attendanceStore'

async function checkVolunteerOrOrganizer(session: any): Promise<boolean> {
    const user = session?.user as any
    if (!user) return false

    if (user.role === 'organizer' || user.role === 'volunteer') return true

    if (user.email) {
        const isVol = await isVolunteerEmail(user.email)
        if (isVol) return true
    }

    const dbUser = await ensureDbUser(user)
    if (dbUser?.role === 'organizer' || dbUser?.role === 'volunteer') return true

    return false
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const isAllowed = await checkVolunteerOrOrganizer(session)
        if (!isAllowed) {
            return NextResponse.json({ error: 'Unauthorized: Volunteer or Organizer access required' }, { status: 403 })
        }

        const url = new URL(request.url)
        const sessionId = url.searchParams.get('session_id')

        if (!sessionId) {
            return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
        }

        const records = await getAttendanceRecords(sessionId)
        return NextResponse.json({
            success: true,
            records: records
        })
    } catch (error: any) {
        console.error('GET /api/attendance/records error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const isAllowed = await checkVolunteerOrOrganizer(session)
        if (!isAllowed) {
            return NextResponse.json({ error: 'Unauthorized: Volunteer or Organizer access required' }, { status: 403 })
        }

        const body = await request.json()
        const { session_id, user_id, status, notes } = body

        if (!session_id || !user_id || !status) {
            return NextResponse.json({ error: 'session_id, user_id, and status are required' }, { status: 400 })
        }

        if (status !== 'present' && status !== 'absent') {
            return NextResponse.json({ error: 'Status must be "present" or "absent"' }, { status: 400 })
        }

        const user = session?.user as any
        const record = await markAttendance(
            session_id,
            user_id,
            status,
            user?.id,
            notes
        )

        return NextResponse.json({
            success: true,
            record: record
        })
    } catch (error: any) {
        console.error('POST /api/attendance/records error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const isAllowed = await checkVolunteerOrOrganizer(session)
        if (!isAllowed) {
            return NextResponse.json({ error: 'Unauthorized: Volunteer or Organizer access required' }, { status: 403 })
        }

        const body = await request.json()
        const { session_id, user_ids, status } = body

        if (!session_id || !Array.isArray(user_ids) || !status) {
            return NextResponse.json({ error: 'session_id, user_ids array, and status are required' }, { status: 400 })
        }

        if (status !== 'present' && status !== 'absent') {
            return NextResponse.json({ error: 'Status must be "present" or "absent"' }, { status: 400 })
        }

        const user = session?.user as any
        const updatedCount = await bulkMarkAttendance(
            session_id,
            user_ids,
            status,
            user?.id
        )

        return NextResponse.json({
            success: true,
            message: `Marked ${updatedCount} participants as ${status}.`,
            count: updatedCount
        })
    } catch (error: any) {
        console.error('PUT /api/attendance/records error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
