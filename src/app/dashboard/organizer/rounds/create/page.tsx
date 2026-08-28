'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    PlusCircle, 
    Calendar, 
    Clock, 
    FileText, 
    Video, 
    Github, 
    Presentation, 
    Sparkles, 
    HelpCircle,
    SlidersHorizontal,
    Trophy,
    Trash2,
    CheckCircle2
} from 'lucide-react'
import { DEFAULT_SUBMISSION_FIELDS, SubmissionFieldConfig } from '@/lib/submissionConfig'
import { 
    DEFAULT_RUBRIC_SCALE, 
    STANDARD_ROUND_RUBRICS, 
    RubricCriterion, 
    QuantitativeRubric, 
    normalizeRubric, 
    calculateMaxScore 
} from '@/lib/rubricConfig'

// Base configurations for quick presets (Rounds 1 - 6)
const ROUND_PRESETS = [
    { 
        number: 1,
        name: 'Round 1: Online Certification & Practical Learning', 
        description: 'Complete prescribed course content, certification, and practical exercises. Submit certification credential link, practical exercise repo/demo, and learning summary.',
        submissionConfig: {
            text: {
                enabled: true,
                required: true,
                label: 'Course & Assessment Performance Summary',
                placeholder: 'Summarize topics mastered, key learnings, and assessment percentage achieved...'
            },
            live_demo: {
                enabled: true,
                required: false,
                label: 'Online Certificate Credential Link',
                placeholder: 'https://coursera.org/verify/... or certificate URL'
            },
            github: {
                enabled: true,
                required: false,
                label: 'Practical Exercises Repository URL',
                placeholder: 'https://github.com/your-team/course-exercises'
            },
            ppt: {
                enabled: false,
                required: false,
                label: DEFAULT_SUBMISSION_FIELDS.ppt.label,
                placeholder: DEFAULT_SUBMISSION_FIELDS.ppt.placeholder
            }
        },
        rubric: STANDARD_ROUND_RUBRICS[1].criteria
    },
    { 
        number: 2,
        name: 'Round 2: Problem Analysis & Reverse Engineering', 
        description: 'Identify major features, user workflows, and comprehensive functional & non-functional requirements. Submit your analysis document and presentation deck.',
        submissionConfig: {
            text: {
                enabled: true,
                required: true,
                label: 'Problem Analysis & Requirement Specifications',
                placeholder: 'Detail the functional requirements, non-functional constraints, user personas, and target workflows...'
            },
            live_demo: {
                enabled: true,
                required: false,
                label: 'Workflow Diagram / Blueprint Link',
                placeholder: 'https://drive.google.com/... or Figma / Eraser diagram'
            },
            github: {
                enabled: false,
                required: false,
                label: DEFAULT_SUBMISSION_FIELDS.github.label,
                placeholder: DEFAULT_SUBMISSION_FIELDS.github.placeholder
            },
            ppt: {
                enabled: true,
                required: true,
                label: 'Problem Analysis Presentation / Slides Link',
                placeholder: 'https://docs.google.com/presentation/d/...'
            }
        },
        rubric: STANDARD_ROUND_RUBRICS[2].criteria
    },
    { 
        number: 3,
        name: 'Round 3: Architecture & Feature Design', 
        description: 'Design system architecture representing all components/data flows with well-justified technical decisions. Submit architecture diagrams, schema designs, and design deck.',
        submissionConfig: {
            text: {
                enabled: true,
                required: true,
                label: 'Architectural Decisions & Trade-off Justifications',
                placeholder: 'Explain chosen AI models, database schema, caching strategies, and technology trade-offs...'
            },
            live_demo: {
                enabled: true,
                required: true,
                label: 'Architecture Diagram / System Blueprint URL',
                placeholder: 'https://drive.google.com/... or Figma / Eraser link'
            },
            github: {
                enabled: false,
                required: false,
                label: DEFAULT_SUBMISSION_FIELDS.github.label,
                placeholder: DEFAULT_SUBMISSION_FIELDS.github.placeholder
            },
            ppt: {
                enabled: true,
                required: true,
                label: 'Architecture & Design Slide Deck',
                placeholder: 'https://docs.google.com/presentation/d/...'
            }
        },
        rubric: STANDARD_ROUND_RUBRICS[3].criteria
    },
    { 
        number: 4,
        name: 'Round 4: Feature Development', 
        description: 'Implement core features with functional frontend, backend, API, and database integration. Submit source code repository and live working demo link.',
        submissionConfig: {
            text: {
                enabled: true,
                required: true,
                label: 'Implemented Features & Integration Details',
                placeholder: 'Describe features implemented, API endpoints created, and database models active...'
            },
            live_demo: {
                enabled: true,
                required: true,
                label: 'Live Deployed Application / Working Endpoint URL',
                placeholder: 'https://your-app.vercel.app'
            },
            github: {
                enabled: true,
                required: true,
                label: 'GitHub Source Code Repository URL',
                placeholder: 'https://github.com/your-team/core-app'
            },
            ppt: {
                enabled: false,
                required: false,
                label: DEFAULT_SUBMISSION_FIELDS.ppt.label,
                placeholder: DEFAULT_SUBMISSION_FIELDS.ppt.placeholder
            }
        },
        rubric: STANDARD_ROUND_RUBRICS[4].criteria
    },
    { 
        number: 5,
        name: 'Round 5: Testing, Refinement & Documentation', 
        description: 'Test suite coverage, resolve major bugs, performance optimization, and comprehensive documentation. Submit repository with tests and documentation.',
        submissionConfig: {
            text: {
                enabled: true,
                required: true,
                label: 'Test Results, Bug Fixes & Documentation Highlights',
                placeholder: 'Detail test case coverage %, major bugs resolved, API documentation links...'
            },
            live_demo: {
                enabled: true,
                required: false,
                label: 'Live Staging / Documentation URL',
                placeholder: 'https://your-app.vercel.app or Postman docs link'
            },
            github: {
                enabled: true,
                required: true,
                label: 'GitHub Repository with Test Suites',
                placeholder: 'https://github.com/your-team/repo-name'
            },
            ppt: {
                enabled: false,
                required: false,
                label: DEFAULT_SUBMISSION_FIELDS.ppt.label,
                placeholder: DEFAULT_SUBMISSION_FIELDS.ppt.placeholder
            }
        },
        rubric: STANDARD_ROUND_RUBRICS[5].criteria
    },
    { 
        number: 6,
        name: 'Round 6: Final Demonstration, Code Review & Technical Defense', 
        description: 'Final working product presentation, clean code review, and technical defense answering architecture and engineering questions.',
        submissionConfig: {
            text: {
                enabled: true,
                required: true,
                label: 'Technical Defense & Final Product Overview',
                placeholder: 'Final architecture summary, competitive differentiators, and deployment instructions...'
            },
            live_demo: {
                enabled: true,
                required: true,
                label: 'Live Production URL & Demo Video Walkthrough',
                placeholder: 'https://your-app.vercel.app or YouTube/Loom demo video'
            },
            github: {
                enabled: true,
                required: true,
                label: 'Final Production GitHub Repository URL',
                placeholder: 'https://github.com/your-team/final-project'
            },
            ppt: {
                enabled: true,
                required: true,
                label: 'Final Pitch Deck / Slide Presentation',
                placeholder: 'https://docs.google.com/presentation/d/...'
            }
        },
        rubric: STANDARD_ROUND_RUBRICS[6].criteria
    }
]

