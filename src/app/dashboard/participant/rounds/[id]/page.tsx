'use client'

import { getSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Clock, 
    Calendar,
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
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { formatDateTime } from '@/lib/dateUtils'

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

            // 1. Get Round Details & User Profile concurrently
            const [
                { data: roundData },
                profileRes
            ] = await Promise.all([
                supabase.from('rounds').select('*').eq('id', roundId).maybeSingle(),
                fetch('/api/user/profile').then(r => r.json()).catch(() => null)
            ])

            setRound(roundData)

            if (profileRes?.team) {
                const teamData = profileRes.team
                setTeam(teamData)
                const dbUserId = profileRes.user?.id
                setIsLeader(teamData?.leader_id === user.id || (dbUserId && teamData?.leader_id === dbUserId))

                // 2. Get Team's Selected Problem Statement & Submission concurrently
                const [
                    { data: selData },
                    { data: submission }
                ] = await Promise.all([
                    supabase.from('problem_selections').select('*, problem_statements(*)').eq('team_id', teamData.id).maybeSingle(),
                    supabase.from('submissions').select('*').eq('team_id', teamData.id).eq('round_id', roundId).maybeSingle()
                ])

                if (selData?.problem_statements) {
                    setSelectedProblem(selData.problem_statements)
                }

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
    const startTime = round.start_time ? new Date(round.start_time) : null
    const endTime = round.end_time ? new Date(round.end_time) : null

    const isUpcoming = startTime ? now < startTime : false
    const isClosed = endTime ? now > endTime : false
    const isActive = !isUpcoming && !isClosed

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
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isClosed ? 'bg-slate-600' : isUpcoming ? 'bg-amber-500' : existingSubmission ? 'bg-emerald-600' : 'bg-blue-600'}`} />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                            {round.round_number && <span className="text-blue-600 mr-2">Round {round.round_number}:</span>}
                            {round.name}
                        </h1>
                        <div suppressHydrationWarning className="flex items-center text-gray-600 gap-2 bg-slate-50 max-w-fit px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
                            {isUpcoming ? (
                                <>
                                    <Calendar size={14} className="text-amber-600" />
                                    <span className="text-amber-900 font-bold">Opens: {formatDateTime(startTime)}</span>
                                </>
                            ) : isClosed ? (
                                <>
                                    <Clock size={14} className="text-slate-600" />
                                    <span>Deadline Passed: {formatDateTime(endTime)}</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={14} className="text-blue-600" />
                                    <span>Ends: {formatDateTime(endTime)}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {existingSubmission ? (
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200 shadow-xs">
                            <CheckCircle2 size={18} />
                            Submission Recorded
                        </div>
                    ) : isUpcoming ? (
                        <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-amber-200 shadow-xs">
                            <Calendar size={16} />
                            Upcoming Round
                        </div>
                    ) : null}
                </div>

                {/* Instructions */}
                <div className="prose max-w-none text-gray-700 border-t border-gray-100 pt-6">
                    <h3 className="text-base font-bold text-gray-900 mb-2">Instructions & Guidelines</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                        {round.description || 'Follow the guidelines and provide your complete submission before the deadline.'}
                    </p>
                </div>

                {/* Upcoming Notice */}
                {isUpcoming && (
                    <div className="bg-amber-50 text-amber-900 p-5 rounded-2xl flex items-start gap-3 border border-amber-200">
                        <Calendar className="mt-0.5 shrink-0 text-amber-600" size={20} />
                        <div>
                            <p className="font-extrabold text-sm">Round Not Started Yet</p>
                            <p className="text-xs text-amber-800 mt-0.5">
                                Submissions for this round will open on <strong>{formatDateTime(startTime)}</strong>. You can review the instructions above and prepare your materials in advance.
                            </p>
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
                {team && isLeader && (() => {
                    const submissionConfig = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
                    const fields = submissionConfig.fields

                    return (
                        <div className="border-t border-gray-100 pt-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Your Team Submission</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        Fill in all mandatory requirements configured for this round.
                                    </p>
                                </div>
                                {existingSubmission && (
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                                        <CheckCircle2 size={13} /> Submitted (Editable)
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* 1. TEXT INPUT RESPONSE */}
                                {fields.text.enabled && (
                                    <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                                            <FileText size={16} className="text-blue-600" />
                                            {fields.text.label || 'Written Solution & Technical Summary'}
                                            {fields.text.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <textarea
                                            value={formData.text_response}
                                            required={fields.text.required}
                                            rows={5}
                                            onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                            disabled={isClosed}
                                            placeholder={fields.text.placeholder || 'Describe your approach, system architecture, methodology, and implementation highlights...'}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium disabled:bg-gray-100 leading-relaxed"
                                        />
                                    </div>
                                )}

                                {/* 2. LIVE DEMO / DEPLOYED LINK / VIDEO */}
                                {fields.live_demo.enabled && (
                                    <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                                            <Video size={16} className="text-emerald-600" />
                                            {fields.live_demo.label || 'Live App URL / Demo Video Link'}
                                            {fields.live_demo.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.file_url}
                                            required={fields.live_demo.required}
                                            onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                                            disabled={isClosed}
                                            placeholder={fields.live_demo.placeholder || 'https://your-app.vercel.app or Loom / YouTube video URL'}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium disabled:bg-gray-100"
                                        />
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            * Ensure video/link is publicly viewable without requiring sign-in permissions.
                                        </p>
                                    </div>
                                )}

                                {/* 3. GITHUB REPOSITORY LINK */}
                                {fields.github.enabled && (
                                    <div className="bg-slate-900/5 p-5 rounded-2xl border border-slate-200 space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                                            <Github size={16} className="text-slate-900" />
                                            {fields.github.label || 'GitHub Repository Link'}
                                            {fields.github.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.github_url}
                                            required={fields.github.required}
                                            onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                                            disabled={isClosed}
                                            placeholder={fields.github.placeholder || 'https://github.com/your-team/your-repo'}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium disabled:bg-gray-100"
                                        />
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            * Ensure repository is set to Public or read access is provided to organizers/judges.
                                        </p>
                                    </div>
                                )}

                                {/* 4. PRESENTATION / PPT LINK */}
                                {fields.ppt.enabled && (
                                    <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100 space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                                            <LinkIcon size={16} className="text-purple-600" />
                                            {fields.ppt.label || 'Presentation / Google Slides Link'}
                                            {fields.ppt.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.link}
                                            required={fields.ppt.required}
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            disabled={isClosed}
                                            placeholder={fields.ppt.placeholder || 'https://docs.google.com/presentation/d/... or Canva / OneDrive'}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm font-medium disabled:bg-gray-100"
                                        />
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            * Ensure link access is set to "Anyone with the link can view".
                                        </p>
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
                                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Send size={16} />
                                    {submitting ? 'Saving Submission...' : isClosed ? 'Deadline Passed' : existingSubmission ? 'Update Submission' : 'Submit Final Work'}
                                </button>
                            </form>
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}
