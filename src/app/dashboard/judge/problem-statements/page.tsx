'use client'

import { useState, useEffect } from 'react'
import { 
    Lightbulb, 
    Search, 
    Filter, 
    Users, 
    CheckCircle2, 
    Layers, 
    Sparkles, 
    FileText 
} from 'lucide-react'
import CopyButton from '@/components/CopyButton'

interface ProblemStatement {
    id: string
    statement_code: string
    title: string
    description: string
    domain: string
    max_teams: number
    selected_count: number
    selected_teams?: string[]
}

export default function JudgeProblemStatementsPage() {
    const [loading, setLoading] = useState(true)
    const [problems, setProblems] = useState<ProblemStatement[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('All')
    const [error, setError] = useState('')

    useEffect(() => {
        fetchProblems(true)

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchProblems(false)
            }
        }, 3500)

        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                fetchProblems(false)
            }
        }

        window.addEventListener('focus', handleFocus)
        document.addEventListener('visibilitychange', handleFocus)

        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', handleFocus)
            document.removeEventListener('visibilitychange', handleFocus)
        }
    }, [])

    const fetchProblems = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true)
            const res = await fetch('/api/problems')
            const data = await res.json()
            if (data.success) {
                setProblems(data.problem_statements || [])
            } else {
                throw new Error(data.error || 'Failed to load problem statements')
            }
        } catch (err: any) {
            console.error(err)
            if (showLoading) setError(err.message || 'Failed to load problem statements')
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    const domains = ['All', ...Array.from(new Set(problems.map(p => p.domain).filter(Boolean)))]

    const filteredProblems = problems.filter(p => {
        const matchesDomain = selectedDomain === 'All' || p.domain === selectedDomain
        const matchesSearch = 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.statement_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.domain && p.domain.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesDomain && matchesSearch
    })

    return (
        <div className="space-y-8 pb-16">
            
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                        <Lightbulb size={14} className="text-amber-500" /> Judge Reference Portal
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Problem Statements Directory</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Comprehensive catalogue of all competition problem statements and team selections for evaluation reference.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Statements</span>
                        <span className="text-xl font-black text-slate-800">{problems.length}</span>
                    </div>
                </div>
            </div>

            {/* Search & Domain Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by code, title, domain, or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                    />
                </div>

                {/* Domain Pills */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {domains.map(d => (
                        <button
                            key={d}
                            onClick={() => setSelectedDomain(d)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                selectedDomain === d
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {d}
                            {d !== 'All' && (
                                <span className="ml-1.5 opacity-75 font-mono text-[10px]">
                                    ({problems.filter(p => p.domain === d).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-200">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="font-bold text-xs">Loading Problem Statements...</p>
                </div>
            ) : filteredProblems.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-sm">
                    <Lightbulb size={40} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-base font-bold text-gray-800">No Problem Statements Found</h3>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or domain filter.</p>
                </div>
            ) : (
                /* Grid of Problem Statements */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredProblems.map(p => (
                        <div
                            key={p.id}
                            className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all hover:shadow-md flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                
                                {/* Top Badges */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                                            {p.statement_code}
                                        </span>
                                        {p.domain && (
                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                                {p.domain}
                                            </span>
                                        )}
                                    </div>

                                    <CopyButton
                                        text={`${p.statement_code}: ${p.title}\n\n${p.description}`}
                                        label="Copy"
                                        variant="pill"
                                    />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-black text-gray-900 leading-snug">
                                    {p.title}
                                </h3>

                                {/* Description */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-gray-700 text-xs leading-relaxed whitespace-pre-wrap break-words font-medium max-h-56 overflow-y-auto">
                                    {p.description}
                                </div>
                            </div>

                            {/* Footer: Selected Teams */}
                            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600">
                                        Selected by:
                                    </span>
                                    {p.selected_teams && p.selected_teams.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {p.selected_teams.map((tName, i) => (
                                                <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                    {tName}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No teams yet</span>
                                    )}
                                </div>

                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider font-mono">
                                    {p.selected_count || 0}/{p.max_teams || 2} Slots
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
