import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { 
    ArrowRight, 
    CheckSquare, 
    Trophy, 
    Lightbulb, 
    Layers, 
    Users, 
    Calendar,
    Sparkles
} from 'lucide-react'
import { normalizeRubric, calculateMaxScore } from '@/lib/rubricConfig'

export default async function JudgeDashboard() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    // Fetch assignments count, rounds, and problem statements concurrently
    const [
        { count: assignmentCount },
        { data: roundsData },
        { data: problemsData }
    ] = await Promise.all([
        supabase.from('judge_assignments').select('*', { count: 'exact', head: true }).eq('judge_id', user?.id),
        supabase.from('rounds').select('*').order('round_number', { ascending: true }),
        supabase.from('problem_statements').select('id, domain')
    ])

    const totalAssignments = assignmentCount || 0
    const rounds = roundsData || []
    const problemCount = problemsData?.length || 0
    const domains = Array.from(new Set(problemsData?.map(p => p.domain).filter(Boolean) || []))

    return (
        <div className="space-y-8 pb-16">
            
            {/* Welcome Banner */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200">
                        <Sparkles size={14} className="text-blue-600" /> Evaluation Portal
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">
                        Welcome back, {user?.name || 'Judge'}
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Access marks criteria, problem statement benchmarks, and score assigned team submissions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/judge/submissions"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                    >
                        <CheckSquare size={16} /> Review Submissions <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Submissions & Assignments */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                            Team Assignments
                        </span>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">
                            {totalAssignments}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            {totalAssignments > 0
                                ? `You are assigned to evaluate submissions from ${totalAssignments} teams.`
                                : 'No teams assigned yet. Once assigned, they will appear in your review list.'}
                        </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <Link 
                            href="/dashboard/judge/submissions"
                            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5"
                        >
                            Open Submissions Review &rarr;
                        </Link>
                    </div>
                </div>

                {/* 2. Marks Criteria & Rubrics */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                            <Trophy size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                            Evaluation Framework
                        </span>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">
                            {rounds.length} <span className="text-sm font-bold text-gray-400">Rounds</span>
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Standard 4-tier benchmark scale (Excellent: 10, Good: 7, Fair: 4, Needs Improvement: 2).
                        </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <Link 
                            href="/dashboard/judge/rubrics"
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5"
                        >
                            View All Marks Criteria &rarr;
                        </Link>
                    </div>
                </div>

                {/* 3. Problem Statements Catalogue */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                            <Lightbulb size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                            Problem Statements
                        </span>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">
                            {problemCount}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Across {domains.length} domains ({domains.slice(0, 3).join(', ')}{domains.length > 3 ? '...' : ''}).
                        </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <Link 
                            href="/dashboard/judge/problem-statements"
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                        >
                            Browse Problem Statements &rarr;
                        </Link>
                    </div>
                </div>

            </div>

            {/* Competition Rounds Preview with Marks Criteria */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Trophy size={20} className="text-amber-500" /> Competition Rounds & Marks Criteria
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Overview of active competition rounds and their scoring weightages.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/judge/rubrics"
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                        Full Rubrics Guide &rarr;
                    </Link>
                </div>

                {rounds.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-500">No competition rounds published yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rounds.map((r) => {
                            const rubricObj = normalizeRubric(r.rubric, r.round_number, r.name)
                            const maxScore = calculateMaxScore(rubricObj)

                            return (
                                <div 
                                    key={r.id}
                                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between hover:bg-white hover:border-blue-300 transition-all hover:shadow-sm"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                                Round {r.round_number || 1}
                                            </span>
                                            <span className="text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                                                Max {maxScore} pts
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-gray-900 leading-snug">{r.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                            {r.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-gray-500">
                                        <span>{rubricObj.criteria.length} Criteria</span>
                                        <Link 
                                            href="/dashboard/judge/rubrics"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View Criteria &rarr;
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

        </div>
    )
}
