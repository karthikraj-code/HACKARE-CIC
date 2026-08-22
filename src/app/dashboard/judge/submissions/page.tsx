import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, Lightbulb } from 'lucide-react'

export default async function JudgeSubmissionsPage() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    // 1. Get teams assigned to this judge
    const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('team_id')
        .eq('judge_id', user?.id)

    const assignedTeamIds = assignments?.map(a => a.team_id) || []

    // 2. Get details of those teams along with their problem statement selection
    const { data: teams } = await supabase
        .from('teams')
        .select(`
            id, 
            team_name,
            problem_selections (
                problem_statements (
                    statement_code,
                    title,
                    domain
                )
            )
        `)
        .in('id', assignedTeamIds.length ? assignedTeamIds : ['00000000-0000-0000-0000-000000000000'])
        .order('team_name')

    // 3. Get all rounds (Round 1 & Round 2)
    const { data: rounds } = await supabase
        .from('rounds')
        .select('id, name, round_number, end_time, submission_type, rubric')
        .order('round_number', { ascending: true })

    // 4. Get submissions for these teams
    const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .in('team_id', assignedTeamIds.length ? assignedTeamIds : ['00000000-0000-0000-0000-000000000000'])

    // 5. Get existing scores given by THIS judge
    const { data: scores } = await supabase
        .from('scores')
        .select('*')
        .eq('judge_id', user?.id)

    const now = new Date()

    // Build a lookup: map[team_id][round_id] = { submission, score }
    const matrix: any = {}
    teams?.forEach((t: any) => {
        matrix[t.id] = {}
        rounds?.forEach(r => {
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

    if (!assignedTeamIds.length) {
        return (
            <div className="p-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600 text-sm">The organizer has not assigned any teams to you for review. When teams are assigned, they will appear here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Review & Score Submissions</h2>
                <p className="text-gray-600 text-sm">
                    You are assigned to evaluate <strong className="text-gray-900">{teams?.length} teams</strong> across the 2 competition rounds.
                </p>
            </div>

            <div className="space-y-8">
                {teams?.map((team: any) => {
                    const sel = team.problem_selections?.[0] || team.problem_selections
                    const ps = sel?.problem_statements

                    return (
                        <div key={team.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-blue-200 transition-all">
                            <div className="bg-slate-900 px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h3 className="text-xl font-extrabold text-white">{team.team_name}</h3>
                                    {ps ? (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-blue-300 font-semibold">
                                            <Lightbulb size={14} className="text-amber-400" />
                                            <span>{ps.statement_code}: {ps.title}</span>
                                            <span className="bg-white/10 text-white px-2 py-0.2 rounded text-[10px] uppercase tracking-wider">{ps.domain}</span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-1">Problem Statement Pending</p>
                                    )}
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {rounds?.map(round => {
                                    const data = matrix[team.id]?.[round.id] || {}
                                    const hasSubmission = !!data.submission
                                    const isGraded = !!data.score
                                    const deadlinePassed = now > new Date(round.end_time)

                                    const rubric = round.rubric || {}
                                    const maxScore = Object.values(rubric).reduce((a: number, b: any) => a + (Number(b) || 0), 0)

                                    return (
                                        <div key={round.id} className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-gray-900 text-base">
                                                        {round.round_number ? `Round ${round.round_number}: ` : ''}{round.name}
                                                    </h4>
                                                    {maxScore > 0 && (
                                                        <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                            Max {maxScore} pts
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-xs text-gray-500 flex flex-wrap items-center gap-4">
                                                    {hasSubmission ? (
                                                        <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                                            <CheckCircle2 size={15} /> Submitted
                                                        </span>
                                                    ) : (
                                                        <span className={`${deadlinePassed ? 'text-slate-500' : 'text-amber-600'} font-semibold flex items-center gap-1.5`}>
                                                            <Clock size={15} /> {deadlinePassed ? 'Deadline Passed (No Submission)' : 'Awaiting Submission'}
                                                        </span>
                                                    )}

                                                    {isGraded && (
                                                        <span className="text-blue-700 font-black px-2.5 py-0.5 bg-blue-50 rounded-full border border-blue-200">
                                                            Score Given: {data.score.score} / {maxScore || 100}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                {hasSubmission ? (
                                                    <Link
                                                        href={`/dashboard/judge/submissions/${team.id}/${round.id}`}
                                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs flex items-center gap-2 ${
                                                            isGraded
                                                                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                                        }`}
                                                    >
                                                        {isGraded ? 'Edit Evaluation' : 'Evaluate Work'} <ArrowRight size={16} />
                                                    </Link>
                                                ) : (
                                                    <button disabled className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-400 cursor-not-allowed">
                                                        No Submission Yet
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
