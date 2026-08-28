'use client'

import { useState, useEffect } from 'react'
import { 
    Lightbulb, 
    Search, 
    RefreshCw, 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    Lock,
    Sparkles,
    Download
} from 'lucide-react'
import CopyButton from '@/components/CopyButton'

export default function OrganizerProblemStatementsPage() {
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [isReleased, setIsReleased] = useState(false)
    const [togglingRelease, setTogglingRelease] = useState(false)
    const [problems, setProblems] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('All')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetchProblems()
    }, [])

    const fetchProblems = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/problems')
            const data = await res.json()
            if (data.success) {
                setProblems(data.problem_statements || [])
                setIsReleased(data.is_released ?? false)
            }
        } catch (err) {
            console.error(err)
            setError('Failed to load problem statements')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleRelease = async (targetState: boolean) => {
        const confirmText = targetState
            ? 'Are you sure you want to RELEASE all Problem Statements to participants now? Participants will immediately be able to view and lock statements.'
            : 'Are you sure you want to HIDE / LOCK Problem Statements from participants?';

        if (!confirm(confirmText)) return;

        setTogglingRelease(true)
        setMessage('')
        setError('')

        try {
            const res = await fetch('/api/organizer/problems/release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_released: targetState })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update release status')

            setIsReleased(targetState)
            setMessage(data.message || (targetState ? 'Problem statements are now live to participants!' : 'Problem statements are now locked.'))
        } catch (err: any) {
            setError(err.message)
        } finally {
            setTogglingRelease(false)
        }
    }

    const handleSeed = async () => {
        if (!confirm('This will seed/refresh all problem statements and configure the competition rounds. Continue?')) {
            return
        }

        setSeeding(true)
        setMessage('')
        setError('')

        try {
            const res = await fetch('/api/seed-problems')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to seed')

            setMessage(data.message || 'Successfully seeded problem statements and rounds!')
            await fetchProblems()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSeeding(false)
        }
    }

    const domains = ['All', ...Array.from(new Set(problems.map(p => p.domain).filter(Boolean)))]

    const filteredProblems = problems.filter(p => {
        const matchesDomain = selectedDomain === 'All' || p.domain === selectedDomain
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch = !query || 
            p.statement_code.toLowerCase().includes(query) ||
            p.title.toLowerCase().includes(query) ||
            p.domain.toLowerCase().includes(query)
        return matchesDomain && matchesSearch
    })

    const totalSelections = problems.reduce((sum, p) => sum + (p.current_teams || 0), 0)
    const fullStatementsCount = problems.filter(p => p.is_full).length

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            
            {/* Header Banner */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-blue-600" />
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1 flex items-center gap-2">
                        <Lightbulb className="text-amber-500" /> Manage Problem Statements
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Release problem statements to participants and monitor capacity across all statements.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 disabled:bg-gray-400 cursor-pointer"
                    >
                        <RefreshCw size={16} className={seeding ? 'animate-spin' : ''} />
                        {seeding ? 'Seeding Database...' : 'Seed / Sync Problem Statements'}
                    </button>
                </div>
            </div>

            {/* RELEASE STATUS CARD */}
            <div className={`p-6 rounded-2xl border transition-all ${
                isReleased 
                    ? 'bg-emerald-50/80 border-emerald-300' 
                    : 'bg-amber-50/80 border-amber-300'
            }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                            isReleased ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}>
                            {isReleased ? <CheckCircle2 size={26} /> : <Lock size={26} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-gray-900 text-lg">
                                    {isReleased ? 'Problem Statements are LIVE to Participants' : 'Problem Statements are LOCKED / HIDDEN'}
                                </h3>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                    isReleased 
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                        : 'bg-amber-100 text-amber-900 border-amber-300'
                                }`}>
                                    {isReleased ? 'Published' : 'Hidden'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                                {isReleased 
                                    ? 'All problem statements are visible and open for team selection on the participant portal.'
                                    : 'Participants currently see a locked screen. They cannot view or lock problem statements until you release them.'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleToggleRelease(!isReleased)}
                        disabled={togglingRelease}
                        className={`px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 ${
                            isReleased
                                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                    >
                        {togglingRelease ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : isReleased ? (
                            <Lock size={14} />
                        ) : (
                            <Sparkles size={14} />
                        )}
                        {togglingRelease 
                            ? 'Updating Status...' 
                            : isReleased 
                            ? 'Lock / Hide Statements' 
                            : 'Release Problem Statements to Participants'}
                    </button>
                </div>
            </div>


            {/* Notification Messages */}
            {message && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2 text-sm font-semibold">
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Statements</p>
                        <p className="text-2xl font-black text-gray-900">{problems.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Teams Locked</p>
                        <p className="text-2xl font-black text-gray-900">{totalSelections} Teams</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Lock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Statements (2/2)</p>
                        <p className="text-2xl font-black text-gray-900">{fullStatementsCount} Statements</p>
                    </div>
                </div>
            </div>

            {/* Search and Domain Filters */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by code, title, domain..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm shadow-sm"
                    />
                </div>

                {/* Domain Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {domains.map(domain => (
                        <button
                            key={domain}
                            onClick={() => setSelectedDomain(domain)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                selectedDomain === domain
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {domain}
                        </button>
                    ))}
                </div>
            </div>

            {/* Statements Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                                <th className="px-6 py-4 font-semibold border-b border-gray-200 w-24">Code</th>
                                <th className="px-6 py-4 font-semibold border-b border-gray-200 w-44">Domain</th>
                                <th className="px-6 py-4 font-semibold border-b border-gray-200">Title & Full Description</th>
                                <th className="px-6 py-4 font-semibold border-b border-gray-200 text-center w-36">Capacity</th>
                                <th className="px-6 py-4 font-semibold border-b border-gray-200 w-64">Assigned Teams</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProblems.map((problem) => {
                                const currentTeams = problem.current_teams || 0
                                const maxTeams = problem.max_teams || 2
                                const assigned = problem.assigned_teams || []

                                return (
                                    <tr key={problem.id || problem.statement_code} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-5 font-mono font-black text-blue-700 whitespace-nowrap align-top">
                                            {problem.statement_code}
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 whitespace-nowrap inline-block">
                                                {problem.domain}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex justify-between items-start gap-3 mb-2">
                                                <p className="font-extrabold text-gray-900 text-base">{problem.title}</p>
                                                <CopyButton
                                                    text={`${problem.statement_code}: ${problem.title}\n\n${problem.description}`}
                                                    label="Copy"
                                                    variant="pill"
                                                    className="shrink-0"
                                                    title="Copy problem statement code, title, and description"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                                                {problem.description}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 text-center align-top">
                                            <div className="inline-flex flex-col items-center gap-1">
                                                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                                                    currentTeams >= maxTeams
                                                        ? 'bg-red-100 text-red-700'
                                                        : currentTeams > 0
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {currentTeams} / {maxTeams} Teams
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            {assigned.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {assigned.map((tName: string, idx: number) => (
                                                        <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-200">
                                                            {tName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No teams yet</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredProblems.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                                        No problem statements found. Click "Seed / Sync Problem Statements" above to populate.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
