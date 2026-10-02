'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
    CheckSquare, 
    Users, 
    Search, 
    Filter, 
    Check, 
    X, 
    Plus, 
    Trash2, 
    Calendar, 
    Clock, 
    Sun, 
    Moon, 
    Sunset, 
    Sunrise, 
    Download, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    Crown, 
    Building2, 
    UserCheck, 
    UserX, 
    HelpCircle, 
    Sparkles,
    FileText,
    HeartHandshake
} from 'lucide-react'

interface Participant {
    id: string
    name: string
    email: string
    reg_no?: string | null
    dept?: string | null
    section?: string | null
    year?: string | null
    role: string
    is_assigned: boolean
    team_id?: string | null
    team?: {
        id: string
        team_name: string
        team_code: string
        leader_id?: string
    } | null
    is_leader: boolean
}

interface AttendanceSession {
    id: string
    name: string
    slot: 'morning' | 'afternoon' | 'evening' | 'night' | 'custom'
    date: string
    is_active?: boolean
    created_at?: string
}

interface AttendanceRecord {
    id: string
    session_id: string
    user_id: string
    status: 'present' | 'absent'
    marked_by?: string
    marked_at?: string
    notes?: string
}

const SLOT_CONFIG = {
    morning: { label: 'Morning Slot', icon: Sunrise, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    afternoon: { label: 'Afternoon Slot', icon: Sun, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    evening: { label: 'Evening Slot', icon: Sunset, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    night: { label: 'Night Slot', icon: Moon, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    custom: { label: 'Special Session', icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200' }
}

export default function VolunteerAttendancePage() {
    const [sessions, setSessions] = useState<AttendanceSession[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string>('')
    const [participants, setParticipants] = useState<Participant[]>([])
    const [records, setRecords] = useState<Record<string, AttendanceRecord>>({}) // keyed by user_id
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [savingUserId, setSavingUserId] = useState<string | null>(null)

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all')
    const [selectedTeamFilter, setSelectedTeamFilter] = useState('all')
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('all')

    // Modals
    const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false)
    const [newSessionData, setNewSessionData] = useState({
        name: '',
        slot: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night' | 'custom',
        date: new Date().toISOString().slice(0, 10)
    })
    const [isCreatingSession, setIsCreatingSession] = useState(false)

    // Alert toast
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        initialLoad()
    }, [])

    useEffect(() => {
        if (activeSessionId) {
            fetchRecordsForSession(activeSessionId)
        }
    }, [activeSessionId])

    const initialLoad = async () => {
        setLoading(true)
        try {
            const [sessionsRes, studentsRes] = await Promise.all([
                fetch('/api/attendance/sessions'),
                fetch('/api/organizer/students')
            ])

            const sessionsData = await sessionsRes.json()
            const studentsData = await studentsRes.json()

            const loadedSessions: AttendanceSession[] = sessionsData.sessions || []
            setSessions(loadedSessions)

            if (loadedSessions.length > 0) {
                setActiveSessionId(loadedSessions[0].id)
            }

            if (studentsData.students) {
                setParticipants(studentsData.students)
            }
        } catch (e: any) {
            console.error('Error in initial load:', e)
            showToast('error', 'Failed to load attendance session data.')
        } finally {
            setLoading(false)
        }
    }

    const fetchRecordsForSession = async (sessionId: string) => {
        setRefreshing(true)
        try {
            const res = await fetch(`/api/attendance/records?session_id=${encodeURIComponent(sessionId)}`)
            const data = await res.json()
            if (res.ok && data.records) {
                const recordMap: Record<string, AttendanceRecord> = {}
                for (const r of data.records) {
                    recordMap[r.user_id] = r
                }
                setRecords(recordMap)
            }
        } catch (e) {
            console.error('Error loading session records:', e)
        } finally {
            setRefreshing(false)
        }
    }

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text })
        setTimeout(() => setToast(null), 4000)
    }

    // ==========================================
    // ATTENDANCE MARKING (PRESENT / ABSENT)
    // ==========================================
    const handleToggleAttendance = async (participantId: string, desiredStatus: 'present' | 'absent') => {
        if (!activeSessionId) {
            showToast('error', 'Please select or create an attendance session first.')
            return
        }

        const currentRec = records[participantId]
        if (currentRec && currentRec.status === desiredStatus) {
            // Already set to this status
            return
        }

        // Optimistic UI update
        const optimisticRecord: AttendanceRecord = {
            id: currentRec?.id || 'temp-' + participantId,
            session_id: activeSessionId,
            user_id: participantId,
            status: desiredStatus,
            marked_at: new Date().toISOString()
        }

        setRecords(prev => ({ ...prev, [participantId]: optimisticRecord }))
        setSavingUserId(participantId)

        try {
            const res = await fetch('/api/attendance/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: activeSessionId,
                    user_id: participantId,
                    status: desiredStatus
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save attendance')

            if (data.record) {
                setRecords(prev => ({ ...prev, [participantId]: data.record }))
            }
        } catch (e: any) {
            // Revert on error
            if (currentRec) {
                setRecords(prev => ({ ...prev, [participantId]: currentRec }))
            } else {
                setRecords(prev => {
                    const copy = { ...prev }
                    delete copy[participantId]
                    return copy
                })
            }
            showToast('error', e.message || 'Error saving attendance')
        } finally {
            setSavingUserId(null)
        }
    }

    // ==========================================
    // BULK ATTENDANCE ACTIONS
    // ==========================================
    const handleBulkMark = async (status: 'present' | 'absent') => {
        if (!activeSessionId) return
        if (filteredParticipants.length === 0) {
            showToast('error', 'No participants match the current filter.')
            return
        }

        const userIds = filteredParticipants.map(p => p.id)
        const confirmMsg = `Are you sure you want to mark all ${userIds.length} filtered participant(s) as ${status.toUpperCase()}?`
        if (!confirm(confirmMsg)) return

        setRefreshing(true)
        try {
            const res = await fetch('/api/attendance/records', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: activeSessionId,
                    user_ids: userIds,
                    status: status
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Bulk update failed')

            showToast('success', `Marked ${userIds.length} participant(s) as ${status.toUpperCase()}!`)
            await fetchRecordsForSession(activeSessionId)
        } catch (e: any) {
            showToast('error', e.message || 'Failed bulk update')
        } finally {
            setRefreshing(false)
        }
    }

    // ==========================================
    // CREATE NEW ATTENDANCE SESSION
    // ==========================================
    const handleOpenCreateSession = () => {
        const today = new Date().toISOString().slice(0, 10)
        setNewSessionData({
            name: `Session ${sessions.length + 1} - Morning Check-in`,
            slot: 'morning',
            date: today
        })
        setIsCreateSessionModalOpen(true)
    }

    const handleCreateSessionSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSessionData.name.trim()) {
            showToast('error', 'Session title is required')
            return
        }

        setIsCreatingSession(true)
        try {
            const res = await fetch('/api/attendance/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSessionData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create session')

            const created = data.session
            setSessions(prev => [created, ...prev])
            setActiveSessionId(created.id)
            showToast('success', `Created session "${created.name}"!`)
            setIsCreateSessionModalOpen(false)
        } catch (e: any) {
            showToast('error', e.message || 'Failed to create session')
        } finally {
            setIsCreatingSession(false)
        }
    }

    const handleDeleteSession = async (sessionId: string, sessionName: string) => {
        if (!confirm(`Are you sure you want to delete session "${sessionName}" and all its attendance records?`)) return

        try {
            const res = await fetch(`/api/attendance/sessions?id=${encodeURIComponent(sessionId)}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete session')

            const remaining = sessions.filter(s => s.id !== sessionId)
            setSessions(remaining)
            if (activeSessionId === sessionId) {
                setActiveSessionId(remaining[0]?.id || '')
            }
            showToast('success', `Session "${sessionName}" deleted.`)
        } catch (e: any) {
            showToast('error', e.message || 'Failed to delete session')
        }
    }

    // ==========================================
    // EXPORT CSV
    // ==========================================
    const handleExportCSV = () => {
        const currentSession = sessions.find(s => s.id === activeSessionId)
        if (!currentSession) return

        const headers = ['Full Name', 'Email', 'Registration No', 'Department', 'Year', 'Section', 'Team Name', 'Team Code', 'Is Leader', 'Attendance Status', 'Marked Time']
        
        const rows = participants.map(p => {
            const rec = records[p.id]
            const statusStr = rec ? (rec.status === 'present' ? 'PRESENT' : 'ABSENT') : 'UNMARKED'
            const markedTime = rec?.marked_at ? new Date(rec.marked_at).toLocaleTimeString() : ''

            return [
                `"${(p.name || '').replace(/"/g, '""')}"`,
                `"${(p.email || '').replace(/"/g, '""')}"`,
                `"${(p.reg_no || '').replace(/"/g, '""')}"`,
                `"${(p.dept || '').replace(/"/g, '""')}"`,
                `"${(p.year || '').replace(/"/g, '""')}"`,
                `"${(p.section || '').replace(/"/g, '""')}"`,
                `"${(p.team?.team_name || '').replace(/"/g, '""')}"`,
                `"${(p.team?.team_code || '').replace(/"/g, '""')}"`,
                p.is_leader ? 'Yes' : 'No',
                statusStr,
                markedTime
            ]
        })

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `attendance_${currentSession.name.replace(/[^a-zA-Z0-9]/g, '_')}_${currentSession.date}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast('success', 'Attendance report exported to CSV!')
    }

    // ==========================================
    // DERIVED STATS & FILTERING
    // ==========================================
    const currentSession = useMemo(() => {
        return sessions.find(s => s.id === activeSessionId) || sessions[0]
    }, [sessions, activeSessionId])

    const totalStudents = participants.length
    const presentCount = useMemo(() => {
        return Object.values(records).filter(r => r.status === 'present').length
    }, [records])

    const absentCount = useMemo(() => {
        return Object.values(records).filter(r => r.status === 'absent').length
    }, [records])

    const unmarkedCount = totalStudents - presentCount - absentCount
    const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

    // Unique teams & departments for filter dropdowns
    const uniqueTeams = useMemo(() => {
        const map = new Map<string, string>()
        participants.forEach(p => {
            if (p.team?.id) {
                map.set(p.team.id, `${p.team.team_name} (${p.team.team_code})`)
            }
        })
        return Array.from(map.entries())
    }, [participants])

    const uniqueDepts = useMemo(() => {
        return Array.from(new Set(participants.map(p => p.dept).filter(Boolean))) as string[]
    }, [participants])

    // Filtered participants list
    const filteredParticipants = useMemo(() => {
        return participants.filter(p => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchName = (p.name || '').toLowerCase().includes(q)
                const matchEmail = (p.email || '').toLowerCase().includes(q)
                const matchReg = (p.reg_no || '').toLowerCase().includes(q)
                const matchDept = (p.dept || '').toLowerCase().includes(q)
                const matchTeam = (p.team?.team_name || '').toLowerCase().includes(q)
                const matchTeamCode = (p.team?.team_code || '').toLowerCase().includes(q)
                if (!matchName && !matchEmail && !matchReg && !matchDept && !matchTeam && !matchTeamCode) {
                    return false
                }
            }

            // Status filter
            const rec = records[p.id]
            if (statusFilter === 'present' && rec?.status !== 'present') return false
            if (statusFilter === 'absent' && rec?.status !== 'absent') return false
            if (statusFilter === 'unmarked' && rec?.status) return false

            // Team filter
            if (selectedTeamFilter !== 'all') {
                if (selectedTeamFilter === 'unassigned') {
                    if (p.is_assigned) return false
                } else if (p.team_id !== selectedTeamFilter && p.team?.id !== selectedTeamFilter) {
                    return false
                }
            }

            // Department filter
            if (selectedDeptFilter !== 'all' && p.dept !== selectedDeptFilter) {
                return false
            }

            return true
        })
    }, [participants, records, searchQuery, statusFilter, selectedTeamFilter, selectedDeptFilter])

    const currentSlotMeta = currentSession ? (SLOT_CONFIG[currentSession.slot] || SLOT_CONFIG.custom) : SLOT_CONFIG.morning
    const SlotIcon = currentSlotMeta.icon

    return (
        <div className="space-y-6 pb-16">
            {/* Toast Banner */}
            {toast && (
                <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
                    toast.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-3">
                        {toast.type === 'success' ? (
                            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                        ) : (
                            <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium">{toast.text}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Attendance Sessions Bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Clock size={18} />
                            </span>
                            <h2 className="text-base font-bold text-gray-900">Attendance Session Selector</h2>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Select a session time slot (Morning, Afternoon, Evening, Night) or create a new session.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenCreateSession}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                        >
                            <Plus size={14} />
                            Create Session
                        </button>
                    </div>
                </div>

                {/* Session Pills Carousel/List */}
                {sessions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500">
                        No attendance sessions found. Click &quot;Create Session&quot; to start.
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        {sessions.map(s => {
                            const isSelected = s.id === activeSessionId
                            const meta = SLOT_CONFIG[s.slot] || SLOT_CONFIG.custom
                            const Icon = meta.icon

                            return (
                                <div
                                    key={s.id}
                                    onClick={() => setActiveSessionId(s.id)}
                                    className={`px-4 py-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 flex-shrink-0 ${
                                        isSelected
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100 ring-2 ring-emerald-200'
                                            : 'bg-slate-50 hover:bg-slate-100 text-gray-700 border-gray-200'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-emerald-600 border border-gray-200'
                                    }`}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <div className="font-bold flex items-center gap-1.5">
                                            <span>{s.name}</span>
                                        </div>
                                        <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                                            {s.date} • {meta.label}
                                        </div>
                                    </div>

                                    {isSelected && sessions.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteSession(s.id, s.name)
                                            }}
                                            className="ml-2 text-emerald-200 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                                            title="Delete this session"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Session KPI Summary Cards */}
            {currentSession && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Participants</span>
                            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                                <Users size={16} />
                            </span>
                        </div>
                        <div className="text-2xl font-black text-gray-900">{totalStudents}</div>
                        <p className="text-xs text-gray-400 mt-1">Active roster size</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Present</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <UserCheck size={16} />
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-700">{presentCount}</span>
                            <span className="text-xs font-bold text-emerald-600">({presentPercentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${presentPercentage}%` }} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Absent</span>
                            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                                <UserX size={16} />
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-rose-600">{absentCount}</span>
                            <span className="text-xs font-bold text-rose-500">
                                ({totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0}%)
                            </span>
                        </div>
                        <p className="text-xs text-rose-600 font-medium mt-1">Confirmed absent</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending / Unmarked</span>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <HelpCircle size={16} />
                            </span>
                        </div>
                        <div className="text-2xl font-black text-amber-600">{unmarkedCount}</div>
                        <p className="text-xs text-amber-600 font-medium mt-1">Awaiting roll call</p>
                    </div>
                </div>
            )}

            {/* Filter & Bulk Action Toolbar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, reg no, email, team name, code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-gray-200 overflow-x-auto">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                statusFilter === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            All ({totalStudents})
                        </button>
                        <button
                            onClick={() => setStatusFilter('present')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-emerald-700'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${statusFilter === 'present' ? 'bg-white' : 'bg-emerald-500'}`} />
                            Present ({presentCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('absent')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-rose-700'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${statusFilter === 'absent' ? 'bg-white' : 'bg-rose-500'}`} />
                            Absent ({absentCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('unmarked')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'unmarked'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-amber-700'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${statusFilter === 'unmarked' ? 'bg-white' : 'bg-amber-500'}`} />
                            Unmarked ({unmarkedCount})
                        </button>
                    </div>
                </div>

                {/* Secondary Filters & Quick Bulk Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                        {/* Team Dropdown */}
                        <select
                            value={selectedTeamFilter}
                            onChange={(e) => setSelectedTeamFilter(e.target.value)}
                            className="text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 font-medium focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Teams</option>
                            <option value="unassigned">Unassigned (Solo)</option>
                            {uniqueTeams.map(([id, label]) => (
                                <option key={id} value={id}>{label}</option>
                            ))}
                        </select>

                        {/* Department Dropdown */}
                        <select
                            value={selectedDeptFilter}
                            onChange={(e) => setSelectedDeptFilter(e.target.value)}
                            className="text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 font-medium focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Departments</option>
                            {uniqueDepts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Bulk Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => handleBulkMark('present')}
                            disabled={filteredParticipants.length === 0 || refreshing}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                            title="Mark all currently visible participants as Present"
                        >
                            <Check size={13} className="text-emerald-600" />
                            Mark Filtered Present ({filteredParticipants.length})
                        </button>
                        <button
                            onClick={() => handleBulkMark('absent')}
                            disabled={filteredParticipants.length === 0 || refreshing}
                            className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                            title="Mark all currently visible participants as Absent"
                        >
                            <X size={13} className="text-rose-600" />
                            Mark Filtered Absent ({filteredParticipants.length})
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                            title="Export session attendance as CSV"
                        >
                            <Download size={13} />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/70 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
                        <CheckSquare size={14} className="text-emerald-600" />
                        <span>Showing {filteredParticipants.length} of {totalStudents} Participants</span>
                    </div>

                    <button
                        onClick={() => activeSessionId && fetchRecordsForSession(activeSessionId)}
                        disabled={refreshing}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
                    >
                        <RefreshCw size={12} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
                        Sync Records
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <RefreshCw size={36} className="animate-spin text-emerald-600 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-700">Loading attendance data...</p>
                    </div>
                ) : filteredParticipants.length === 0 ? (
                    <div className="py-16 text-center px-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <UserX size={24} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-1">No Participants Found</h3>
                        <p className="text-xs text-gray-500">
                            No students match the selected filter criteria for this session.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3.5 px-4">Participant Details</th>
                                    <th className="py-3.5 px-4">Reg No</th>
                                    <th className="py-3.5 px-4">Team & Track</th>
                                    <th className="py-3.5 px-4">Department</th>
                                    <th className="py-3.5 px-4 text-center">Attendance Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredParticipants.map((student) => {
                                    const rec = records[student.id]
                                    const status = rec?.status
                                    const isSaving = savingUserId === student.id

                                    const initials = (student.name || student.email || 'P')
                                        .split(' ')
                                        .map(n => n[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Participant Details */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                                                        status === 'present'
                                                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                                                            : status === 'absent'
                                                            ? 'bg-rose-600 text-white'
                                                            : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-gray-900 text-sm">
                                                                {student.name || 'Participant'}
                                                            </span>
                                                            {student.is_leader && (
                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                                                                    <Crown size={10} className="text-purple-600" />
                                                                    Leader
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-500 text-xs">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Registration No */}
                                            <td className="py-3.5 px-4">
                                                {student.reg_no ? (
                                                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                        {student.reg_no}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">—</span>
                                                )}
                                            </td>

                                            {/* Team */}
                                            <td className="py-3.5 px-4">
                                                {student.is_assigned && student.team ? (
                                                    <div>
                                                        <span className="font-bold text-gray-900 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md inline-block mb-0.5">
                                                            {student.team.team_name}
                                                        </span>
                                                        <div className="text-[10px] font-mono text-gray-400">
                                                            ID: {student.team.team_code}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
                                                        No Team
                                                    </span>
                                                )}
                                            </td>

                                            {/* Department & Year */}
                                            <td className="py-3.5 px-4">
                                                <div className="text-gray-800 font-medium truncate max-w-[160px]" title={student.dept || ''}>
                                                    {student.dept || 'General'}
                                                </div>
                                                <div className="text-[11px] text-gray-500">
                                                    {student.year || ''} {student.section && `• Sec ${student.section}`}
                                                </div>
                                            </td>

                                            {/* Actions: Present / Absent Toggles */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="inline-flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-gray-200">
                                                    {/* PRESENT BUTTON */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAttendance(student.id, 'present')}
                                                        disabled={isSaving}
                                                        className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                                                            status === 'present'
                                                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 scale-102'
                                                                : 'text-gray-600 hover:text-emerald-700 hover:bg-white'
                                                        }`}
                                                    >
                                                        <Check size={13} className={status === 'present' ? 'text-white' : 'text-emerald-600'} />
                                                        Present
                                                    </button>

                                                    {/* ABSENT BUTTON */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAttendance(student.id, 'absent')}
                                                        disabled={isSaving}
                                                        className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                                                            status === 'absent'
                                                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 scale-102'
                                                                : 'text-gray-600 hover:text-rose-700 hover:bg-white'
                                                        }`}
                                                    >
                                                        <X size={13} className={status === 'absent' ? 'text-white' : 'text-rose-600'} />
                                                        Absent
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* CREATE ATTENDANCE SESSION MODAL            */}
            {/* ========================================== */}
            {isCreateSessionModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">New Attendance Session</h3>
                                    <p className="text-xs text-gray-500">Add a session slot for roll call</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsCreateSessionModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSessionSubmit} className="space-y-4 my-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Session Name / Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Day 1 - Morning Check-in"
                                    value={newSessionData.name}
                                    onChange={(e) => setNewSessionData({ ...newSessionData, name: e.target.value })}
                                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Time Slot <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'morning', label: 'Morning Slot', icon: Sunrise },
                                        { id: 'afternoon', label: 'Afternoon Slot', icon: Sun },
                                        { id: 'evening', label: 'Evening Slot', icon: Sunset },
                                        { id: 'night', label: 'Night Slot', icon: Moon },
                                    ].map(slotItem => {
                                        const isSel = newSessionData.slot === slotItem.id
                                        const Icon = slotItem.icon
                                        return (
                                            <div
                                                key={slotItem.id}
                                                onClick={() => setNewSessionData({ ...newSessionData, slot: slotItem.id as any })}
                                                className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-2 transition-all ${
                                                    isSel
                                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200'
                                                        : 'bg-slate-50 hover:bg-white border-gray-200 text-gray-700'
                                                }`}
                                            >
                                                <Icon size={14} className={isSel ? 'text-emerald-600' : 'text-gray-400'} />
                                                <span>{slotItem.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Session Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={newSessionData.date}
                                    onChange={(e) => setNewSessionData({ ...newSessionData, date: e.target.value })}
                                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateSessionModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingSession}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isCreatingSession ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Creating Session...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            Save Session
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
