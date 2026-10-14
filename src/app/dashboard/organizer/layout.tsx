import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'

export default async function OrganizerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (!user) {
        redirect('/login')
    }

    const currentRole = user?.role || 'participant'

    if (currentRole !== 'organizer') {
        redirect(`/dashboard/${currentRole}`)
    }

    return (
        <DashboardShell
            role="organizer"
            title="Organizer Panel"
            subtitle="Hackathon Administration & Event Control"
            user={user}
        >
            {children}
        </DashboardShell>
    )
}
