import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
        redirect('/login')
    }

    const role = (session.user as any)?.role || 'participant'
    redirect(`/dashboard/${role}`)
}
