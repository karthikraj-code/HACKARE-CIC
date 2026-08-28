'use client'

import { useState, useEffect } from 'react'
import { getSession } from 'next-auth/react'
import { 
    Search, 
    Filter, 
    Lightbulb, 
    CheckCircle2, 
    AlertCircle, 
    Lock, 
    Users, 
    ArrowRight, 
    Check, 
    X,
    Sparkles
} from 'lucide-react'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'

export default function ProblemStatementSelectionPage() {
    const [loading, setLoading] = useState(true)
    const [isReleased, setIsReleased] = useState(true)
    const [problems, setProblems] = useState<any[]>([])
    const [userTeam, setUserTeam] = useState<any>(null)
    const [userSelection, setUserSelection] = useState<any>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    
    // Filtering and Search
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('All')
    
    // Modal state for confirmation
    const [confirmProblem, setConfirmProblem] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const session = await getSession()
            setCurrentUser(session?.user)

            const res = await fetch('/api/problems')
            const data = await res.json()
            if (data.success) {
                setIsReleased(data.is_released !== false)
                setProblems(data.problem_statements || [])
                setUserTeam(data.user_team)
                setUserSelection(data.user_team_selection)
            }
        } catch (err: any) {
            console.error('Failed to load problem statements', err)
            setError('Failed to load problem statements.')
        } finally {
            setLoading(false)
        }
    }


    const handleLockProblem = async () => {
        if (!confirmProblem || !userTeam) return
        setSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/problems/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem_id: confirmProblem.id,
                    team_id: userTeam.id
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to lock problem statement')
            }

            setSuccess('Problem statement successfully locked for your team!')
            setConfirmProblem(null)
            await fetchData()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    // Extract unique domains
    const domains = ['All', ...Array.from(new Set(problems.map(p => p.domain).filter(Boolean)))]

    // Filter problems
    const filteredProblems = problems.filter(p => {
        const matchesDomain = selectedDomain === 'All' || p.domain === selectedDomain
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch = !query || 
            p.statement_code.toLowerCase().includes(query) ||
            p.title.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.domain.toLowerCase().includes(query)
        return matchesDomain && matchesSearch
    })

    const isLeader = userTeam && currentUser && userTeam.leader_id === currentUser.id
    const hasLocked = !!userSelection

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-medium text-gray-600">Loading Problem Statements...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-16">
            
            {/* Header Banner */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-indigo-600" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Sparkles size={14} /> Step 1 Selection
                            </span>
                            <span className="text-xs font-bold text-gray-400">• {problems.length} Problem Statements Available</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Problem Statement Selection</h1>
                        <p className="text-gray-600 text-sm mt-1 max-w-2xl">
                            Each problem statement can be chosen by a maximum of <strong className="text-gray-900">2 teams</strong> on a first-come, first-served basis. Only the Team Leader can lock the choice.
                        </p>
                    </div>

                    {userTeam && (
                        <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-200 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Your Team</p>
                                <p className="text-base font-black text-gray-900">{userTeam.team_name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error / Success Notifications */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 text-sm font-medium">
                    <AlertCircle className="shrink-0 text-red-600" size={20} />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-3 text-sm font-medium">
                    <CheckCircle2 className="shrink-0 text-emerald-600" size={20} />
                    <span>{success}</span>
                </div>
            )}

            {/* Warning if not in a team */}
            {!userTeam && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={24} />
                    <div className="flex-1">
                        <h3 className="font-bold text-amber-900 text-base mb-1">You are not in a team yet</h3>
                        <p className="text-sm text-amber-800 mb-3">
                            You must create or join a team (max 4 members) before you can select and lock a problem statement.
                        </p>
                        <Link
                            href="/dashboard/participant/team"
                            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm"
                        >
                            <Users size={16} /> Go to Team Formation
                        </Link>
                    </div>
                </div>
            )}

            {/* Locked Problem Statement Showcase */}
            {hasLocked && userSelection?.problem_statements && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                                <CheckCircle2 size={28} />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                    Your Team's Locked Problem Statement
                                </span>
                                <h3 className="text-2xl font-black text-emerald-950 mt-1">
                                    {userSelection.problem_statements.statement_code}: {userSelection.problem_statements.title}
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CopyButton
                                text={`${userSelection.problem_statements.statement_code}: ${userSelection.problem_statements.title}\n\n${userSelection.problem_statements.description}`}
                                label="Copy Statement"
                                variant="outline"
                            />
                            <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-sm text-center">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Domain</span>
                                <span className="font-bold text-emerald-800 text-sm">{userSelection.problem_statements.domain}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/90 p-5 rounded-xl border border-emerald-200/80 mb-6 shadow-xs">
                        <p className="text-emerald-950 text-sm whitespace-pre-line leading-relaxed font-medium">
                            {userSelection.problem_statements.description}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-800">
                            Locked on {new Date(userSelection.selected_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. Proceed to Round 1 to prepare your PPT!
                        </p>
                        <Link
                            href="/dashboard/participant/rounds"
                            className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-2"
                        >
                            Go to Round 1 Submission <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Non-leader Notice if team hasn't locked */}
            {userTeam && !isLeader && !hasLocked && isReleased && (
                <div className="bg-sky-50 text-sky-800 p-4 rounded-xl border border-sky-200 flex items-center gap-3 text-sm font-medium">
                    <AlertCircle className="shrink-0 text-sky-600" size={20} />
                    <span>
                        Only your Team Leader can select and lock a problem statement for your team. You can browse and discuss options below.
                    </span>
                </div>
            )}

            {/* If NOT released by organizer and user has not locked a statement */}
            {!isReleased && !hasLocked ? (
                <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm max-w-3xl mx-auto space-y-6">
                    <div className="w-20 h-20 bg-amber-50 border border-amber-200 text-amber-600 rounded-3xl mx-auto flex items-center justify-center shadow-sm">
                        <Lock size={36} />
                    </div>
                    <div className="space-y-2">
                        <span className="bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block border border-amber-200">
                            Statements Locked
                        </span>
                        <h2 className="text-3xl font-black text-gray-900">Problem Statements Awaiting Release</h2>
                        <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                            The organizers have not released the problem statements yet. Once released, all problem statements will be revealed here for your team to browse and lock.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-xs text-gray-600 font-medium flex items-center justify-center gap-2">
                        <Sparkles size={16} className="text-amber-500 shrink-0" />
                        <span>Ensure your team (up to 4 members) is formed while you wait!</span>
                    </div>
                    {userTeam ? (
                        <div className="inline-block bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl text-xs font-bold border border-blue-200">
                            Ready with Team: <strong className="text-blue-950">{userTeam.team_name}</strong>
                        </div>
                    ) : (
                        <Link
                            href="/dashboard/participant/team"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm"
                        >
                            <Users size={18} /> Form or Join Team &rarr;
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    {/* Search and Domain Filters */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by keyword, domain, or code (e.g. PS-01, Healthcare, Vision)..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm shadow-sm transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>


                {/* Domain Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {domains.map(domain => {
                        const count = domain === 'All' 
                            ? problems.length 
                            : problems.filter(p => p.domain === domain).length

                        return (
                            <button
                                key={domain}
                                onClick={() => setSelectedDomain(domain)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                    selectedDomain === domain
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                <span>{domain}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    selectedDomain === domain ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Problem Statements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProblems.map((problem) => {
                    const isSelectedByThisTeam = userSelection?.problem_id === problem.id
                    const isFull = problem.is_full
                    const slotsTaken = problem.current_teams || 0
                    const maxSlots = problem.max_teams || 2
                    const slotsLeft = Math.max(0, maxSlots - slotsTaken)

                    return (
                        <div
                            key={problem.id || problem.statement_code}
                            className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                                isSelectedByThisTeam
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                                    : isFull
                                    ? 'border-gray-200 opacity-75 bg-gray-50/50'
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="p-6">
                                {/* Top Badges */}
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                                            {problem.statement_code}
                                        </span>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                            {problem.domain}
                                        </span>
                                    </div>

                                    {/* Capacity Status */}
                                    {isFull ? (
                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 shrink-0 flex items-center gap-1">
                                            <Lock size={12} /> FULL ({maxSlots}/{maxSlots})
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                            {slotsLeft} {slotsLeft === 1 ? 'Slot' : 'Slots'} Left
                                        </span>
                                    )}
                                </div>

                                {/* Title & Description */}
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <h3 className="text-lg font-black text-gray-900 leading-snug">
                                        {problem.title}
                                    </h3>
                                    <CopyButton
                                        text={`${problem.statement_code}: ${problem.title}\n\n${problem.description}`}
                                        label="Copy"
                                        variant="pill"
                                        className="shrink-0"
                                        title="Copy problem statement and description"
                                    />
                                </div>
                                <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-100 mb-6">
                                    <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                                        {problem.description}
                                    </p>
                                </div>

                                {/* Capacity Bar */}
                                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                    <div className="flex justify-between text-xs font-semibold text-gray-500">
                                        <span>Capacity Meter</span>
                                        <span className="font-mono">{slotsTaken} / {maxSlots} Teams</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                isFull
                                                    ? 'bg-red-500'
                                                    : slotsLeft === 1
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${(slotsTaken / maxSlots) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer / Action */}
                            <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                {isSelectedByThisTeam ? (
                                    <div className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                                        <CheckCircle2 size={16} /> Locked for Your Team
                                    </div>
                                ) : hasLocked ? (
                                    <div className="text-xs text-gray-400 italic">
                                        Your team already locked a problem statement.
                                    </div>
                                ) : !userTeam ? (
                                    <Link
                                        href="/dashboard/participant/team"
                                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        Join team to select &rarr;
                                    </Link>
                                ) : !isLeader ? (
                                    <span className="text-xs text-gray-500 italic">
                                        Leader-only action
                                    </span>
                                ) : isFull ? (
                                    <button
                                        disabled
                                        className="w-full py-2.5 bg-gray-200 text-gray-400 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Lock size={16} /> Capacity Full ({maxSlots}/{maxSlots} Teams)
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setConfirmProblem(problem)}
                                        className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                                    >
                                        Select & Lock Statement &rarr;
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

                    {/* Zero Results State */}
                    {filteredProblems.length === 0 && (
                        <div className="p-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <Search className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No matching problem statements found</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                                Try searching with different keywords or reset the domain filter.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedDomain('All') }}
                                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Confirmation Modal */}

            {confirmProblem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                    <Lightbulb size={24} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-lg">Confirm Problem Locking</h3>
                                    <p className="text-xs text-gray-500 font-semibold">{confirmProblem.statement_code} • {confirmProblem.domain}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfirmProblem(null)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 max-h-80 overflow-y-auto">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-extrabold text-gray-900 text-base">{confirmProblem.title}</h4>
                                <CopyButton
                                    text={`${confirmProblem.statement_code}: ${confirmProblem.title}\n\n${confirmProblem.description}`}
                                    label="Copy"
                                    variant="pill"
                                    className="shrink-0"
                                />
                            </div>
                            <p className="text-gray-700 text-xs whitespace-pre-line leading-relaxed">{confirmProblem.description}</p>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-amber-800">
                                <AlertCircle size={16} /> Important Notice:
                            </p>
                            <p>
                                Once locked, your team ({userTeam?.team_name}) will be officially registered to this problem statement and it cannot be changed.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmProblem(null)}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLockProblem}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Locking...' : 'Yes, Lock Statement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
