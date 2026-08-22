import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Plus, UserPlus, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react'
import CopyButton from '@/components/CopyButton'

export default async function ParticipantTeamPage() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    // 1. Check if user is in a team
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user?.id)
        .single()

    // If not in a team, show join/create options
    if (!membership) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">You don't have a team yet</h2>
                    <p className="text-gray-600 mb-6 max-w-lg mx-auto text-sm">
                        To participate in HACKARE, you need to form a team of up to 4 members. Create a new team or join an existing one using an invite code.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard/participant/team/create"
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 shadow-sm text-sm"
                        >
                            <Plus size={18} />
                            Create a Team
                        </Link>
                        <Link
                            href="/dashboard/participant/team/join"
                            className="bg-white text-gray-700 border border-gray-300 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2 shadow-sm text-sm"
                        >
                            <UserPlus size={18} />
                            Join with Code
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // If in a team, get team details
    const { data: team } = await supabase
        .from('teams')
        .select(`
          id, team_name, team_code, leader_id, invite_code,
          team_members (
            user_id,
            users (id, name, email)
          )
        `)
        .eq('id', membership.team_id)
        .single()

    // Get team's selected problem statement
    const { data: selection } = await supabase
        .from('problem_selections')
        .select('*, problem_statements(*)')
        .eq('team_id', membership.team_id)
        .single()

    const selectedProblem = selection?.problem_statements
    const isLeader = team?.leader_id === user?.id
    const memberCount = team?.team_members?.length || 0

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-2xl font-bold text-gray-900">{team?.team_name}</h2>
                        {team?.team_code && (
                            <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                                ID: {team.team_code}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm font-medium">
                        {memberCount} / 4 Members
                    </p>
                </div>
                {isLeader && (
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                        Team Leader
                    </div>
                )}
            </div>


            {/* Problem Statement Card in Team View */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Lightbulb className="text-amber-500" size={20} />
                        Assigned Problem Statement
                    </h3>
                    <Link
                        href="/dashboard/participant/problem-statement"
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                        {selectedProblem ? 'View Problem Statement' : 'Select Problem Statement'} <ArrowRight size={14} />
                    </Link>
                </div>

                {selectedProblem ? (
                    <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {selectedProblem.statement_code}
                            </span>
                            <span className="text-xs font-bold text-emerald-700">{selectedProblem.domain}</span>
                            <span className="text-xs font-bold text-emerald-600 ml-auto flex items-center gap-1">
                                <CheckCircle2 size={14} /> Locked
                            </span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-extrabold text-gray-900 text-base">{selectedProblem.title}</h4>
                            <CopyButton
                                text={`${selectedProblem.statement_code}: ${selectedProblem.title}\n\n${selectedProblem.description}`}
                                label="Copy"
                                variant="pill"
                                className="shrink-0"
                            />
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed mt-2 pt-2 border-t border-emerald-100">{selectedProblem.description}</p>
                    </div>
                ) : (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
                        <div>
                            <p className="font-bold">No Problem Statement Selected</p>
                            <p className="text-xs text-amber-800 mt-0.5">
                                {isLeader ? 'Please choose a problem statement for your team.' : 'Waiting for Team Leader to lock a problem statement.'}
                            </p>
                        </div>
                        {isLeader && (
                            <Link
                                href="/dashboard/participant/problem-statement"
                                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap ml-4"
                            >
                                Select Now &rarr;
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Members List */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Team Members ({memberCount}/4)</h3>
                        <span className="text-xs text-gray-500 font-medium">Max 4 members</span>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {team?.team_members?.map((member: any) => (
                            <li key={member.user_id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                        {member.users?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            {member.users?.name}
                                            {team.leader_id === member.user_id && (
                                                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">Leader</span>
                                            )}
                                            {user?.id === member.user_id && (
                                                <span className="text-xs text-blue-600 font-semibold">(You)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">{member.users?.email}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Invite Code (Leader Only) */}
                {isLeader && memberCount < 4 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Invite Members</h3>
                        <p className="text-xs text-gray-600">
                            Share this unique invite code with your teammates to let them join your team.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-200">
                            <span className="font-mono text-xl font-black tracking-widest text-slate-800 select-all">
                                {team?.invite_code}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            {4 - memberCount} more member{4 - memberCount > 1 ? 's' : ''} can join.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
