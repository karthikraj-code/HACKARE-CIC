import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CheckSquare } from 'lucide-react'
import SignOutButton from '@/components/SignOutButton'

export default async function JudgeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    if (!user) {
        redirect('/login')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'judge') {
        redirect(`/dashboard/${userData?.role || 'participant'}`)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-blue-600">HACKARE</h2>
                    <p className="text-xs text-gray-500 mt-1 uppercase font-semibold tracking-wider">Judge</p>
                </div>

                <nav className="px-4 pb-6 space-y-1">
                    <Link href="/dashboard/judge" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-colors">
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link href="/dashboard/judge/submissions" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-colors">
                        <CheckSquare size={20} />
                        Review Submissions
                    </Link>
                </nav>

                <div className="absolute bottom-0 w-full md:w-64 p-4 border-t border-gray-200">
                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <h1 className="text-xl font-semibold text-gray-800">Judge Panel</h1>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {user?.name?.charAt(0).toUpperCase() || 'J'}
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
