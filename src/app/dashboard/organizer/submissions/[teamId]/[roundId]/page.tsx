import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { 
    ArrowLeft, 
    FileText, 
    ExternalLink, 
    Trophy, 
    User, 
    Clock, 
    Lightbulb, 
    Github, 
    Video, 
    Layers,
    AlertCircle 
} from 'lucide-react'
import CopyButton from '@/components/CopyButton'
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { normalizeRubric, calculateMaxScore } from '@/lib/rubricConfig'
import { formatDateTime } from '@/lib/dateUtils'

export default async function OrganizerSubmissionDetail({
    params,
}: {
    params: { teamId: string; roundId: string }
}) {
    const { teamId, roundId } = await params
    const supabase = await createAdminClient()

    // 1. Get Team, Round, Submission, Score, and Problem Statement
    const [
        { data: team },
        { data: round },
        { data: submission },
        { data: score },
        { data: sel }
    ] = await Promise.all([
        supabase.from('teams').select('*').eq('id', teamId).single(),
        supabase.from('rounds').select('*').eq('id', roundId).single(),
        supabase.from('submissions').select('*').eq('team_id', teamId).eq('round_id', roundId).single(),
        supabase.from('scores').select('*, users(name)').eq('team_id', teamId).eq('round_id', roundId).single(),
        supabase.from('problem_selections').select('*, problem_statements(*)').eq('team_id', teamId).single()
    ])

    if (!team || !round || !submission) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 p-8">
                <Link href="/dashboard/organizer/submissions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Submissions
                </Link>
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Submission data missing</h3>
                    <p className="text-gray-500 text-sm mt-1">The team might not have submitted anything for this round yet.</p>
                </div>
            </div>
        )
    }

    const selectedProblem = sel?.problem_statements

    const quantitativeRubric = normalizeRubric(round.rubric, round.round_number, round.name)
    const maxScore = calculateMaxScore(quantitativeRubric)

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            <Link href="/dashboard/organizer/submissions" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Submissions
            </Link>

            {/* Problem Statement Card */}
            {selectedProblem && (
                <div className="bg-emerald-50/80 border border-emerald-200 p-6 rounded-2xl shadow-xs">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                                {selectedProblem.statement_code}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{selectedProblem.domain}</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">{selectedProblem.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{selectedProblem.description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Submission Deliverables */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        
                        {/* Header */}
                        <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                                    {round.round_number ? `Round ${round.round_number}` : 'Competition Round'}
                                </span>
                                <h1 className="text-2xl font-black text-white">{team.team_name}</h1>
                                <p className="text-xs text-gray-400 mt-1 font-mono">Team ID: {team.id}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Submitted On</span>
                                <span suppressHydrationWarning className="text-xs font-bold text-white">
                                    {formatDateTime(submission.submitted_at)}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {(() => {
                                const submissionConfig = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
                                const fields = submissionConfig.fields

                                return (
                                    <>
                                        {/* 1. Presentation Slides Link */}
                                        {submission.link && (
                                            <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                                                            {fields.ppt.label || 'Presentation / Slides Link'}
                                                        </p>
                                                        <p className="text-sm font-black text-gray-900 truncate">{submission.link}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={submission.link.startsWith('http') ? submission.link : `https://${submission.link}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                                                >
                                                    Open Link <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        )}

                                        {/* 2. GitHub Code Repository */}
                                        {submission.github_url && (
                                            <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                                                        <Github size={22} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                                                            {fields.github.label || 'Source Code Repository'}
                                                        </p>
                                                        <p className="text-sm font-bold text-white font-mono truncate">{submission.github_url}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={submission.github_url.startsWith('http') ? submission.github_url : `https://${submission.github_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-5 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-black hover:bg-gray-100 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                                                >
                                                    Inspect Repo <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        )}

                                        {/* 3. Live Demo / Deployed Link / Video URL */}
                                        {submission.file_url && (
                                            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                                        <Video size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                                            {fields.live_demo.label || 'Live App / Demo Video Link'}
                                                        </p>
                                                        <p className="text-sm font-black text-gray-900 truncate">{submission.file_url}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={submission.file_url.startsWith('http') ? submission.file_url : `https://${submission.file_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                                                >
                                                    Open Link <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        )}

                                        {/* 4. Text / Written Response */}
                                        {submission.text_response && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <FileText size={15} /> {fields.text.label || 'Written Solution & Summary'}
                                                </h4>
                                                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                                    {submission.text_response}
                                                </div>
                                            </div>
                                        )}

                                        {/* 5. Additional Tech Stack / Secondary Details */}
                                        {submission.chatgpt_link_2 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Layers size={15} /> Planned Tech Stack & AI Models
                                                </h4>
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-gray-800 text-sm font-semibold">
                                                    {submission.chatgpt_link_2}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                </div>

                {/* Right Column: Evaluation Records */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm sticky top-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Trophy size={22} />
                            </div>
                            <h2 className="text-xl font-extrabold text-gray-900">Evaluation Records</h2>
                        </div>

                        {!score ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Clock size={36} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">Pending Judge Review</p>
                                <p className="text-xs text-slate-400 mt-1">This submission has not been evaluated by a judge yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-md">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 opacity-80 block mb-1">
                                        Total Marks Awarded
                                    </span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black">{score.score}</span>
                                        <span className="text-lg font-bold opacity-75">/ {maxScore || 100} pts</span>
                                    </div>
                                </div>

                                {score.criteria_scores && Object.keys(score.criteria_scores).length > 0 && (
                                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantitative Criteria Breakdown</h4>
                                        {Object.entries(score.criteria_scores).map(([critTitle, pts]) => {
                                            const criterionObj = quantitativeRubric.criteria.find(c => c.title === critTitle)
                                            const ptsNum = Number(pts)
                                            
                                            let tierLabel = 'Custom Score'
                                            let tierColor = 'bg-blue-100 text-blue-800'
                                            if (ptsNum === 10) {
                                                tierLabel = '🟢 Excellent (10 pts)'
                                                tierColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            } else if (ptsNum === 7) {
                                                tierLabel = '🔵 Good (7 pts)'
                                                tierColor = 'bg-blue-100 text-blue-800 border-blue-200'
                                            } else if (ptsNum === 4) {
                                                tierLabel = '🟡 Fair (4 pts)'
                                                tierColor = 'bg-amber-100 text-amber-800 border-amber-200'
                                            } else if (ptsNum === 2) {
                                                tierLabel = '🔴 Needs Improvement (2 pts)'
                                                tierColor = 'bg-rose-100 text-rose-800 border-rose-200'
                                            }

                                            return (
                                                <div key={critTitle} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-gray-900">{critTitle}</span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${tierColor}`}>
                                                            {tierLabel}
                                                        </span>
                                                    </div>
                                                    {criterionObj && (
                                                        <p className="text-[11px] text-gray-600 leading-relaxed italic">
                                                            {ptsNum === 10 ? criterionObj.tiers['Excellent'] :
                                                             ptsNum === 7 ? criterionObj.tiers['Good'] :
                                                             ptsNum === 4 ? criterionObj.tiers['Fair'] :
                                                             ptsNum === 2 ? criterionObj.tiers['Needs Improvement'] : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {score.feedback && (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                        <h4 className="font-bold text-gray-700 mb-1">Judge Feedback</h4>
                                        <p className="text-gray-600 italic">"{score.feedback}"</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Evaluated By</p>
                                        <p className="text-xs font-bold text-gray-800">{score.users?.name || 'Assigned Judge'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
