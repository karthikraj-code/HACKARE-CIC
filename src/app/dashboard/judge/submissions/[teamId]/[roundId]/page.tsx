'use client'

import { getSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    FileText, 
    Link as LinkIcon, 
    Save, 
    CheckCircle2, 
    Github, 
    Video, 
    Layers, 
    Lightbulb, 
    ExternalLink,
    Trophy
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import CopyButton from '@/components/CopyButton'

export default function GradeSubmissionPage() {
    const params = useParams()
    const router = useRouter()
    const teamId = params.teamId as string
    const roundId = params.roundId as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [team, setTeam] = useState<any>(null)
    const [round, setRound] = useState<any>(null)
    const [submission, setSubmission] = useState<any>(null)
    const [existingScore, setExistingScore] = useState<any>(null)
    const [selectedProblem, setSelectedProblem] = useState<any>(null)

    const [score, setScore] = useState<number | ''>('')
    const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({})
    const [feedback, setFeedback] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const session = await getSession();
            const user = session?.user as any
            if (!user) return

            // Fetch Team, Round, Submission, Score, and Problem Selection concurrently
            const [
                { data: t },
                { data: r },
                { data: sub },
                { data: sc },
                { data: sel }
            ] = await Promise.all([
                supabase.from('teams').select('*').eq('id', teamId).single(),
                supabase.from('rounds').select('*').eq('id', roundId).single(),
                supabase.from('submissions').select('*').eq('team_id', teamId).eq('round_id', roundId).single(),
                supabase.from('scores').select('*').eq('team_id', teamId).eq('round_id', roundId).eq('judge_id', user.id).single(),
                supabase.from('problem_selections').select('*, problem_statements(*)').eq('team_id', teamId).single()
            ])

            setTeam(t)
            setRound(r)
            setSubmission(sub)
            if (sel?.problem_statements) {
                setSelectedProblem(sel.problem_statements)
            }

            if (sc) {
                setExistingScore(sc)
                setScore(sc.score)
                setCriteriaScores(sc.criteria_scores || {})
                setFeedback(sc.feedback || '')
            }
        } catch (err: any) {
            console.error(err)
            setError('Failed to load submission data')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/judge/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_id: teamId,
                    round_id: roundId,
                    score: Number(score),
                    criteria_scores: criteriaScores,
                    feedback
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save evaluation')
            }

            setSuccess('Evaluation saved successfully!')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-medium text-gray-600">Loading Submission...</p>
            </div>
        )
    }

    if (!team || !round || !submission) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 p-8">
                <Link href="/dashboard/judge/submissions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Submissions
                </Link>
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No submission found</h3>
                    <p className="text-gray-500 text-sm">The team has not submitted their work for this round yet.</p>
                </div>
            </div>
        )
    }

    const isRound1 = round.round_number === 1 || round.submission_type?.includes('problem_architecture_ppt') || round.name?.toLowerCase().includes('round 1')
    const isRound2 = round.round_number === 2 || round.submission_type?.includes('product_code_demo') || round.name?.toLowerCase().includes('round 2')

    const rubric = round.rubric || {}
    const maxScore = Object.values(rubric).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            <Link href="/dashboard/judge/submissions" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Submissions List
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
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">Submitted</span>
                                <span className="text-xs font-bold text-white">
                                    {new Date(submission.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            
                            {/* ROUND 1 SUBMISSIONS */}
                            {isRound1 && (
                                <>
                                    {/* Google Slides Link */}
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
                                                Open Slides <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {/* Architecture Diagram */}
                                    {submission.file_url && (
                                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                                                    <Layers size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Architecture Diagram</p>
                                                    <p className="text-sm font-black text-gray-900">System Blueprint / Diagram</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.file_url.startsWith('http') ? submission.file_url : `https://${submission.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                View Diagram <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {/* Problem & Solution Summary */}
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

                                    {/* Tech Stack */}
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

                            {/* ROUND 2 SUBMISSIONS */}
                            {isRound2 && (
                                <>
                                    {/* GitHub Repo */}
                                    {submission.github_url && (
                                        <div className="bg-slate-900 text-white rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                                    <Github size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Source Code Repository</p>
                                                    <p className="text-sm font-bold text-white font-mono truncate max-w-xs">{submission.github_url}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.github_url.startsWith('http') ? submission.github_url : `https://${submission.github_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-white text-slate-900 rounded-lg text-xs font-black hover:bg-gray-100 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Inspect Code <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {/* Live Application */}
                                    {submission.link && (
                                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                                                    <ExternalLink size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live Working Application</p>
                                                    <p className="text-sm font-black text-gray-900">Deployed Web App / System</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.link.startsWith('http') ? submission.link : `https://${submission.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Open App <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {/* Video Demo Walkthrough */}
                                    {submission.file_url && (
                                        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                                    <Video size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Demo Walkthrough Video</p>
                                                    <p className="text-sm font-black text-gray-900">Video Walkthrough</p>
                                                </div>
                                            </div>
                                            <a
                                                href={submission.file_url.startsWith('http') ? submission.file_url : `https://${submission.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                Watch Demo <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {/* Features & Implementation Highlights */}
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

                            {/* Generic fallback */}
                            {!isRound1 && !isRound2 && (
                                <div className="space-y-4">
                                    {submission.link && (
                                        <div className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-900">Submission Link</span>
                                            <a href={submission.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-xs hover:underline">
                                                Open Link &rarr;
                                            </a>
                                        </div>
                                    )}
                                    {submission.text_response && (
                                        <div className="p-4 bg-slate-50 rounded-xl border text-sm whitespace-pre-wrap">
                                            {submission.text_response}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Right Column: Grading Form */}
                <div className="lg:col-span-5 space-y-6">
                    <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm sticky top-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">Scoring & Evaluation</h2>
                                <p className="text-xs text-gray-500">Rate the submission against the rubric criteria</p>
                            </div>
                        </div>

                        {/* Criteria Breakdown */}
                        {typeof rubric === 'object' && Object.keys(rubric).length > 0 && (
                            <div className="space-y-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 size={16} className="text-blue-600" /> Rubric Criteria Breakdown
                                </h4>
                                {Object.entries(rubric).map(([key, maxVal]) => (
                                    <div key={key} className="space-y-1.5">
                                        <div className="flex justify-between items-center pr-1">
                                            <label className="text-xs font-bold text-gray-700">{key}</label>
                                            <span className="text-[11px] font-black text-blue-700 bg-blue-100/60 px-2 py-0.2 rounded-md">
                                                Max {String(maxVal)} pts
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            max={Number(maxVal)}
                                            value={criteriaScores[key] ?? ''}
                                            onChange={(e) => {
                                                const newVal = e.target.value === '' ? 0 : Number(e.target.value)
                                                const updated = { ...criteriaScores, [key]: newVal }
                                                setCriteriaScores(updated)
                                                // Auto-calculate total score
                                                const total = Object.values(updated).reduce((a, b) => a + b, 0)
                                                setScore(total)
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white font-bold text-sm"
                                            placeholder={`0 - ${maxVal}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Calculated Total Score */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Total Calculated Score
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max={maxScore > 0 ? maxScore : undefined}
                                    value={score}
                                    onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                                    readOnly={Object.keys(rubric).length > 0}
                                    required
                                    className="w-full text-2xl px-4 py-3 border border-blue-200 rounded-xl font-black bg-blue-50 text-blue-700"
                                />
                                {maxScore > 0 && (
                                    <span className="text-gray-500 font-extrabold text-xl whitespace-nowrap">
                                        / {maxScore} pts
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Feedback Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Constructive Judge Feedback (Optional)
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm leading-relaxed"
                                placeholder="Highlight strengths, architecture feasibility, code suggestions, or areas of improvement..."
                            />
                        </div>

                        {/* Error & Success Messages */}
                        {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">{error}</div>}
                        {success && <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">{success}</div>}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? 'Saving Evaluation...' : existingScore ? 'Update Evaluation' : 'Submit Evaluation'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
