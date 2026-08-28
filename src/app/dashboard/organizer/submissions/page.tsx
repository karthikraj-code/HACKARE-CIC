import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, Users, FileText, Lightbulb } from 'lucide-react'
import { normalizeRubric, calculateMaxScore } from '@/lib/rubricConfig'
import { formatDateTime } from '@/lib/dateUtils'

export default async function OrganizerSubmissionsPage() {
    const supabase = await createAdminClient()

    // 1. Get all teams with problem statement selections
    const { data: teams } = await supabase
        .from('teams')
        .select(`
            id, 
            team_name,
            team_code,
            problem_selections (
                problem_statements (
                    statement_code,
                    title,
                    domain
                )
            )
        `)
        .order('team_name')

    // 2. Get all rounds
    const { data: allRounds } = await supabase
        .from('rounds')
        .select('id, name, round_number, end_time, submission_type, rubric')
        .order('round_number', { ascending: true })

    // 3. Get all submissions
    const { data: submissions } = await supabase
        .from('submissions')
        .select('team_id, round_id, submitted_at')

    // 4. Get all scores
    const { data: scores } = await supabase
        .from('scores')
        .select('team_id, round_id, score')

    const now = new Date()

    // Build a lookup: matrix[team_id][round_id] = { submission, score }
    const matrix: any = {}
    teams?.forEach((t: any) => {
        matrix[t.id] = {}
        allRounds?.forEach(r => {
            matrix[t.id][r.id] = { submission: null, score: null }
        })
    })

    submissions?.forEach(sub => {
        if (matrix[sub.team_id] && matrix[sub.team_id][sub.round_id]) {
            matrix[sub.team_id][sub.round_id].submission = sub
        }
    })

    scores?.forEach(sc => {
        if (matrix[sc.team_id] && matrix[sc.team_id][sc.round_id]) {
            matrix[sc.team_id][sc.round_id].score = sc
        }
    })

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Participant Submissions Overview</h2>
                    <p className="text-gray-500 font-medium text-sm max-w-2xl">
                        Comprehensive overview of all {teams?.length || 0} teams across competition rounds.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-3">
                        <Users size={20} className="text-blue-600" />
                        <div className="text-right">
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Teams</p>
                            <p className="text-xl font-black text-blue-900 leading-none">{teams?.length || 0}</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <FileText size={20} className="text-emerald-600" />
                        <div className="text-right">
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Submissions</p>
                            <p className="text-xl font-black text-emerald-900 leading-none">{submissions?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {teams?.map((team: any) => {
                    const sel = team.problem_selections?.[0] || team.problem_selections
                    const ps = sel?.problem_statements

                    return (
                        <div key={team.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-blue-200 group">
                            <div className="bg-slate-900 px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group-hover:bg-slate-800 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="bg-white/20 w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-black uppercase">
                                            {team.team_name.charAt(0)}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-extrabold text-white">{team.team_name}</h3>
                                                {team.team_code && (
                                                    <span className="text-xs font-mono bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded font-bold">
                                                        ID: {team.team_code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {ps ? (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-blue-300 font-semibold">
                                            <Lightbulb size={14} className="text-amber-400" />
                                            <span>{ps.statement_code}: {ps.title}</span>
                                            <span className="bg-white/10 text-white px-2 py-0.2 rounded text-[10px] uppercase tracking-wider">{ps.domain}</span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-300 mt-1 font-semibold">Problem Statement: Pending Selection</p>
                                    )}
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-0.5">Rounds Submitted</span>
                                    <span className="text-base font-black text-white">
                                        {allRounds?.filter(r => matrix[team.id][r.id].submission).length} / {allRounds?.length || 2}
                                    </span>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {allRounds?.map(round => {
                                    const data = matrix[team.id]?.[round.id] || {}
                                    const hasSubmission = !!data.submission
                                    const isGraded = !!data.score
                                    const deadlinePassed = now > new Date(round.end_time)

                                    const rubricObj = normalizeRubric(round.rubric, round.round_number, round.name)
                                    const maxScore = calculateMaxScore(rubricObj)

                                    return (
                                        <div key={round.id} className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-base font-bold text-gray-900">
                                                        {round.round_number ? `Round ${round.round_number}: ` : ''}{round.name}
                                                    </h4>
                                                    {maxScore > 0 && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest">
                                                            {maxScore} pts
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-6">
                                                    {hasSubmission ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-xs font-bold text-emerald-600">Submitted</span>
                                                            <span suppressHydrationWarning className="text-xs text-gray-400 font-medium">
                                                                {formatDateTime(data.submission.submitted_at)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${deadlinePassed ? 'bg-red-500' : 'bg-amber-400'}`} />
                                                            <span className={`text-xs font-bold ${deadlinePassed ? 'text-red-600' : 'text-amber-600'}`}>
                                                                {deadlinePassed ? 'Missing Submission (Deadline Passed)' : 'Awaiting Submission'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {isGraded ? (
                                                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                            <CheckCircle2 size={14} className="text-blue-600" />
                                                            <span className="text-xs font-black text-blue-700 uppercase tracking-tight">Score: {data.score.score} / {maxScore || 100}</span>
                                                        </div>
                                                    ) : hasSubmission ? (
                                                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 text-amber-700">
                                                            <Clock size={14} />
                                                            <span className="text-xs font-bold uppercase tracking-tight italic">Pending Judge Evaluation</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div>
                                                {hasSubmission ? (
                                                    <Link
                                                        href={`/dashboard/organizer/submissions/${team.id}/${round.id}`}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors shadow-xs"
                                                    >
                                                        View Details <ArrowRight size={15} />
                                                    </Link>
                                                ) : (
                                                    <div className="px-4 py-2 rounded-lg border border-gray-200 text-gray-400 text-xs font-semibold">
                                                        No Data
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {teams?.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm max-w-2xl mx-auto">
                        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-xl font-bold text-gray-900">No Participants Registered Yet</h3>
                        <p className="text-gray-500 text-sm mt-1">Teams and their submissions will appear here once registered.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
