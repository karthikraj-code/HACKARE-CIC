import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare, Users, HeartHandshake, LogOut, Sparkles } from 'lucide-react'
import SignOutButton from '@/components/SignOutButton'
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
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 relative">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-200">
                            <HeartHandshake size={18} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">HACKARE</h2>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Volunteer Panel
                    </div>
                </div>

                <nav className="px-4 pb-24 space-y-1 text-sm font-semibold">
                    <Link 
                        href="/dashboard/volunteer" 
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all group"
                    >
                        <CheckSquare size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                        Attendance Tracker
                    </Link>
                    <Link 
                        href="/dashboard/volunteer/participants" 
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-slate-100 transition-all group"
                    >
                        <Users size={18} className="text-slate-500 group-hover:scale-110 transition-transform" />
                        Participants Roster
                    </Link>
                </nav>

                <div className="absolute bottom-0 w-full md:w-64 p-4 border-t border-gray-200 bg-white">
                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-xs">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Volunteer Operations</h1>
                        <p className="text-xs text-gray-500">Hackathon Attendance & Session Management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-900">{user?.name || user?.email}</p>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                Volunteer
                            </span>
                        </div>
                        <div className="w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                            {(user?.name || user?.email || 'V').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
