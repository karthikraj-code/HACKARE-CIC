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
    Plus,
    Edit3,
    Trash2,
    X,
    ChevronDown,
    ChevronUp,
    Hash,
    Layers,
    Sliders,
    Save
} from 'lucide-react'
import CopyButton from '@/components/CopyButton'

const DOMAIN_PRESETS = [
    'Feed Systems & Multi-Tier Caching',
    'Geospatial Indexing & Real-Time Dispatch',
    'Video Streaming & CDN Distribution',
    'Live Broadcasting & Traffic Surge Resilience',
    'Recommendation Engines & Infinite Feeds',
    'High-Concurrency Ticketing & Lock Serialization',
    'Distributed Locking & State Consistency',
    'High-Load Systems & Read Caching',
    'Static Content Delivery & Edge Caching',
    'On-Demand Delivery & Fleet Optimization',
    'Flash Sales & Atomic Inventory Control',
    'Fintech & Idempotent Transaction Processing',
    'Cloud Synchronization & Conflict Resolution',
    'Real-Time Presence & Heartbeat Management',
    'Ephemeral Storage & TTL Lifecycle Expiry',
    'Audio Streaming & Progressive Buffering',
    'Graph Routing & Dynamic Pathfinding',
    'Search Engines & Inverted Indexing',
    'Feed Ranking & Personalized Algorithms',
    'High-Throughput Ingestion & Queue Processing',
    'Resumable Uploads & Fault Tolerance',
    'Artificial Intelligence & ML',
    'Web3 & Blockchain',
    'HealthTech & MedTech',
    'EdTech & Learning Systems',
    'Cybersecurity & Identity',
    'Open Innovation & System Design'
]

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

    // Modal state for Add / Edit Problem Statement
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProblem, setEditingProblem] = useState<any>(null)
    const [savingProblem, setSavingProblem] = useState(false)
    const [modalError, setModalError] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        statement_code: '',
        domain: '',
        title: '',
        description: '',
        max_teams: 2
    })

    // Expanded descriptions tracking
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchProblems(true)

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && !isModalOpen && !savingProblem && !togglingRelease) {
                fetchProblems(false)
            }
        }, 3500)

        const handleFocus = () => {
            if (document.visibilityState === 'visible' && !isModalOpen && !savingProblem && !togglingRelease) {
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
    }, [isModalOpen, savingProblem, togglingRelease])

    const fetchProblems = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true)
            const res = await fetch('/api/problems')
            const data = await res.json()
            if (data.success) {
                setProblems(data.problem_statements || [])
                setIsReleased(data.is_released ?? false)
            }
        } catch (err) {
            console.error(err)
            if (showLoading) setError('Failed to load problem statements')
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingProblem(null)
        setModalError('')
        
        // Suggest next code
        const nextNum = problems.length + 1
        const suggestedCode = `PS-${String(nextNum).padStart(2, '0')}`

        setFormData({
            statement_code: suggestedCode,
            domain: DOMAIN_PRESETS[0],
            title: '',
            description: '',
            max_teams: 2
        })
        setIsModalOpen(true)
    }

    const openEditModal = (problem: any) => {
        setEditingProblem(problem)
        setModalError('')
        setFormData({
            statement_code: problem.statement_code || '',
            domain: problem.domain || '',
            title: problem.title || '',
            description: problem.description || '',
            max_teams: problem.max_teams || 2
        })
        setIsModalOpen(true)
    }

    const handleSaveProblem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title.trim()) {
            setModalError('Please enter a problem statement title')
            return
        }
        if (!formData.domain.trim()) {
            setModalError('Please enter or select a domain / track')
            return
        }
        if (!formData.description.trim()) {
            setModalError('Please enter a detailed description')
            return
        }

        setSavingProblem(true)
        setModalError('')

        try {
            const url = editingProblem 
                ? `/api/organizer/problems/${editingProblem.id}`
                : '/api/organizer/problems'
            
            const method = editingProblem ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    statement_code: formData.statement_code.trim().toUpperCase(),
                    domain: formData.domain.trim(),
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    max_teams: Math.max(1, parseInt(String(formData.max_teams), 10) || 2)
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to save problem statement')
            }

            setMessage(data.message || (editingProblem ? 'Problem statement updated!' : 'Problem statement created!'))
            setIsModalOpen(false)
            await fetchProblems()
        } catch (err: any) {
            setModalError(err.message)
        } finally {
            setSavingProblem(false)
        }
    }

    const handleDeleteProblem = async (problem: any) => {
        const teamCount = problem.current_teams || 0
        const warning = teamCount > 0 
            ? `Warning: ${teamCount} team(s) have selected this problem statement. Deleting it will release their selections. Continue?`
            : `Are you sure you want to delete '${problem.statement_code}: ${problem.title}'?`

        if (!confirm(warning)) return

        try {
            const res = await fetch(`/api/organizer/problems/${problem.id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete problem statement')

            setMessage(`Problem statement '${problem.statement_code}' deleted successfully.`)
            await fetchProblems()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleToggleRelease = async (targetState: boolean) => {
        const confirmText = targetState
            ? 'Are you sure you want to RELEASE all Problem Statements to participants now? Participants will immediately be able to view and lock statements.'
            : 'Are you sure you want to HIDE / LOCK Problem Statements from participants?'

        if (!confirm(confirmText)) return

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
        if (!confirm('This will seed/refresh all default problem statements and competition rounds. Continue?')) {
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

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const domains = ['All', ...Array.from(new Set(problems.map(p => p.domain).filter(Boolean)))]

    const filteredProblems = problems.filter(p => {
        const matchesDomain = selectedDomain === 'All' || p.domain === selectedDomain
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch = !query || 
            p.statement_code?.toLowerCase().includes(query) ||
            p.title?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.domain?.toLowerCase().includes(query)
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
                        Add, edit, manage team capacity limits, and release problem statements to participants.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                        <Plus size={18} />
                        Add Problem Statement
                    </button>
                    <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 disabled:bg-gray-400 cursor-pointer"
                    >
                        <RefreshCw size={16} className={seeding ? 'animate-spin' : ''} />
                        {seeding ? 'Syncing...' : 'Sync Defaults'}
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
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 text-sm font-semibold">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span>{message}</span>
                    </div>
                    <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900">
                        <X size={16} />
                    </button>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-between gap-2 text-sm font-semibold">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
                        <X size={16} />
                    </button>
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
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Statements</p>
                        <p className="text-2xl font-black text-gray-900">{fullStatementsCount} Statements</p>
                    </div>
                </div>
            </div>

            {/* Search and Domain Filters */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by code, title, domain, or description keywords..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm shadow-sm"
                        />
                    </div>
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

            {/* Problem Statements Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProblems.map((problem) => {
                    const currentTeams = problem.current_teams || 0
                    const maxTeams = problem.max_teams || 2
                    const isFull = currentTeams >= maxTeams
                    const slotsLeft = Math.max(0, maxTeams - currentTeams)
                    const assigned = problem.assigned_teams || []
                    const isExpanded = !!expandedIds[problem.id || problem.statement_code]
                    const desc = problem.description || ''
                    const isLongDesc = desc.length > 220

                    return (
                        <div
                            key={problem.id || problem.statement_code}
                            className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                                isFull ? 'border-amber-200 bg-amber-50/10' : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="p-6 space-y-4">
                                {/* Top Header Badges & Actions */}
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                            {problem.statement_code}
                                        </span>
                                        <span className="text-xs font-bold text-gray-700 bg-slate-100 px-3 py-1 rounded-lg truncate max-w-xs">
                                            {problem.domain}
                                        </span>
                                    </div>

                                    {/* Action Buttons: Copy, Edit, Delete */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <CopyButton
                                            text={`${problem.statement_code}: ${problem.title}\nDomain: ${problem.domain}\nCapacity: ${currentTeams}/${maxTeams} Teams\n\n${problem.description}`}
                                            label="Copy"
                                            variant="pill"
                                            className="shrink-0"
                                            title="Copy full problem statement details"
                                        />
                                        <button
                                            onClick={() => openEditModal(problem)}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                            title="Edit Problem Statement"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProblem(problem)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Problem Statement"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg leading-snug">
                                        {problem.title}
                                    </h3>
                                </div>

                                {/* Responsive Description with Read More */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                    <p className={`text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap break-words ${
                                        !isExpanded && isLongDesc ? 'line-clamp-4' : ''
                                    }`}>
                                        {desc}
                                    </p>
                                    {isLongDesc && (
                                        <button
                                            onClick={() => toggleExpand(problem.id || problem.statement_code)}
                                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                        >
                                            {isExpanded ? (
                                                <>Show Less <ChevronUp size={14} /></>
                                            ) : (
                                                <>Read Full Description <ChevronDown size={14} /></>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Assigned Teams Tags */}
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                        Assigned Teams ({assigned.length}/{maxTeams}):
                                    </p>
                                    {assigned.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {assigned.map((tName: string, idx: number) => (
                                                <span key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1">
                                                    <Users size={12} /> {tName}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No teams have locked this statement yet.</span>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer: Capacity Meter */}
                            <div className="bg-gray-50/90 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${
                                        isFull ? 'bg-red-500' : currentTeams > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} />
                                    <span className="text-xs font-bold text-gray-700">
                                        Capacity Limit: <strong className="text-gray-900 font-mono">{maxTeams} Teams Max</strong>
                                    </span>
                                </div>

                                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                                    isFull 
                                        ? 'bg-red-100 text-red-700' 
                                        : currentTeams > 0
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    {isFull ? 'Capacity Full' : `${slotsLeft} Slot${slotsLeft !== 1 ? 's' : ''} Left`}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Zero Results */}
            {filteredProblems.length === 0 && !loading && (
                <div className="p-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <Search className="mx-auto text-gray-300" size={48} />
                    <h3 className="text-lg font-bold text-gray-900">No matching problem statements found</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Try different search keywords, reset the domain filter, or click "+ Add Problem Statement" above.
                    </p>
                </div>
            )}

            {/* ADD / EDIT PROBLEM STATEMENT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 relative my-8 animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Lightbulb size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">
                                        {editingProblem ? 'Edit Problem Statement' : 'Add New Problem Statement'}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {editingProblem ? `Update details for ${editingProblem.statement_code}` : 'Define track, description, and team selection capacity'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        {/* Modal Form */}
                        <form onSubmit={handleSaveProblem} className="space-y-5">
                            {/* Row 1: Statement Code & Max Teams */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                        Problem Code <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={formData.statement_code}
                                            onChange={e => setFormData({ ...formData, statement_code: e.target.value.toUpperCase() })}
                                            placeholder="e.g. PS-01, AI-04, WEB-02"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold text-sm tracking-wide uppercase"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">Unique identifier code</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                        Max Team Capacity <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Sliders className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={formData.max_teams}
                                            onChange={e => setFormData({ ...formData, max_teams: parseInt(e.target.value, 10) || 1 })}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-sm"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">How many teams can choose this PB</p>
                                </div>
                            </div>

                            {/* Row 2: Domain / Track */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                    Domain / Track <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={formData.domain}
                                        onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                        placeholder="e.g. AI & Machine Learning, Feed Systems, FinTech"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-semibold"
                                    />
                                    {/* Preset Quick-Select Pills */}
                                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                                        {DOMAIN_PRESETS.slice(0, 8).map(preset => (
                                            <button
                                                type="button"
                                                key={preset}
                                                onClick={() => setFormData({ ...formData, domain: preset })}
                                                className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap transition-colors border border-slate-200"
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Title */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                    Problem Statement Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Where Did the Old Reels Go? – Instagram Feed & Cache"
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-bold"
                                />
                            </div>

                            {/* Row 4: Description */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                                        Problem Statement Description <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-[11px] font-mono text-gray-400">
                                        {formData.description.length} chars
                                    </span>
                                </div>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Provide the complete background scenario, task requirements, technical challenges to reverse engineer, and expected deliverables for participants..."
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs leading-relaxed font-medium"
                                />
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100">
                                {editingProblem ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const prob = editingProblem
                                            setIsModalOpen(false)
                                            handleDeleteProblem(prob)
                                        }}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Trash2 size={14} /> Delete Problem Statement
                                    </button>
                                ) : (
                                    <div />
                                )}
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingProblem}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400 cursor-pointer"
                                    >
                                        {savingProblem ? (
                                            <RefreshCw size={14} className="animate-spin" />
                                        ) : (
                                            <Save size={14} />
                                        )}
                                        {savingProblem ? 'Saving Statement...' : editingProblem ? 'Save Changes' : 'Create Problem Statement'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
