import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { 
    Trophy, 
    Calendar, 
    Clock, 
    FileText, 
    CheckCircle2, 
    Video, 
    Github, 
    Presentation, 
    Layers, 
    ArrowRight,
    SlidersHorizontal,
    Info
} from 'lucide-react'
import { normalizeRubric, calculateMaxScore } from '@/lib/rubricConfig'
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { formatDateTime } from '@/lib/dateUtils'

export default async function JudgeRubricsPage() {
    const supabase = await createClient()

    // Fetch all rounds in order
    const { data: rounds, error } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true })

    const allRounds = rounds || []

    return (
        <div className="space-y-8 pb-16">
            
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200">
                        <Trophy size={14} className="text-amber-500" /> Evaluation & Guidelines Guide
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Rounds Details & Marks Criteria</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Detailed round descriptions, required participant deliverables, and quantitative 4-tier rubric benchmarks.
                    </p>
                </div>

                {/* Benchmark Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                    <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] font-black text-emerald-800 uppercase block">Excellent</span>
                        <span className="text-xs font-black text-emerald-700">10 pts</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] font-black text-blue-800 uppercase block">Good</span>
                        <span className="text-xs font-black text-blue-700">7 pts</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] font-black text-amber-800 uppercase block">Fair</span>
                        <span className="text-xs font-black text-amber-700">4 pts</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] font-black text-rose-800 uppercase block">Needs Impr.</span>
                        <span className="text-xs font-black text-rose-700">2 pts</span>
                    </div>
                </div>
            </div>

            {/* Rounds List */}
            {allRounds.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-sm">
                    <Trophy size={40} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-base font-bold text-gray-800">No Rounds Scheduled Yet</h3>
                    <p className="text-xs text-gray-500 mt-1">The organizers haven't published competition rounds yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {allRounds.map((round) => {
                        const quantitativeRubric = normalizeRubric(round.rubric, round.round_number, round.name)
                        const maxScore = calculateMaxScore(quantitativeRubric)
                        const submissionConfig = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)
                        const fields = submissionConfig.fields

                        return (
                            <div 
                                key={round.id}
                                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
                            >
                                {/* Round Header */}
                                <div className="bg-slate-900 px-8 py-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                                {round.round_number ? `Round ${round.round_number}` : 'Competition Phase'}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-black text-white">{round.name}</h2>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="bg-white/10 px-4 py-2 rounded-2xl text-center border border-white/10">
                                            <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider block">Max Score</span>
                                            <span className="text-xl font-black text-white">{maxScore} pts</span>
                                        </div>

                                        <Link
                                            href="/dashboard/judge/submissions"
                                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                                        >
                                            Evaluate <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    
                                    {/* 1. Schedule & Timings */}
                                    <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-100 text-xs">
                                        <div className="flex items-center gap-2 text-gray-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold">
                                            <Calendar size={14} className="text-blue-600" />
                                            <span suppressHydrationWarning>Start: {formatDateTime(round.start_time)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold">
                                            <Clock size={14} className="text-purple-600" />
                                            <span suppressHydrationWarning>Deadline: {formatDateTime(round.end_time)}</span>
                                        </div>
                                    </div>

                                    {/* 2. Round Description & Guidelines */}
                                    {round.description && (
                                        <div className="space-y-2 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                            <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-1.5">
                                                <Info size={14} className="text-blue-600" /> Round Description & Guidelines
                                            </h3>
                                            <p className="text-xs text-blue-950 leading-relaxed font-medium whitespace-pre-wrap">
                                                {round.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* 3. What Participants Need to Submit */}
                                    <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                            <SlidersHorizontal size={14} className="text-indigo-600" /> What Participants Need to Submit
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            
                                            {/* Text Requirement */}
                                            {fields.text.enabled && (
                                                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={15} className="text-blue-600" />
                                                            <span className="font-bold text-xs text-gray-900">
                                                                {fields.text.label || 'Written Text Solution'}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                            fields.text.required ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {fields.text.required ? 'Mandatory' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    {fields.text.placeholder && (
                                                        <p className="text-[11px] text-gray-500 italic">
                                                            "{fields.text.placeholder}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Live Demo Requirement */}
                                            {fields.live_demo.enabled && (
                                                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Video size={15} className="text-emerald-600" />
                                                            <span className="font-bold text-xs text-gray-900">
                                                                {fields.live_demo.label || 'Live App / Demo Video'}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                            fields.live_demo.required ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {fields.live_demo.required ? 'Mandatory' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    {fields.live_demo.placeholder && (
                                                        <p className="text-[11px] text-gray-500 italic">
                                                            "{fields.live_demo.placeholder}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* GitHub Requirement */}
                                            {fields.github.enabled && (
                                                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Github size={15} className="text-slate-900" />
                                                            <span className="font-bold text-xs text-gray-900">
                                                                {fields.github.label || 'Source Code Repository'}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                            fields.github.required ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {fields.github.required ? 'Mandatory' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    {fields.github.placeholder && (
                                                        <p className="text-[11px] text-gray-500 italic">
                                                            "{fields.github.placeholder}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* PPT Requirement */}
                                            {fields.ppt.enabled && (
                                                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Presentation size={15} className="text-purple-600" />
                                                            <span className="font-bold text-xs text-gray-900">
                                                                {fields.ppt.label || 'Presentation / Slides'}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                            fields.ppt.required ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {fields.ppt.required ? 'Mandatory' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    {fields.ppt.placeholder && (
                                                        <p className="text-[11px] text-gray-500 italic">
                                                            "{fields.ppt.placeholder}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </div>

                                    {/* 4. Criteria & 4-Tier Matrix */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <CheckCircle2 size={14} className="text-blue-600" /> Evaluation Criteria & Performance Benchmarks
                                        </h3>

                                        <div className="space-y-4">
                                            {quantitativeRubric.criteria.map((criterion, cIdx) => (
                                                <div 
                                                    key={criterion.id || cIdx}
                                                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-black text-gray-900">
                                                            {cIdx + 1}. {criterion.title}
                                                        </h4>
                                                        <span className="text-[11px] font-black text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md font-mono">
                                                            Max {criterion.max_points || 10} pts
                                                        </span>
                                                    </div>

                                                    {/* 4 Benchmark Cards */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                                                        {/* Excellent 10 */}
                                                        <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs flex flex-col justify-between">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="font-black text-[10px] text-emerald-800 uppercase">🟢 Excellent</span>
                                                                <span className="font-black text-emerald-700 font-mono">10 pts</span>
                                                            </div>
                                                            <p className="text-[11px] text-emerald-950 leading-relaxed font-medium">
                                                                {criterion.tiers['Excellent'] || 'Completes ≥90% of requirements with exceptional depth and quality.'}
                                                            </p>
                                                        </div>

                                                        {/* Good 7 */}
                                                        <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs flex flex-col justify-between">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="font-black text-[10px] text-blue-800 uppercase">🔵 Good</span>
                                                                <span className="font-black text-blue-700 font-mono">7 pts</span>
                                                            </div>
                                                            <p className="text-[11px] text-blue-950 leading-relaxed font-medium">
                                                                {criterion.tiers['Good'] || 'Completes 70–89% of requirements with good execution and minor issues.'}
                                                            </p>
                                                        </div>

                                                        {/* Fair 4 */}
                                                        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs flex flex-col justify-between">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="font-black text-[10px] text-amber-800 uppercase">🟡 Fair</span>
                                                                <span className="font-black text-amber-700 font-mono">4 pts</span>
                                                            </div>
                                                            <p className="text-[11px] text-amber-950 leading-relaxed font-medium">
                                                                {criterion.tiers['Fair'] || 'Completes 40–69% of requirements with partial implementation.'}
                                                            </p>
                                                        </div>

                                                        {/* Needs Improvement 2 */}
                                                        <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs flex flex-col justify-between">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="font-black text-[10px] text-rose-800 uppercase">🔴 Needs Impr.</span>
                                                                <span className="font-black text-rose-700 font-mono">2 pts</span>
                                                            </div>
                                                            <p className="text-[11px] text-rose-950 leading-relaxed font-medium">
                                                                {criterion.tiers['Needs Improvement'] || 'Completes <40% of requirements or lacks meaningful justification.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
