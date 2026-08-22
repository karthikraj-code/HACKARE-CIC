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
    const isRound1 = round.round_number === 1 || round.submission_type?.includes('problem_architecture_ppt') || round.name?.toLowerCase().includes('round 1')
    const isRound2 = round.round_number === 2 || round.submission_type?.includes('product_code_demo') || round.name?.toLowerCase().includes('round 2')

    const rubric = round.rubric || {}
    const maxScore = Object.values(rubric).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)

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
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                                {selectedProblem.domain}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CopyButton
                                text={`${selectedProblem.statement_code}: ${selectedProblem.title}\n\n${selectedProblem.description}`}
                                label="Copy Statement"
                                variant="pill"
                            />
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                <Lightbulb size={14} className="text-amber-500" /> Team Problem Statement
                            </span>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-emerald-950 mb-2">{selectedProblem.title}</h3>
                    <p className="text-xs text-emerald-950 whitespace-pre-line leading-relaxed bg-white/70 p-3.5 rounded-xl border border-emerald-200/60 font-medium">{selectedProblem.description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Submission Content */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-2xl font-black">{team.team_name}</h2>
                                    {team.team_code && (
                                        <span className="text-xs font-mono bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded font-bold">
                                            ID: {team.team_code}
                                        </span>
                                    )}
                                </div>
                                <p className="text-blue-400 font-bold uppercase tracking-wider text-xs mt-0.5">
                                    {round.round_number ? `Round ${round.round_number}: ` : ''}{round.name}
                                </p>
                            </div>

                            <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/20">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">Submitted At</span>
                                <span className="text-xs font-bold text-white">
                                    {new Date(submission.submitted_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* ROUND 1 VIEW */}
                            {isRound1 && (
                                <>
                                    {submission.link && (
                                        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Round 1 PPT Link</p>
                                                    <p className="text-sm font-black text-gray-900">Google Slides Presentation</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.link.startsWith('http') ? submission.link : `https://${submission.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Open Presentation <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {submission.file_url && (
                                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                                                    <Layers size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Architecture Diagram</p>
                                                    <p className="text-sm font-black text-gray-900">System Architecture Blueprint</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.file_url.startsWith('http') ? submission.file_url : `https://${submission.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Open Diagram <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {submission.text_response && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={15} /> Problem Definition & Proposed Solution
                                            </h4>
                                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                                {submission.text_response}
                                            </div>
                                        </div>
                                    )}

                                    {submission.chatgpt_link_2 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Layers size={15} /> Planned Tech Stack & AI Models
                                            </h4>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-gray-800 text-sm font-semibold">
                                                {submission.chatgpt_link_2}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ROUND 2 VIEW */}
                            {isRound2 && (
                                <>
                                    {submission.github_url && (
                                        <div className="bg-slate-900 text-white rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                                    <Github size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">GitHub Code Repository</p>
                                                    <p className="text-sm font-bold text-white font-mono truncate max-w-xs">{submission.github_url}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.github_url.startsWith('http') ? submission.github_url : `https://${submission.github_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-white text-slate-900 rounded-lg text-xs font-black hover:bg-gray-100 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Inspect Repo <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {submission.link && (
                                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                                                    <ExternalLink size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live Working Application</p>
                                                    <p className="text-sm font-black text-gray-900">Deployed URL</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.link.startsWith('http') ? submission.link : `https://${submission.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Open Live App <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {submission.file_url && (
                                        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                                    <Video size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Demo Walkthrough Video</p>
                                                    <p className="text-sm font-black text-gray-900">Product Walkthrough</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.file_url.startsWith('http') ? submission.file_url : `https://${submission.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Watch Video <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {submission.text_response && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={15} /> Implemented Features & Technical Architecture
                                            </h4>
                                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                                {submission.text_response}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
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

                                {score.criteria_scores && (
                                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Criteria Breakdown</h4>
                                        {Object.entries(score.criteria_scores).map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-center text-xs font-semibold">
                                                <span className="text-gray-700">{k}</span>
                                                <span className="text-blue-700 font-mono font-bold">{v as any} / {rubric[k] || 10}</span>
                                            </div>
                                        ))}
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
