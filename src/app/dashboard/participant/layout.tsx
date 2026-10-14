import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'

export default async function ParticipantLayout({
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

    const currentRole = user.role || 'participant'

    if (currentRole !== 'participant') {
        redirect(`/dashboard/${currentRole}`)
    }

    return (
        <DashboardShell
            role="participant"
            title="GDG-KARE Event Management Platform"
            subtitle="Participant Portal & Team Hub"
            user={user}
        >
            {children}
        </DashboardShell>
    )
}
