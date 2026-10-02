import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server'
import { ensureDbUser } from '@/lib/ensureUser'
import { 
    getAttendanceSessions, 
    createAttendanceSession, 
    deleteAttendanceSession,
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

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const isAllowed = await checkVolunteerOrOrganizer(session)
        if (!isAllowed) {
            return NextResponse.json({ error: 'Unauthorized: Volunteer or Organizer access required' }, { status: 403 })
        }

        const sessions = await getAttendanceSessions()
        return NextResponse.json({
            success: true,
            sessions: sessions
        })
    } catch (error: any) {
        console.error('GET /api/attendance/sessions error:', error)
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
        const { name, slot, date } = body

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Session name is required' }, { status: 400 })
        }

        const validSlots = ['morning', 'afternoon', 'evening', 'night', 'custom']
        const cleanSlot = validSlots.includes(slot) ? slot : 'custom'

        const user = session?.user as any
        const newSession = await createAttendanceSession(
            name.trim(),
            cleanSlot as any,
            date,
            user?.id
        )

        return NextResponse.json({
            success: true,
            message: `Attendance session "${newSession.name}" created successfully.`,
            session: newSession
        })
    } catch (error: any) {
        console.error('POST /api/attendance/sessions error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const isAllowed = await checkVolunteerOrOrganizer(session)
        if (!isAllowed) {
            return NextResponse.json({ error: 'Unauthorized: Volunteer or Organizer access required' }, { status: 403 })
        }

        const url = new URL(request.url)
        const sessionId = url.searchParams.get('id')

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
        }

        await deleteAttendanceSession(sessionId)

        return NextResponse.json({
            success: true,
            message: 'Attendance session deleted successfully.'
        })
    } catch (error: any) {
        console.error('DELETE /api/attendance/sessions error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
