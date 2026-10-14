import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { isVolunteerEmail } from '@/lib/attendanceStore'
import { ensureDbUser } from '@/lib/ensureUser'

export default async function VolunteerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (!user) {
        redirect('/login')
    }

    const emailLower = user?.email?.toLowerCase().trim() || ''
    const isVol = await isVolunteerEmail(emailLower)
    const dbUser = await ensureDbUser(user)
    const currentRole = user?.role || dbUser?.role || 'participant'

    const isAllowed = currentRole === 'volunteer' || currentRole === 'organizer' || isVol

    if (!isAllowed) {
        redirect(`/dashboard/${currentRole}`)
    }

    return (
        <DashboardShell
            role="volunteer"
            title="Volunteer Operations"
            subtitle="Hackathon Attendance & Session Management"
            user={user}
        >
            {children}
        </DashboardShell>
    )
}
