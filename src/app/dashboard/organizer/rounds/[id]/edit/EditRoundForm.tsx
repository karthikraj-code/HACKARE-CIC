'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    Clock, 
    FileText, 
    Video, 
    Github, 
    Presentation, 
    Save, 
    SlidersHorizontal,
    Sparkles,
    Calendar,
    Trophy,
    Trash2,
    PlusCircle
} from 'lucide-react'
import { normalizeSubmissionConfig, SubmissionFieldConfig, DEFAULT_SUBMISSION_FIELDS } from '@/lib/submissionConfig'
import { 
    DEFAULT_RUBRIC_SCALE, 
    RubricCriterion, 
    QuantitativeRubric, 
    normalizeRubric 
} from '@/lib/rubricConfig'

export default function EditRoundForm({ round }: { round: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Date formatting helper for datetime-local inputs
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const offset = date.getTimezoneOffset()
        date.setMinutes(date.getMinutes() - offset)
        return date.toISOString().slice(0, 16)
    }

    const initialConfig = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
    const initialRubric = normalizeRubric(round.rubric, round.round_number, round.name)

    const [roundNumber, setRoundNumber] = useState(round.round_number || 1)
    const [name, setName] = useState(round.name || '')
    const [description, setDescription] = useState(round.description || '')
    const [startTime, setStartTime] = useState(formatDateForInput(round.start_time))
    const [endTime, setEndTime] = useState(formatDateForInput(round.end_time))

    // 4 Customizable Submission Requirements
    const [submissionFields, setSubmissionFields] = useState<Record<'text' | 'live_demo' | 'github' | 'ppt', SubmissionFieldConfig>>({
        text: initialConfig.fields.text || DEFAULT_SUBMISSION_FIELDS.text,
        live_demo: initialConfig.fields.live_demo || DEFAULT_SUBMISSION_FIELDS.live_demo,
        github: initialConfig.fields.github || DEFAULT_SUBMISSION_FIELDS.github,
        ppt: initialConfig.fields.ppt || DEFAULT_SUBMISSION_FIELDS.ppt,
    })

    // Quantitative Rubric Criteria
    const [criteria, setCriteria] = useState<RubricCriterion[]>(initialRubric.criteria)

    const updateField = (key: 'text' | 'live_demo' | 'github' | 'ppt', patch: Partial<SubmissionFieldConfig>) => {
        setSubmissionFields(prev => ({
            ...prev,
            [key]: { ...prev[key], ...patch }
        }))
    }

    // Rubric Handlers
    const handleAddCriterion = () => {
        const newId = `crit_${Date.now()}`
        setCriteria(prev => [
            ...prev,
            {
                id: newId,
                title: `Criterion ${prev.length + 1}`,
                max_points: 10,
                tiers: {
                    'Excellent': 'Completes ≥90% of requirements with exceptional depth and quality',
                    'Good': 'Completes 70–89% of requirements with good execution and minor issues',
                    'Fair': 'Completes 40–69% of requirements with partial implementation',
                    'Needs Improvement': 'Completes <40% of requirements or lacks meaningful justification'
                }
            }
        ])
    }

    const handleRemoveCriterion = (index: number) => {
        if (criteria.length <= 1) {
            setError('Each round must have at least 1 evaluation criterion.')
            return
        }
        setCriteria(prev => prev.filter((_, i) => i !== index))
    }

    const handleCriterionTitleChange = (index: number, newTitle: string) => {
        setCriteria(prev => prev.map((c, i) => i === index ? { ...c, title: newTitle } : c))
    }

    const handleTierDescriptionChange = (index: number, tierName: string, text: string) => {
        setCriteria(prev => prev.map((c, i) => {
            if (i !== index) return c
            return {
                ...c,
                tiers: {
                    ...c.tiers,
                    [tierName]: text
                }
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Ensure at least one submission field is enabled
        const enabledKeys = (Object.keys(submissionFields) as Array<'text' | 'live_demo' | 'github' | 'ppt'>)
            .filter(k => submissionFields[k].enabled)

        if (enabledKeys.length === 0) {
            setError('Please enable at least one submission requirement for this round.')
            setLoading(false)
            return
        }

        if (criteria.length === 0) {
            setError('Please define at least one evaluation criterion.')
            setLoading(false)
            return
        }

        try {
            const submissionTypePayload = {
                types: enabledKeys,
                fields: submissionFields
            }

            const rubricPayload: QuantitativeRubric = {
                scale: DEFAULT_RUBRIC_SCALE,
                criteria: criteria
            }

            const res = await fetch(`/api/rounds/${round.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    round_number: Number(roundNumber),
                    name,
                    description,
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date(endTime).toISOString(),
                    submission_type: submissionTypePayload,
                    rubric: rubricPayload
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update round')
            }

            router.push('/dashboard/organizer/rounds')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const totalMaxScore = criteria.reduce((sum, c) => sum + (c.max_points || 10), 0)

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECTION 1: Round Basic Information */}
            <div className="space-y-5">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <SlidersHorizontal size={16} className="text-blue-600" /> 1. Round Details & Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* 1. Round Number */}
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Round Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={roundNumber}
                            onChange={(e) => setRoundNumber(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
                            required
                        />
                    </div>

                    {/* 2. Round Name / Title */}
                    <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Round Title / Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Round 1: Problem Definition & Architecture"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-sm"
                            required
                        />
                    </div>
                </div>

                {/* 3. Description */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Round Description & Guidelines
                    </label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed instructions for participants on what to build, format requirements, etc."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs leading-relaxed"
                    />
                </div>

                {/* 4. Timings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Calendar size={14} className="text-blue-600" /> Start Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-semibold"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Clock size={14} className="text-purple-600" /> Submission Deadline <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-semibold"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 2: QUANTITATIVE RUBRIC MATRIX */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" /> 2. Quantitative Evaluation Rubric (10 / 7 / 4 / 2 Scale)
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Standard benchmark performance tiers for judges (Excellent: 10, Good: 7, Fair: 4, Needs Improvement: 2).
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Total Max Score</span>
                        <span className="text-lg font-black text-blue-600">{totalMaxScore} pts</span>
                    </div>
                </div>

                {/* Benchmark Scale Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-black text-emerald-800 uppercase block">Excellent</span>
                        <span className="text-base font-black text-emerald-700">10 pts</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-black text-blue-800 uppercase block">Good</span>
                        <span className="text-base font-black text-blue-700">7 pts</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-black text-amber-800 uppercase block">Fair</span>
                        <span className="text-base font-black text-amber-700">4 pts</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-black text-rose-800 uppercase block">Needs Improvement</span>
                        <span className="text-base font-black text-rose-700">2 pts</span>
                    </div>
                </div>

                {/* Criteria List */}
                <div className="space-y-4">
                    {criteria.map((criterion, idx) => (
                        <div key={criterion.id || idx} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                        Criterion #{idx + 1} Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={criterion.title}
                                        onChange={(e) => handleCriterionTitleChange(idx, e.target.value)}
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Problem Analysis & Requirement Specification"
                                    />
                                </div>
                                {criteria.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCriterion(idx)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors mt-4 cursor-pointer"
                                        title="Remove Criterion"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            {/* 4 Quantitative Tier Benchmark Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                {/* Excellent Tier */}
                                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <label className="text-[11px] font-black text-emerald-800 uppercase block mb-1 flex items-center justify-between">
                                        <span>🟢 Excellent</span>
                                        <span className="font-mono">10 pts</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={criterion.tiers['Excellent'] || ''}
                                        onChange={(e) => handleTierDescriptionChange(idx, 'Excellent', e.target.value)}
                                        className="w-full p-2 border border-emerald-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                        placeholder="Benchmark for 10 pts..."
                                    />
                                </div>

                                {/* Good Tier */}
                                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <label className="text-[11px] font-black text-blue-800 uppercase block mb-1 flex items-center justify-between">
                                        <span>🔵 Good</span>
                                        <span className="font-mono">7 pts</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={criterion.tiers['Good'] || ''}
                                        onChange={(e) => handleTierDescriptionChange(idx, 'Good', e.target.value)}
                                        className="w-full p-2 border border-blue-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        placeholder="Benchmark for 7 pts..."
                                    />
                                </div>

                                {/* Fair Tier */}
                                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                                    <label className="text-[11px] font-black text-amber-800 uppercase block mb-1 flex items-center justify-between">
                                        <span>🟡 Fair</span>
                                        <span className="font-mono">4 pts</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={criterion.tiers['Fair'] || ''}
                                        onChange={(e) => handleTierDescriptionChange(idx, 'Fair', e.target.value)}
                                        className="w-full p-2 border border-amber-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                        placeholder="Benchmark for 4 pts..."
                                    />
                                </div>

                                {/* Needs Improvement Tier */}
                                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                                    <label className="text-[11px] font-black text-rose-800 uppercase block mb-1 flex items-center justify-between">
                                        <span>🔴 Needs Improvement</span>
                                        <span className="font-mono">2 pts</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={criterion.tiers['Needs Improvement'] || ''}
                                        onChange={(e) => handleTierDescriptionChange(idx, 'Needs Improvement', e.target.value)}
                                        className="w-full p-2 border border-rose-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                                        placeholder="Benchmark for 2 pts..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddCriterion}
                        className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl text-xs font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <PlusCircle size={16} /> Add Additional Evaluation Criterion
                    </button>
                </div>
            </div>

            {/* SECTION 3: SUBMISSION REQUIREMENTS */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-indigo-600" /> 3. Submission Requirements & Custom Fields
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Configure which items participants must submit and customize their field titles and placeholders.
                    </p>
                </div>

                <div className="space-y-4">
                    
                    {/* 1. TEXT INPUT */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                        submissionFields.text.enabled ? 'bg-white border-blue-200 shadow-xs' : 'bg-gray-50/70 border-gray-200 opacity-60'
                    }`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    submissionFields.text.enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-gray-900">1. Text Input Field</h3>
                                    <p className="text-[11px] text-gray-500">For written problem approach, methodology summary, or documentation.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={submissionFields.text.enabled}
                                        onChange={(e) => updateField('text', { enabled: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Enable
                                </label>

                                {submissionFields.text.enabled && (
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 select-none">
                                        <input
                                            type="checkbox"
                                            checked={submissionFields.text.required}
                                            onChange={(e) => updateField('text', { required: e.target.checked })}
                                            className="w-3.5 h-3.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                                        />
                                        Mandatory
                                    </label>
                                )}
                            </div>
                        </div>

                        {submissionFields.text.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 animate-in fade-in">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Field Title / Label
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.text.label}
                                        onChange={(e) => updateField('text', { label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Solution Approach & Methodology"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Placeholder Instructions
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.text.placeholder}
                                        onChange={(e) => updateField('text', { placeholder: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Instructions for participants..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. LIVE LINK / DEMO VIDEO */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                        submissionFields.live_demo.enabled ? 'bg-white border-blue-200 shadow-xs' : 'bg-gray-50/70 border-gray-200 opacity-60'
                    }`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    submissionFields.live_demo.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    <Video size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-gray-900">2. Live Link / Demo Video URL</h3>
                                    <p className="text-[11px] text-gray-500">For deployed web apps, live APIs, or YouTube/Loom video demo walkthroughs.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={submissionFields.live_demo.enabled}
                                        onChange={(e) => updateField('live_demo', { enabled: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Enable
                                </label>

                                {submissionFields.live_demo.enabled && (
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 select-none">
                                        <input
                                            type="checkbox"
                                            checked={submissionFields.live_demo.required}
                                            onChange={(e) => updateField('live_demo', { required: e.target.checked })}
                                            className="w-3.5 h-3.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                                        />
                                        Mandatory
                                    </label>
                                )}
                            </div>
                        </div>

                        {submissionFields.live_demo.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 animate-in fade-in">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Field Title / Label
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.live_demo.label}
                                        onChange={(e) => updateField('live_demo', { label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Live Deployed Web App URL"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Placeholder Instructions
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.live_demo.placeholder}
                                        onChange={(e) => updateField('live_demo', { placeholder: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://your-app.vercel.app or YouTube link"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. GITHUB REPOSITORY */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                        submissionFields.github.enabled ? 'bg-white border-blue-200 shadow-xs' : 'bg-gray-50/70 border-gray-200 opacity-60'
                    }`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    submissionFields.github.enabled ? 'bg-slate-900 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    <Github size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-gray-900">3. GitHub Repository</h3>
                                    <p className="text-[11px] text-gray-500">For source code, branches, documentation, and pull requests.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={submissionFields.github.enabled}
                                        onChange={(e) => updateField('github', { enabled: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Enable
                                </label>

                                {submissionFields.github.enabled && (
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 select-none">
                                        <input
                                            type="checkbox"
                                            checked={submissionFields.github.required}
                                            onChange={(e) => updateField('github', { required: e.target.checked })}
                                            className="w-3.5 h-3.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                                        />
                                        Mandatory
                                    </label>
                                )}
                            </div>
                        </div>

                        {submissionFields.github.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 animate-in fade-in">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Field Title / Label
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.github.label}
                                        onChange={(e) => updateField('github', { label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. GitHub Repository Link"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Placeholder Instructions
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.github.placeholder}
                                        onChange={(e) => updateField('github', { placeholder: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. PPT / PRESENTATION LINK */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                        submissionFields.ppt.enabled ? 'bg-white border-blue-200 shadow-xs' : 'bg-gray-50/70 border-gray-200 opacity-60'
                    }`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    submissionFields.ppt.enabled ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    <Presentation size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-gray-900">4. Presentation / PPT Link</h3>
                                    <p className="text-[11px] text-gray-500">For Google Slides, Canva, OneDrive, or presentation deck links.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={submissionFields.ppt.enabled}
                                        onChange={(e) => updateField('ppt', { enabled: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Enable
                                </label>

                                {submissionFields.ppt.enabled && (
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 select-none">
                                        <input
                                            type="checkbox"
                                            checked={submissionFields.ppt.required}
                                            onChange={(e) => updateField('ppt', { required: e.target.checked })}
                                            className="w-3.5 h-3.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                                        />
                                        Mandatory
                                    </label>
                                )}
                            </div>
                        </div>

                        {submissionFields.ppt.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 animate-in fade-in">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Field Title / Label
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.ppt.label}
                                        onChange={(e) => updateField('ppt', { label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Google Slides Presentation Link"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                        Placeholder Instructions
                                    </label>
                                    <input
                                        type="text"
                                        value={submissionFields.ppt.placeholder}
                                        onChange={(e) => updateField('ppt', { placeholder: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://docs.google.com/presentation/d/..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <Link
                    href="/dashboard/organizer/rounds"
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition-colors inline-block text-center"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Save size={16} />
                    {loading ? 'Saving Changes...' : 'Save Round Settings'}
                </button>
            </div>
        </form>
    )
}
