import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowRight, CheckSquare } from 'lucide-react'

export default async function JudgeDashboard() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    // Get count of assignments
    const { count } = await supabase
        .from('judge_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', user?.id)

    const assignmentCount = count || 0

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Judge Dashboard</h2>
                <p className="text-gray-600">
                    Welcome back, {user?.name || 'Judge'}. Review and score submissions for the teams assigned to you.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Your Assignments
                    </h3>
                    
                    {assignmentCount > 0 ? (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                You are currently assigned to evaluate <span className="font-bold text-gray-900">{assignmentCount}</span> teams.
                            </p>
                            <Link 
                                href="/dashboard/judge/submissions"
                                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
                            >
                                Go to Reviews <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">
                            You currently have no teams assigned to you. When the organizer assigns teams, they will appear here.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
