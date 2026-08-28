'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
    PlusCircle, 
    Calendar, 
    Clock, 
    FileText, 
    Sparkles, 
    Edit2, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    Save, 
    ArrowRight 
} from 'lucide-react'
import DeleteRoundButton from './DeleteRoundButton'
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { normalizeRubric, calculateMaxScore } from '@/lib/rubricConfig'
import { formatDateTime } from '@/lib/dateUtils'

interface Round {
    id: string
    name: string
    description?: string
    start_time: string
    end_time: string
    round_number: number
    submission_type?: any
    rubric?: Record<string, number>
}

interface ManageRoundsClientProps {
    initialRounds: Round[]
}

export default function ManageRoundsClient({ initialRounds }: ManageRoundsClientProps) {
    const router = useRouter()
    const [rounds, setRounds] = useState<Round[]>(initialRounds)
    
    // Synchronize state if server props change
    useEffect(() => {
        setRounds(initialRounds)
    }, [initialRounds])

    // Immediate local state update upon deletion
    const handleRoundDeleted = (deletedRoundId: string) => {
        setRounds(prev => prev.filter(r => r.id !== deletedRoundId))
        setSuccessMessage('Round deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 4000)
    }
    
    // Quick Timing Editor Modal state
    const [editingTimingRound, setEditingTimingRound] = useState<Round | null>(null)
    const [startTimeInput, setStartTimeInput] = useState('')
    const [endTimeInput, setEndTimeInput] = useState('')
    const [savingTiming, setSavingTiming] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    // Format ISO string to datetime-local value
    const formatForInput = (isoString: string) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        const offset = date.getTimezoneOffset()
        date.setMinutes(date.getMinutes() - offset)
        return date.toISOString().slice(0, 16)
    }

    const openTimingEditor = (round: Round) => {
        setEditingTimingRound(round)
        setStartTimeInput(formatForInput(round.start_time))
        setEndTimeInput(formatForInput(round.end_time))
        setError('')
        setSuccessMessage('')
    }

    const handleSaveTiming = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingTimingRound) return

        setSavingTiming(true)
        setError('')
        setSuccessMessage('')

        try {
            const res = await fetch(`/api/rounds/${editingTimingRound.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_time: new Date(startTimeInput).toISOString(),
                    end_time: new Date(endTimeInput).toISOString()
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update round timing')
            }

            // Update local state
            setRounds(prev => prev.map(r => {
                if (r.id === editingTimingRound.id) {
                    return {
                        ...r,
                        start_time: new Date(startTimeInput).toISOString(),
                        end_time: new Date(endTimeInput).toISOString()
                    }
                }
                return r
            }))

            setSuccessMessage(`Timing updated for ${editingTimingRound.name}!`)
            setEditingTimingRound(null)
            router.refresh()
            setTimeout(() => setSuccessMessage(''), 4000)
        } catch (err: any) {
            setError(err.message || 'Failed to save timing')
        } finally {
            setSavingTiming(false)
        }
    }

    const now = new Date()

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-1">Manage Competition Rounds</h1>
                    <p className="text-gray-600 text-sm">
                        Configure round schedules, adjust start and deadline timings, and monitor competition milestones ({rounds.length} rounds configured).
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/organizer/rounds/create"
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-sm text-sm"
                    >
                        <PlusCircle size={18} />
                        Create New Round
                    </Link>
                </div>
            </div>

            {/* Success & Error Toasts */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-3 text-sm font-bold animate-in fade-in">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 text-sm font-bold animate-in fade-in">
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Rounds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rounds.map((round) => {
                    const startTime = new Date(round.start_time)
                    const endTime = new Date(round.end_time)

                    let statusColor = "bg-gray-100 text-gray-800 border-gray-200"
                    let statusText = "UPCOMING"

                    if (now >= startTime && now <= endTime) {
                        statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                        statusText = "ACTIVE NOW"
                    } else if (now > endTime) {
                        statusColor = "bg-slate-100 text-slate-600 border-slate-200"
                        statusText = "ENDED"
                    }

                    const rubricObj = normalizeRubric(round.rubric, round.round_number, round.name)
                    const maxScore = calculateMaxScore(rubricObj)

                    return (
                        <div 
                            key={round.id} 
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all hover:shadow-md"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3 gap-2">
                                    <h3 className="font-extrabold text-gray-900 text-lg leading-snug">
                                        {round.round_number && (
                                            <span className="text-blue-600 mr-1.5 font-mono">
                                                R{round.round_number}:
                                            </span>
                                        )}
                                        {round.name}
                                    </h3>
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 uppercase tracking-wider ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-xs mb-5 leading-relaxed line-clamp-3">
                                    {round.description || 'No description provided.'}
                                </p>

                                {/* Schedule & Timing Card */}
                                <div className="space-y-2.5 text-xs text-gray-600 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-blue-600" />
                                            <span className="font-semibold">Start:</span>
                                        </div>
                                        <span suppressHydrationWarning className="font-mono text-slate-800 font-bold text-[11px]">
                                            {formatDateTime(startTime)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-purple-600" />
                                            <span className="font-semibold">Deadline:</span>
                                        </div>
                                        <span suppressHydrationWarning className="font-mono text-slate-800 font-bold text-[11px]">
                                            {formatDateTime(endTime)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-gray-400" />
                                            <span className="font-semibold">Format:</span>
                                        </div>
                                        {(() => {
                                            const cfg = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
                                            const labels = []
                                            if (cfg.fields.ppt.enabled) labels.push('PPT')
                                            if (cfg.fields.github.enabled) labels.push('GitHub')
                                            if (cfg.fields.live_demo.enabled) labels.push('Live Demo')
                                            if (cfg.fields.text.enabled) labels.push('Text')
                                            return (
                                                <span className="capitalize font-bold text-slate-700 text-[11px] truncate max-w-[140px]" title={labels.join(', ')}>
                                                    {labels.join(', ') || 'Text'}
                                                </span>
                                            )
                                        })()}
                                    </div>

                                    {maxScore > 0 && (
                                        <div className="flex items-center justify-between text-blue-700 font-bold pt-1 border-t border-slate-200/60">
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={14} className="text-blue-600" />
                                                <span>Max Marks:</span>
                                            </div>
                                            <span>{maxScore} pts</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Timing Editor Button */}
                                <button
                                    onClick={() => openTimingEditor(round)}
                                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-blue-200 cursor-pointer"
                                >
                                    <Clock size={14} /> Change Round Timing
                                </button>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="bg-gray-50/80 border-t border-gray-100 px-6 py-3.5 flex justify-between items-center text-xs font-bold">
                                <Link 
                                    href="/dashboard/organizer/submissions" 
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    Submissions <ArrowRight size={12} />
                                </Link>
                                <div className="flex items-center gap-3">
                                    <Link 
                                        href={`/dashboard/organizer/rounds/${round.id}/edit`} 
                                        className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                                    >
                                        <Edit2 size={12} /> Edit Details
                                    </Link>
                                    <DeleteRoundButton 
                                        roundId={round.id} 
                                        roundName={round.name} 
                                        onDeleted={handleRoundDeleted}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {rounds.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-white">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900">No rounds created yet</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1 mb-4">
                            Click below to seed the 3 competition rounds automatically.
                        </p>
                        <Link
                            href="/dashboard/organizer/problem-statements"
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors inline-block"
                        >
                            Go to Seed 3 Rounds & Problems &rarr;
                        </Link>
                    </div>
                )}
            </div>

            {/* QUICK TIMING EDITOR MODAL */}
            {editingTimingRound && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Clock size={22} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-base">Adjust Round Timing</h3>
                                    <p className="text-xs text-gray-500 font-semibold truncate max-w-[240px]">
                                        {editingTimingRound.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingTimingRound(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTiming} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Start Time & Date
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={startTimeInput}
                                    onChange={e => setStartTimeInput(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    End Time / Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={endTimeInput}
                                    onChange={e => setEndTimeInput(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 font-semibold">
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingTimingRound(null)}
                                    disabled={savingTiming}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingTiming}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Save size={15} />
                                    {savingTiming ? 'Saving...' : 'Save Timing'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