export default function CreateRoundPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [roundNumber, setRoundNumber] = useState(1)
    const [name, setName] = useState(ROUND_PRESETS[0].name)
    const [description, setDescription] = useState(ROUND_PRESETS[0].description)
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    // 4 Customizable Submission Requirements
    const [submissionFields, setSubmissionFields] = useState<Record<'text' | 'live_demo' | 'github' | 'ppt', SubmissionFieldConfig>>({
        text: { ...DEFAULT_SUBMISSION_FIELDS.text, ...ROUND_PRESETS[0].submissionConfig.text },
        live_demo: { ...DEFAULT_SUBMISSION_FIELDS.live_demo, ...ROUND_PRESETS[0].submissionConfig.live_demo },
        github: { ...DEFAULT_SUBMISSION_FIELDS.github, ...ROUND_PRESETS[0].submissionConfig.github },
        ppt: { ...DEFAULT_SUBMISSION_FIELDS.ppt, ...ROUND_PRESETS[0].submissionConfig.ppt },
    })

    // Quantitative Rubric State
    const [criteria, setCriteria] = useState<RubricCriterion[]>(ROUND_PRESETS[0].rubric)

    const handlePresetSelect = (presetIndex: number) => {
        if (presetIndex === -1) {
            setName('Custom Round')
            setDescription('')
            setCriteria([
                {
                    id: 'crit_custom_1',
                    title: 'Custom Evaluation Criterion',
                    max_points: 10,
                    tiers: {
                        'Excellent': 'Meets 100% of expectations with outstanding quality (≥90%)',
                        'Good': 'Meets 70–89% of expectations with solid execution',
                        'Fair': 'Meets 40–69% with partial deliverables',
                        'Needs Improvement': 'Meets <40% or requires significant revision'
                    }
                }
            ])
            return
        }
        const preset = ROUND_PRESETS[presetIndex]
        if (preset) {
            setRoundNumber(preset.number)
            setName(preset.name)
            setDescription(preset.description)
            setSubmissionFields({
                text: { ...DEFAULT_SUBMISSION_FIELDS.text, ...preset.submissionConfig.text },
                live_demo: { ...DEFAULT_SUBMISSION_FIELDS.live_demo, ...preset.submissionConfig.live_demo },
                github: { ...DEFAULT_SUBMISSION_FIELDS.github, ...preset.submissionConfig.github },
                ppt: { ...DEFAULT_SUBMISSION_FIELDS.ppt, ...preset.submissionConfig.ppt },
            })
            setCriteria(preset.rubric)
        }
    }

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

        const enabledKeys = (Object.keys(submissionFields) as Array<'text' | 'live_demo' | 'github' | 'ppt'>)
            .filter(k => submissionFields[k].enabled)

        if (enabledKeys.length === 0) {
            setError('Please enable at least one submission requirement for this round.')
            setLoading(false)
            return
        }

        if (criteria.length === 0) {
            setError('Please define at least one quantitative evaluation criterion.')
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

            const res = await fetch('/api/rounds/create', {
                method: 'POST',
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
                throw new Error(data.error || 'Failed to create round')
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
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <Link 
                href="/dashboard/organizer/rounds" 
                className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Round Management
            </Link>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <PlusCircle size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Create Competition Round</h1>
                        <p className="text-xs text-gray-500">Configure round details, customizable participant submissions, and quantitative evaluation rubric</p>
                    </div>
                </div>

                {/* Quick Presets Carousel / Badges */}
                <div className="mb-8 p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-blue-600" />
                        <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                            Quick Templates (Rounds 1–6)
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {ROUND_PRESETS.map((preset, idx) => (
                            <button
                                key={preset.number}
                                type="button"
                                onClick={() => handlePresetSelect(idx)}
                                className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                                    roundNumber === preset.number && name === preset.name
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                }`}
                            >
                                <span className={`text-[10px] font-black block uppercase ${
                                    roundNumber === preset.number && name === preset.name ? 'text-blue-200' : 'text-blue-600'
                                }`}>
                                    Phase {preset.number}
                                </span>
                                <span className="text-xs font-bold truncate block">
                                    {preset.name.split(':')[1]?.trim() || preset.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* SECTION 1: ROUND BASIC INFORMATION */}
                    <div className="space-y-4">
                        <div className="border-b border-gray-100 pb-2">
                            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                                <FileText size={16} className="text-blue-600" /> 1. Round Information & Timings
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Round Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    required
                                    value={roundNumber}
                                    onChange={(e) => setRoundNumber(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Round Name / Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Round 2: Problem Analysis & Reverse Engineering"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Round Description / Guidelines
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Explain what participants need to work on and provide in this round..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-blue-600" /> Start Date & Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <Clock size={14} className="text-purple-600" /> Submission Deadline <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    Define benchmark performance criteria. Judges rate submissions using standard quantitative tiers (Excellent: 10, Good: 7, Fair: 4, Needs Improvement: 2).
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Total Max Score</span>
                                <span className="text-lg font-black text-blue-600">{totalMaxScore} pts</span>
                            </div>
                        </div>

                        {/* Standard Benchmark Scale Preview */}
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
                                Select which items participants must submit and customize their field titles and placeholders.
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

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <Link
                            href="/dashboard/organizer/rounds"
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition-colors inline-block text-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                            {loading ? 'Creating Round...' : 'Create & Publish Round'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
