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
    Trophy,
    Sparkles,
    Check,
    SlidersHorizontal,
    Info
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import CopyButton from '@/components/CopyButton'
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { normalizeRubric, calculateMaxScore, QuantitativeRubric } from '@/lib/rubricConfig'
import { formatDateTime } from '@/lib/dateUtils'

export default function GradeSubmissionPage() {
    const params = useParams()
    const router = useRouter()
    const teamId = params.teamId as string
    const roundId = params.roundId as string
    const supabase = createClient()

    const [team, setTeam] = useState<any>(null)
    const [round, setRound] = useState<any>(null)
    const [submission, setSubmission] = useState<any>(null)
    const [existingScore, setExistingScore] = useState<any>(null)
    const [selectedProblem, setSelectedProblem] = useState<any>(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [score, setScore] = useState<number | ''>('')
    const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({})
    const [feedback, setFeedback] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        if (teamId && roundId) {
            fetchData()
        }
    }, [teamId, roundId])

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

    const handleSelectTier = (criterionTitle: string, points: number) => {
        const updated = {
            ...criteriaScores,
            [criterionTitle]: points
        }
        setCriteriaScores(updated)

        // Automatically sum up total score
        const total = Object.values(updated).reduce((a, b) => a + Number(b), 0)
        setScore(total)
    }

    const handleScoreManualChange = (criterionTitle: string, value: number, maxPoints: number) => {
        const clampedVal = Math.min(Math.max(0, value), maxPoints)
        const updated = {
            ...criteriaScores,
            [criterionTitle]: clampedVal
        }
        setCriteriaScores(updated)

        const total = Object.values(updated).reduce((a, b) => a + Number(b), 0)
        setScore(total)
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

    const quantitativeRubric = normalizeRubric(round.rubric, round.round_number, round.name)
    const maxScore = calculateMaxScore(quantitativeRubric)

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <Link href="/dashboard/judge/submissions" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Submissions List
            </Link>

            {/* Problem Statement Card */}
            {selectedProblem && (
                <div className="bg-emerald-50/90 border border-emerald-200 p-6 rounded-3xl shadow-xs space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {selectedProblem.statement_code}
                            </span>
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {selectedProblem.domain}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 ml-1">
                                Assigned Problem Statement
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <CopyButton
                                text={`${selectedProblem.statement_code}: ${selectedProblem.title}\n\n${selectedProblem.description}`}
                                label="Copy Statement"
                                variant="pill"
                            />
                            <Link
                                href="/dashboard/judge/problem-statements"
                                target="_blank"
                                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                            >
                                All Statements Directory <ExternalLink size={12} />
                            </Link>
                        </div>
                    </div>

                    <h3 className="text-base font-black text-gray-900 leading-snug">
                        {selectedProblem.title}
                    </h3>
                    
                    <div className="p-4 bg-white/80 rounded-2xl border border-emerald-200/70 text-xs text-gray-700 leading-relaxed whitespace-pre-line font-medium max-h-48 overflow-y-auto">
                        {selectedProblem.description}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Submission Deliverables (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        
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

                        {/* Deliverables Dynamic View */}
                        <div className="p-8 space-y-6">
                            {(() => {
                                const submissionConfig = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
                                const fields = submissionConfig.fields

                                return (
                                    <>
                                        {/* Round Description & Submission Expectations */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                                    <SlidersHorizontal size={14} className="text-blue-600" /> Round Instructions & Required Deliverables
                                                </h4>
                                                <span className="text-[10px] font-bold text-gray-500">
                                                    Round {round.round_number || 1}: {round.name}
                                                </span>
                                            </div>

                                            {round.description && (
                                                <p className="text-xs text-gray-700 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-slate-200/80 whitespace-pre-wrap">
                                                    {round.description}
                                                </p>
                                            )}

                                            {/* Enabled requirement checklist */}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {fields.text.enabled && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                                                        📝 {fields.text.label || 'Text Solution'} {fields.text.required ? '(Mandatory)' : '(Optional)'}
                                                    </span>
                                                )}
                                                {fields.live_demo.enabled && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                                        🎥 {fields.live_demo.label || 'Live Demo'} {fields.live_demo.required ? '(Mandatory)' : '(Optional)'}
                                                    </span>
                                                )}
                                                {fields.github.enabled && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300">
                                                        💻 {fields.github.label || 'GitHub Repo'} {fields.github.required ? '(Mandatory)' : '(Optional)'}
                                                    </span>
                                                )}
                                                {fields.ppt.enabled && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200">
                                                        📊 {fields.ppt.label || 'Presentation'} {fields.ppt.required ? '(Mandatory)' : '(Optional)'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 1. Presentation Slides Link */}
                                        {submission.link && (
                                            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
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
                                                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                                                >
                                                    Open Slides <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        )}

                                        {/* 2. GitHub Repository Link */}
                                        {submission.github_url && (
                                            <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
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
                                                    className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-gray-100 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                                                >
                                                    Inspect Code <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        )}

                                        {/* 3. Live Demo / Deployed Link / Video URL */}
                                        {submission.file_url && (
                                            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
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
                                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
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
                                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-wrap">
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

                {/* Right Column: Quantitative Scoring Matrix Form (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <form onSubmit={handleSave} className="bg-white p-7 rounded-3xl border border-gray-200 shadow-sm sticky top-6 space-y-6">
                        
                        {/* Title Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Trophy size={22} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Quantitative Scoring</h2>
                                    <p className="text-xs text-gray-500">Select benchmark performance tier</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase text-gray-400 block">Total</span>
                                <span className="text-xl font-black text-blue-600">
                                    {score !== '' ? score : 0} <span className="text-xs text-gray-400 font-bold">/ {maxScore}</span>
                                </span>
                            </div>
                        </div>

                        {/* Interactive Criteria Breakdown Matrix */}
                        <div className="space-y-5">
                            {quantitativeRubric.criteria.map((criterion, idx) => {
                                const currentScore = criteriaScores[criterion.title]
                                const tiers = quantitativeRubric.scale // [Excellent: 10, Good: 7, Fair: 4, Needs Improvement: 2]

                                return (
                                    <div key={criterion.id || idx} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-black text-gray-900 leading-tight">
                                                {criterion.title}
                                            </h4>
                                            <span className="text-[11px] font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md whitespace-nowrap ml-2">
                                                Awarded: {currentScore !== undefined ? `${currentScore} pts` : 'Pending'}
                                            </span>
                                        </div>

                                        {/* 4 Interactive Tier Cards */}
                                        <div className="grid grid-cols-1 gap-2">
                                            {tiers.map((tier) => {
                                                const isSelected = currentScore === tier.points
                                                const benchmarkText = criterion.tiers[tier.name] || `Standard benchmark for ${tier.name} (${tier.points} pts)`

                                                let cardStyles = "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-gray-700"
                                                let badgeStyles = "bg-gray-100 text-gray-700"

                                                if (isSelected) {
                                                    if (tier.name === 'Excellent') {
                                                        cardStyles = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20"
                                                        badgeStyles = "bg-emerald-600 text-white"
                                                    } else if (tier.name === 'Good') {
                                                        cardStyles = "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20"
                                                        badgeStyles = "bg-blue-600 text-white"
                                                    } else if (tier.name === 'Fair') {
                                                        cardStyles = "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20"
                                                        badgeStyles = "bg-amber-600 text-white"
                                                    } else {
                                                        cardStyles = "border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20"
                                                        badgeStyles = "bg-rose-600 text-white"
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={tier.id}
                                                        type="button"
                                                        onClick={() => handleSelectTier(criterion.title, tier.points)}
                                                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${cardStyles}`}
                                                    >
                                                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5 flex items-center gap-1 ${badgeStyles}`}>
                                                            {isSelected && <Check size={12} className="stroke-[3]" />}
                                                            <span>{tier.name}</span>
                                                            <span>({tier.points})</span>
                                                        </div>
                                                        <p className="text-[11px] font-medium leading-relaxed flex-1">
                                                            {benchmarkText}
                                                        </p>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Feedback Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Constructive Judge Feedback (Optional)
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs leading-relaxed"
                                placeholder="Highlight strengths, architecture feasibility, code suggestions, or areas of improvement..."
                            />
                        </div>

                        {/* Error & Success Messages */}
                        {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">{error}</div>}
                        {success && <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">{success}</div>}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-xs transition-all shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Save size={16} />
                            {saving ? 'Saving Evaluation...' : existingScore ? 'Update Evaluation' : 'Submit Evaluation'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
