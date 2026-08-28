import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react'
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { formatDateTime } from '@/lib/dateUtils'
import { ensureDbUser } from '@/lib/ensureUser'

export default async function ParticipantRoundsPage() {
    const supabase = await createAdminClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    const dbUser = await ensureDbUser(user)
    const activeUserId = dbUser?.id || user?.id
    const userIds = [activeUserId, user?.id].filter(Boolean)

    // 1. Get user's team
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .in('user_id', userIds)
        .maybeSingle()

    const teamId = membership?.team_id

    // 2. Fetch team's problem statement selection
    let selectedProblem: any = null
    if (teamId) {
        const { data: selection } = await supabase
            .from('problem_selections')
            .select('*, problem_statements(*)')
            .eq('team_id', teamId)
            .maybeSingle()
        selectedProblem = selection?.problem_statements
    }

    // 3. Fetch all rounds sorted by round_number
    const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true })

    // 4. Fetch team submissions if part of a team
    let submissions: any[] = []
    if (teamId) {
        const { data: teamSubmissions } = await supabase
            .from('submissions')
            .select('round_id')
            .eq('team_id', teamId)
        submissions = teamSubmissions || []
    }

    const now = new Date()
    const submittedRoundIds = new Set(submissions.map(s => s.round_id))

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-sky-400" />
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Hackathon Rounds</h2>
                <p className="text-gray-600 text-sm">
                    {!teamId
                        ? "You must join or form a team before you can submit to rounds."
                        : "Complete the competition rounds before their deadlines. Only the Team Leader can submit work."}
                </p>
            </div>

            {/* Problem Statement Notice Banner */}
            {teamId && !selectedProblem && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="text-amber-600 shrink-0 mt-0.5" size={24} />
                        <div>
                            <h3 className="font-bold text-amber-900 text-base">Step 1: Choose Problem Statement</h3>
                            <p className="text-xs text-amber-800 mt-1">
                                Your team has not locked in a problem statement yet. Please choose a problem statement to tailor your competition submissions.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/participant/problem-statement"
                        className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm whitespace-nowrap transition-colors"
                    >
                        Select Statement &rarr;
                    </Link>
                </div>
            )}

            {/* Locked Problem statement banner */}
            {selectedProblem && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                            {selectedProblem.statement_code}
                        </span>
                        <div>
                            <span className="text-xs font-bold text-emerald-700 block">{selectedProblem.domain}</span>
                            <span className="text-sm font-bold text-gray-900">{selectedProblem.title}</span>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/participant/problem-statement"
                        className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                        View Full Brief &rarr;
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {rounds?.map((round) => {
                    const startTime = new Date(round.start_time)
                    const endTime = new Date(round.end_time)
                    const isSubmitted = submittedRoundIds.has(round.id)

                    let statusColor = "bg-gray-100 text-gray-800 border-gray-200"
                    let statusText = "UPCOMING"
                    let isActive = false

                    if (now >= startTime && now <= endTime) {
                        statusColor = "bg-blue-50 text-blue-700 border-blue-200"
                        statusText = "ACTIVE"
                        isActive = true
                    } else if (now > endTime) {
                        statusColor = "bg-slate-100 text-slate-600 border-slate-200"
                        statusText = "ENDED"
                    }

                    if (isSubmitted) {
                        statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                        statusText = "SUBMITTED"
                    }

                    return (
                        <div key={round.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-blue-200 transition-all">
                            <div className="p-8 flex-1">
                                <div className="flex justify-between items-start mb-2 gap-4">
                                    <h3 className="font-extrabold text-gray-900 text-xl leading-tight">
                                        {round.round_number && <span className="text-blue-600 mr-2">Round {round.round_number}:</span>}
                                        {round.name}
                                    </h3>
                                    <span className={`text-xs font-black px-3 py-1 rounded-full border shrink-0 ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                    {round.description || 'No description provided.'}
                                </p>

                                <div className="flex flex-wrap gap-3 text-xs">
                                    <div className="flex items-center text-gray-600 gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                                        <Clock size={15} className="text-gray-400" />
                                        <span suppressHydrationWarning>Deadline: {formatDateTime(endTime)}</span>
                                    </div>
                                    {(() => {
                                        const cfg = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
                                        const labels = []
                                        if (cfg.fields.ppt.enabled) labels.push('PPT')
                                        if (cfg.fields.github.enabled) labels.push('GitHub')
                                        if (cfg.fields.live_demo.enabled) labels.push('Live Demo')
                                        if (cfg.fields.text.enabled) labels.push('Text')
                                        return (
                                            <div className="flex items-center text-slate-700 gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
                                                <FileText size={14} className="text-gray-400" />
                                                <span>Format: {labels.join(', ') || 'Text'}</span>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-8 flex flex-col justify-center items-center md:min-w-[220px] shrink-0">
                                {isSubmitted ? (
                                    <div className="text-center text-emerald-600">
                                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                                        <p className="font-bold text-sm">Submission Received</p>
                                        <Link
                                            href={`/dashboard/participant/rounds/${round.id}`}
                                            className="text-xs font-bold text-blue-600 hover:underline mt-2 inline-block bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs"
                                        >
                                            View / Edit
                                        </Link>
                                    </div>
                                ) : isActive ? (
                                    <Link
                                        href={`/dashboard/participant/rounds/${round.id}`}
                                        className="w-full text-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        Open & Submit <ArrowRight size={16} />
                                    </Link>
                                ) : now < startTime ? (
                                    <div className="text-center text-gray-500">
                                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p suppressHydrationWarning className="font-bold text-xs">Opens {formatDateTime(startTime)}</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-bold text-sm">Round Closed</p>
                                        <p className="text-xs text-gray-400 mt-1">Deadline passed</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {(!rounds || rounds.length === 0) && (
                    <div className="py-16 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-white">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900">No rounds available</h3>
                        <p className="text-gray-500 text-sm">Please check back when the organizer releases the rounds.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
