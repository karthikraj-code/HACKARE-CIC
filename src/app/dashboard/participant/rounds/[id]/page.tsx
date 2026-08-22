'use client'

import { getSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Clock, 
    AlertCircle, 
    FileText, 
    Link as LinkIcon, 
    CheckCircle2, 
    Github, 
    Video, 
    Layers, 
    Lightbulb, 
    Send,
    ExternalLink
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import CopyButton from '@/components/CopyButton'

export default function RoundSubmissionPage() {
    const params = useParams()
    const roundId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [round, setRound] = useState<any>(null)
    const [team, setTeam] = useState<any>(null)
    const [isLeader, setIsLeader] = useState(false)
    const [existingSubmission, setExistingSubmission] = useState<any>(null)
    const [selectedProblem, setSelectedProblem] = useState<any>(null)

    const [formData, setFormData] = useState({
        text_response: '',
        file_url: '',
        link: '',
        github_url: '',
        chatgpt_link_2: ''
    })

    useEffect(() => {
        fetchRoundData()
    }, [])

    const fetchRoundData = async () => {
        try {
            const session = await getSession();
            const user = session?.user as any
            if (!user) return

            // 1. Get Round Details
            const { data: roundData } = await supabase
                .from('rounds')
                .select('*')
                .eq('id', roundId)
                .single()

            setRound(roundData)

            // 2. Get Team Details
            const { data: membership } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .single()

            if (membership) {
                const { data: teamData } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('id', membership.team_id)
                    .single()

                setTeam(teamData)
                setIsLeader(teamData?.leader_id === user.id)

                // 3. Get Team's Selected Problem Statement
                const { data: selData } = await supabase
                    .from('problem_selections')
                    .select('*, problem_statements(*)')
                    .eq('team_id', teamData.id)
                    .single()

                if (selData?.problem_statements) {
                    setSelectedProblem(selData.problem_statements)
                }

                // 4. Get Existing Submission
                const { data: submission } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('team_id', teamData.id)
                    .eq('round_id', roundId)
                    .single()

                if (submission) {
                    setExistingSubmission(submission)
                    setFormData({
                        text_response: submission.text_response || '',
                        file_url: submission.file_url || '',
                        link: submission.link || '',
                        github_url: submission.github_url || '',
                        chatgpt_link_2: submission.chatgpt_link_2 || ''
                    })
                }
            }
        } catch (err: any) {
            console.error(err)
            setError('Failed to load round details')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const payload: any = {
                round_id: roundId,
                ...formData
            }

            const res = await fetch('/api/rounds/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit')
            }

            setSuccess('Successfully submitted!')
            await fetchRoundData()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-medium text-gray-600">Loading Round Details...</p>
            </div>
        )
    }

    if (!round) return <div className="p-8 text-center text-slate-500 font-bold">Round not found.</div>

    const now = new Date()
    const endTime = new Date(round.end_time)
    const isClosed = now > endTime
    const isRound1 = round.round_number === 1 || round.submission_type?.includes('problem_architecture_ppt') || round.name?.toLowerCase().includes('round 1')
    const isRound2 = round.round_number === 2 || round.submission_type?.includes('product_code_demo') || round.name?.toLowerCase().includes('round 2')

    const rubric = round.rubric || {}

    return (
        <div className="max-w-4xl space-y-6 mx-auto pb-16">
            <Link href="/dashboard/participant/rounds" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Rounds
            </Link>

            {/* Problem Statement Card */}
            {selectedProblem ? (
                <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl shadow-xs">
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
                                <CheckCircle2 size={14} /> Team Focus Area
                            </span>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-emerald-950 mb-2">{selectedProblem.title}</h3>
                    <p className="text-xs text-emerald-950 whitespace-pre-line leading-relaxed bg-white/70 p-3.5 rounded-xl border border-emerald-200/60 font-medium">{selectedProblem.description}</p>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lightbulb className="text-amber-600 shrink-0" size={24} />
                        <div>
                            <p className="text-sm font-bold text-amber-900">Your team has not locked a problem statement</p>
                            <p className="text-xs text-amber-800">Please choose a problem statement to tailor this submission.</p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/participant/problem-statement"
                        className="text-xs font-bold bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shrink-0 shadow-sm"
                    >
                        Choose Statement &rarr;
                    </Link>
                </div>
            )}

            {/* Main Round Card */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden space-y-6">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isClosed ? 'bg-slate-600' : existingSubmission ? 'bg-emerald-600' : 'bg-blue-600'}`} />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                            {round.round_number && <span className="text-blue-600 mr-2">Round {round.round_number}:</span>}
                            {round.name}
                        </h1>
                        <div className="flex items-center text-gray-600 gap-2 bg-slate-50 max-w-fit px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
                            <Clock size={14} className={isClosed ? 'text-slate-600' : 'text-blue-600'} />
                            {isClosed ? 'Deadline Passed' : `Ends: ${endTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                    </div>
                    {existingSubmission && (
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200 shadow-xs">
                            <CheckCircle2 size={18} />
                            Submission Recorded
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="prose max-w-none text-gray-700 border-t border-gray-100 pt-6">
                    <h3 className="text-base font-bold text-gray-900 mb-2">Instructions & Guidelines</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                        {round.description || 'Follow the rubric criteria below and provide your complete submission before the deadline.'}
                    </p>
                </div>

                {/* Scoring Rubric Preview */}
                {Object.keys(rubric).length > 0 && (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Evaluation Rubric & Weightage</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(rubric).map(([crit, pts]) => (
                                <div key={crit} className="flex justify-between items-center bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold">
                                    <span className="text-gray-800">{crit}</span>
                                    <span className="text-blue-600 font-mono font-black">{pts as any} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Team Status Warnings */}
                {!team ? (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex items-start gap-3 border border-amber-200">
                        <AlertCircle className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Not in a team</p>
                            <p className="text-xs">You must join or create a team to submit work for this round.</p>
                        </div>
                    </div>
                ) : !isLeader ? (
                    <div className="bg-sky-50 text-sky-800 p-4 rounded-xl flex items-start gap-3 border border-sky-200">
                        <AlertCircle className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Team Leader Only</p>
                            <p className="text-xs">Only your team leader can submit or edit work on behalf of {team.team_name}.</p>
                        </div>
                    </div>
                ) : null}

                {/* Submission Form (Leader Only) */}
                {team && isLeader && (
                    <div className="border-t border-gray-100 pt-8">
                        <h3 className="text-xl font-black text-gray-900 mb-6">Your Team Submission</h3>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* ROUND 1 FORM: PPT & Architecture */}
                            {isRound1 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                                        <p className="font-bold">Round 1 Requirements Checklist:</p>
                                        <ul className="list-disc pl-5 space-y-0.5">
                                            <li>Problem Definition & Proposed Solution approach for your chosen statement.</li>
                                            <li>System Architecture Diagram (Microservices, ML pipeline, APIs, DB Schema).</li>
                                            <li>Presentation slides link (set Google Slides / Drive link sharing to Anyone with Link).</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <LinkIcon size={16} className="text-blue-600" />
                                            Google Slides / Presentation Link <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.link}
                                            required
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://docs.google.com/presentation/d/... or Canva / OneDrive"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium disabled:bg-gray-50"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1.5">* Ensure link access is set to "Anyone with the link can view".</p>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <Layers size={16} className="text-blue-600" />
                                            System Architecture Diagram Link / Image URL <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.file_url}
                                            required
                                            onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://drive.google.com/... or Figma / Eraser.io / Imgur direct image link"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium disabled:bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <FileText size={16} className="text-blue-600" />
                                            Executive Problem & Proposed Solution Summary <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.text_response}
                                            required
                                            rows={5}
                                            onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="Summarize the core problem statement, your proposed AI methodology, data pipeline, and why your solution stands out..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium disabled:bg-gray-50 leading-relaxed"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <FileText size={16} className="text-blue-600" />
                                            Key Tech Stack & Planned AI Models <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.chatgpt_link_2}
                                            required
                                            onChange={e => setFormData({ ...formData, chatgpt_link_2: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="e.g. Next.js, PyTorch, YOLOv8, FastAPI, PostgreSQL, Supabase, Pinecone"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium disabled:bg-gray-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ROUND 2 FORM: Code Demo & Working Product */}
                            {isRound2 && (
                                <div className="space-y-6">
                                    <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                                        <p className="font-bold">Round 2 Requirements Checklist:</p>
                                        <ul className="list-disc pl-5 space-y-0.5">
                                            <li>Clean, well-documented source code repository on GitHub.</li>
                                            <li>Live deployed application link (e.g. Vercel, Streamlit, HuggingFace Space, AWS).</li>
                                            <li>Video demo walkthrough showing the working features and UI (Loom, YouTube, Drive).</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <Github size={16} className="text-slate-900" />
                                            GitHub Repository Link <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.github_url}
                                            required
                                            onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://github.com/your-team/your-repo"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium disabled:bg-gray-50"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1.5">* Ensure the repository is Public or access is provided to judges.</p>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <ExternalLink size={16} className="text-emerald-600" />
                                            Live Deployed Application URL <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.link}
                                            required
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://your-app.vercel.app or https://huggingface.co/spaces/..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium disabled:bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <Video size={16} className="text-blue-600" />
                                            Demo Video Walkthrough Link <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.file_url}
                                            required
                                            onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://www.loom.com/share/... or YouTube / Google Drive video"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium disabled:bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                            <FileText size={16} className="text-gray-900" />
                                            Implemented Features & Technical Highlights <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.text_response}
                                            required
                                            rows={5}
                                            onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="Describe what features you implemented, model accuracy/benchmarks achieved, UI features, challenges resolved, and future scope..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm font-medium disabled:bg-gray-50 leading-relaxed"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Fallback for Generic Round types */}
                            {!isRound1 && !isRound2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Submission Link</label>
                                        <input
                                            type="url"
                                            value={formData.link}
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Summary / Details</label>
                                        <textarea
                                            value={formData.text_response}
                                            rows={5}
                                            onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                            disabled={isClosed}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error & Success Messages */}
                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                            {success && (
                                <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    <span>{success}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isClosed || submitting}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                            >
                                <Send size={16} />
                                {submitting ? 'Saving Submission...' : isClosed ? 'Deadline Passed' : existingSubmission ? 'Update Submission' : 'Submit Final Work'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
