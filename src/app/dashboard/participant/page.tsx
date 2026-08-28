import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Lightbulb, Target, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import CopyButton from '@/components/CopyButton'

export default async function ParticipantDashboard() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

    // 1. Get user's team membership
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, teams(*)')
        .eq('user_id', user?.id)
        .single()

    const team = membership?.teams as any
    const teamId = team?.id

    // 2. Get Team Members count
    let memberCount = 0
    if (teamId) {
        const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
        memberCount = count || 0
    }

    // 3. Get team's selected problem statement
    let selectedProblem: any = null
    if (teamId) {
        const { data: selection } = await supabase
            .from('problem_selections')
            .select('*, problem_statements(*)')
            .eq('team_id', teamId)
            .single()
        selectedProblem = selection?.problem_statements
    }

    // 4. Get submissions for Round 1 & Round 2
    let round1Submitted = false
    let round2Submitted = false

    if (teamId) {
        const { data: submissions } = await supabase
            .from('submissions')
            .select('round_id, rounds(round_number)')
            .eq('team_id', teamId)

        submissions?.forEach((s: any) => {
            if (s.rounds?.round_number === 1) round1Submitted = true
            if (s.rounds?.round_number === 2) round2Submitted = true
        })
    }

    const isLeader = team?.leader_id === user?.id

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-sky-400" />
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome to HACKARE, {userData?.name || 'Participant'}!</h2>
                <p className="text-gray-600 text-base max-w-3xl">
                    Get ready for the competition. Form your team, select your problem statement from the curated options, submit your system architecture PPT in Round 1, and present your working product.
                </p>

            </div>

            {/* Current Team & Problem Statement Widget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                <Users className="text-blue-600" size={20} />
                                My Team
                            </h3>
                            {team && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {memberCount} / 4 Members
                                </span>
                            )}
                        </div>
                        {team ? (
                            <div>
                                <p className="text-xl font-bold text-gray-900 mb-1">{team.team_name}</p>
                                <p className="text-sm text-gray-500 mb-4">
                                    {isLeader ? 'You are the Team Leader' : 'Team Member'}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-sm text-amber-700 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200">
                                    You have not joined a team yet. Create or join a team (max 4 members).
                                </p>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/dashboard/participant/team"
                        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2.5 px-4 rounded-lg transition-colors"
                    >
                        {team ? 'Manage Team' : 'Create or Join Team'} <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                <Lightbulb className="text-amber-500" size={20} />
                                Problem Statement
                            </h3>
                            {selectedProblem ? (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Locked
                                </span>
                            ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                    Pending Selection
                                </span>
                            )}
                        </div>
                        {selectedProblem ? (
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                                    {selectedProblem.statement_code} • {selectedProblem.domain}
                                </span>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <p className="font-extrabold text-gray-900 text-base">
                                        {selectedProblem.title}
                                    </p>
                                    <CopyButton
                                        text={`${selectedProblem.statement_code}: ${selectedProblem.title}\n\n${selectedProblem.description}`}
                                        label="Copy"
                                        variant="pill"
                                        className="shrink-0"
                                    />
                                </div>
                                <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {selectedProblem.description}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    Select 1 out of the curated problem statements. Each statement allows up to 2 teams.
                                </p>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/dashboard/participant/problem-statement"
                        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 py-2.5 px-4 rounded-lg transition-colors"
                    >
                        {selectedProblem ? 'View Problem Statement' : 'Choose Problem Statement'} <ArrowRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Hackathon Roadmap Steps */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Target className="text-blue-600" />
                    Hackathon Flow & Milestones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                    {/* Step 1 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                                    1
                                </span>
                                {team ? (
                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                ) : (
                                    <AlertCircle className="text-amber-500" size={20} />
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">Team Formation</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Form your team of up to 4 members using the invite code.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200">
                            <span className="text-xs font-semibold text-gray-500">
                                {team ? `${memberCount}/4 Members` : 'Not Formed'}
                            </span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                                    2
                                </span>
                                {selectedProblem ? (
                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                ) : (
                                    <AlertCircle className="text-amber-500" size={20} />
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">Problem Selection</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Choose 1 problem statement. Max 2 teams per statement.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200">
                            <span className="text-xs font-semibold text-gray-500">
                                {selectedProblem ? selectedProblem.statement_code : 'Select Problem'}
                            </span>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                                    3
                                </span>
                                {round1Submitted ? (
                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                ) : (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">40 pts</span>
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">Round 1: PPT</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Submit presentation, architecture diagram, and solution approach.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200">
                            <Link href="/dashboard/participant/rounds" className="text-xs font-bold text-blue-600 hover:underline">
                                {round1Submitted ? 'Submitted ✓' : 'Go to Round 1 →'}
                            </Link>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                                    4
                                </span>
                                {round2Submitted ? (
                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                ) : (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">60 pts</span>
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">Round 2: Code Demo</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Submit GitHub code repo, live app link, and demo video.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200">
                            <Link href="/dashboard/participant/rounds" className="text-xs font-bold text-blue-600 hover:underline">
                                {round2Submitted ? 'Submitted ✓' : 'Go to Round 2 →'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
