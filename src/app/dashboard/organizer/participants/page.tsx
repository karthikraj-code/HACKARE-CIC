'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
    Users, 
    Search, 
    Filter, 
    Trash2, 
    Edit3, 
    UserPlus, 
    UserCheck, 
    UserX, 
    RefreshCw, 
    Download, 
    CheckCircle2, 
    AlertCircle, 
    Crown, 
    Mail, 
    Building2, 
    GraduationCap, 
    Hash, 
    Calendar, 
    ArrowUpDown, 
    MoreVertical, 
    ExternalLink,
    X,
    ShieldAlert,
    Check,
    Copy,
    Sparkles,
    Layers,
    User,
    PlusCircle
} from 'lucide-react'
import Link from 'next/link'

interface Participant {
    id: string
    name: string
    email: string
    reg_no?: string | null
    dept?: string | null
    section?: string | null
    year?: string | null
    role: string
    created_at?: string
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

interface TeamOption {
    id: string
    team_name: string
    team_code: string
    memberCount?: number
}

const DEPT_OPTIONS = [
    'All Departments',
    'Computer Science & Engg (CSE)',
    'Information Technology (IT)',
    'AI & Data Science (AI/DS)',
    'Electronics & Comm (ECE)',
    'Electrical & Electronics (EEE)',
    'Mechanical Engineering (MECH)',
    'Civil Engineering (CIVIL)',
    'Computer Applications (MCA/BCA)',
    'Other Engineering Track'
]

const YEAR_OPTIONS = [
    'All Years',
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Postgraduate / Masters'
]

export default function OrganizerParticipantsPage() {
    const [participants, setParticipants] = useState<Participant[]>([])
    const [teams, setTeams] = useState<TeamOption[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    
    // Notifications
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned' | 'leaders'>('all')
    const [deptFilter, setDeptFilter] = useState('All Departments')
    const [yearFilter, setYearFilter] = useState('All Years')
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'team_asc' | 'reg_asc'>('date_desc')

    // Modal States
    const [deleteModalStudent, setDeleteModalStudent] = useState<Participant | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [editModalStudent, setEditModalStudent] = useState<Participant | null>(null)
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        reg_no: '',
        dept: '',
        section: '',
        year: ''
    })
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    const [assignModalStudent, setAssignModalStudent] = useState<Participant | null>(null)
    const [selectedTeamId, setSelectedTeamId] = useState('')
    const [assignTeamSearch, setAssignTeamSearch] = useState('')
    const [loadingTeams, setLoadingTeams] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)

    const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

    useEffect(() => {
        fetchParticipantsAndTeams()
    }, [])

    const fetchParticipantsAndTeams = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const [studentsRes, teamsRes] = await Promise.all([
                fetch('/api/organizer/students'),
                fetch('/api/organizer/teams')
            ])

            const studentsData = await studentsRes.json()
            const teamsData = await teamsRes.json()

            if (studentsRes.ok && studentsData.students) {
                setParticipants(studentsData.students)
            } else if (studentsRes.ok && Array.isArray(studentsData)) {
                setParticipants(studentsData)
            } else {
                throw new Error(studentsData.error || 'Failed to load participants')
            }

            const rawTeams = Array.isArray(teamsData) ? teamsData : (teamsData?.teams || [])
            setTeams(rawTeams.map((t: any) => ({
                id: t.id,
                team_name: t.team_name,
                team_code: t.team_code,
                memberCount: (t.team_members || []).length
            })))
        } catch (err: any) {
            console.error('Error loading participants:', err)
            setAlertMessage({ type: 'error', text: err.message || 'Error fetching participant list' })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const showToast = (type: 'success' | 'error', text: string) => {
        setAlertMessage({ type, text })
        setTimeout(() => {
            setAlertMessage(null)
        }, 5000)
    }

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
        setCopiedEmail(email)
        setTimeout(() => setCopiedEmail(null), 2000)
    }

    // ==========================================
    // DELETE PARTICIPANT FROM DB & WEBSITE
    // ==========================================
    const handleDeleteParticipant = async () => {
        if (!deleteModalStudent) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/organizer/students?id=${encodeURIComponent(deleteModalStudent.id)}`, {
                method: 'DELETE'
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete student')
            }

            // Remove from local state
            setParticipants(prev => prev.filter(p => p.id !== deleteModalStudent.id))
            showToast('success', data.message || `Student "${deleteModalStudent.name || deleteModalStudent.email}" was permanently removed from website and database.`)
            setDeleteModalStudent(null)

            // Background refresh to sync team leader states
            fetchParticipantsAndTeams(true)
        } catch (err: any) {
            showToast('error', err.message || 'Failed to delete student')
        } finally {
            setIsDeleting(false)
        }
    }

    // ==========================================
    // EDIT PARTICIPANT PROFILE
    // ==========================================
    const handleOpenEditModal = (student: Participant) => {
        setEditModalStudent(student)
        setEditForm({
            name: student.name || '',
            email: student.email || '',
            reg_no: student.reg_no || '',
            dept: student.dept || '',
            section: student.section || '',
            year: student.year || ''
        })
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editModalStudent) return

        if (!editForm.name.trim()) {
            showToast('error', 'Student name is required')
            return
        }

        setIsSavingEdit(true)
        try {
            const res = await fetch(`/api/organizer/students/${editModalStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update student profile')

            setParticipants(prev => prev.map(p => {
                if (p.id === editModalStudent.id) {
                    return {
                        ...p,
                        name: editForm.name.trim(),
                        email: editForm.email.trim().toLowerCase(),
                        reg_no: editForm.reg_no.trim() || null,
                        dept: editForm.dept.trim() || null,
                        section: editForm.section.trim() || null,
                        year: editForm.year.trim() || null
                    }
                }
                return p
            }))

            showToast('success', `Student profile for "${editForm.name}" updated successfully!`)
            setEditModalStudent(null)
        } catch (err: any) {
            showToast('error', err.message || 'Failed to update profile')
        } finally {
            setIsSavingEdit(false)
        }
    }

    // ==========================================
    // ASSIGN UNASSIGNED STUDENT TO TEAM
    // ==========================================
    const handleOpenAssignModal = async (student: Participant) => {
        setAssignModalStudent(student)
        setSelectedTeamId('')
        setAssignTeamSearch('')
        setLoadingTeams(true)

        try {
            const res = await fetch('/api/organizer/teams')
            const data = await res.json()
            const rawTeams = Array.isArray(data) ? data : (data?.teams || [])
            setTeams(rawTeams.map((t: any) => ({
                id: t.id,
                team_name: t.team_name,
                team_code: t.team_code,
                memberCount: (t.team_members || []).length
            })))
        } catch (e) {
            console.error('Error fetching teams for assignment modal:', e)
        } finally {
            setLoadingTeams(false)
        }
    }

    const handleAssignToTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assignModalStudent || !selectedTeamId) {
            showToast('error', 'Please select a destination team')
            return
        }

        setIsAssigning(true)
        try {
            const res = await fetch(`/api/organizer/teams/${selectedTeamId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: assignModalStudent.id,
                    email: assignModalStudent.email,
                    name: assignModalStudent.name,
                    reg_no: assignModalStudent.reg_no,
                    dept: assignModalStudent.dept,
                    section: assignModalStudent.section,
                    year: assignModalStudent.year
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to assign student to team')

            showToast('success', data.message || `Assigned "${assignModalStudent.name || assignModalStudent.email}" to team successfully!`)
            setAssignModalStudent(null)
            await fetchParticipantsAndTeams(true)
        } catch (err: any) {
            showToast('error', err.message || 'Failed to assign team')
        } finally {
            setIsAssigning(false)
        }
    }

    // Filter teams for Assign Modal
    const modalFilteredTeams = useMemo(() => {
        if (!assignTeamSearch.trim()) return teams
        const q = assignTeamSearch.toLowerCase().trim()
        return teams.filter(t => 
            t.team_name.toLowerCase().includes(q) || 
            t.team_code.toLowerCase().includes(q)
        )
    }, [teams, assignTeamSearch])

    // ==========================================
    // EXPORT PARTICIPANTS TO CSV
    // ==========================================
    const handleExportCSV = () => {
        if (participants.length === 0) {
            showToast('error', 'No participant records to export')
            return
        }

        const headers = ['Full Name', 'Email', 'Registration No', 'Department', 'Year', 'Section', 'Team Status', 'Team Name', 'Team Code', 'Is Leader', 'Registered Date']
        
        const rows = participants.map(p => [
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${(p.email || '').replace(/"/g, '""')}"`,
            `"${(p.reg_no || '').replace(/"/g, '""')}"`,
            `"${(p.dept || '').replace(/"/g, '""')}"`,
            `"${(p.year || '').replace(/"/g, '""')}"`,
            `"${(p.section || '').replace(/"/g, '""')}"`,
            p.is_assigned ? 'In Team' : 'Unassigned',
            `"${(p.team?.team_name || '').replace(/"/g, '""')}"`,
            `"${(p.team?.team_code || '').replace(/"/g, '""')}"`,
            p.is_leader ? 'Yes' : 'No',
            p.created_at ? new Date(p.created_at).toLocaleDateString() : ''
        ])

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `hackare_participants_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast('success', `Exported ${participants.length} participants to CSV!`)
    }

    // ==========================================
    // FILTERED & SORTED PARTICIPANTS
    // ==========================================
    const filteredParticipants = useMemo(() => {
        return participants.filter(p => {
            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim()
                const matchName = (p.name || '').toLowerCase().includes(query)
                const matchEmail = (p.email || '').toLowerCase().includes(query)
                const matchReg = (p.reg_no || '').toLowerCase().includes(query)
                const matchDept = (p.dept || '').toLowerCase().includes(query)
                const matchTeam = (p.team?.team_name || '').toLowerCase().includes(query)
                const matchTeamCode = (p.team?.team_code || '').toLowerCase().includes(query)

                if (!matchName && !matchEmail && !matchReg && !matchDept && !matchTeam && !matchTeamCode) {
                    return false
                }
            }

            // Status filter
            if (statusFilter === 'assigned' && !p.is_assigned) return false
            if (statusFilter === 'unassigned' && p.is_assigned) return false
            if (statusFilter === 'leaders' && (!p.is_assigned || !p.is_leader)) return false

            // Department filter
            if (deptFilter !== 'All Departments') {
                if (deptFilter === 'Other Engineering Track') {
                    if (p.dept && DEPT_OPTIONS.slice(1, -1).includes(p.dept)) return false
                } else if (p.dept !== deptFilter) {
                    return false
                }
            }

            // Year filter
            if (yearFilter !== 'All Years' && p.year !== yearFilter) {
                return false
            }

            return true
        }).sort((a, b) => {
            if (sortBy === 'name_asc') return (a.name || a.email).localeCompare(b.name || b.email)
            if (sortBy === 'name_desc') return (b.name || b.email).localeCompare(a.name || a.email)
            if (sortBy === 'reg_asc') return (a.reg_no || '').localeCompare(b.reg_no || '')
            if (sortBy === 'team_asc') return (a.team?.team_name || 'ZZZ').localeCompare(b.team?.team_name || 'ZZZ')
            if (sortBy === 'date_desc') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                return dateB - dateA
            }
            return 0
        })
    }, [participants, searchQuery, statusFilter, deptFilter, yearFilter, sortBy])

    // KPI Metrics
    const totalParticipants = participants.length
    const assignedCount = participants.filter(p => p.is_assigned).length
    const unassignedCount = totalParticipants - assignedCount
    const leaderCount = participants.filter(p => p.is_leader).length
    const assignedPercentage = totalParticipants > 0 ? Math.round((assignedCount / totalParticipants) * 100) : 0

    return (
        <div className="space-y-6 pb-12">
            {/* Alert Notification Toast */}
            {alertMessage && (
                <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
                    alertMessage.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-3">
                        {alertMessage.type === 'success' ? (
                            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                        ) : (
                            <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium">{alertMessage.text}</p>
                    </div>
                    <button 
                        onClick={() => setAlertMessage(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Users size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Participants Directory</h1>
                            <p className="text-sm text-gray-500">
                                View all registered students, check team assignment status, and manage or delete participants.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => fetchParticipantsAndTeams(true)}
                        disabled={refreshing || loading}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={participants.length === 0}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Download size={14} className="text-gray-600" />
                        Export CSV
                    </button>
                    <Link
                        href="/dashboard/organizer/teams"
                        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <UserCheck size={14} />
                        Manage Teams &rarr;
                    </Link>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Registered</span>
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users size={18} />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{totalParticipants}</div>
                    <p className="text-xs text-gray-500 mt-1">Active participant accounts</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned to Team</span>
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <UserCheck size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-700">{assignedCount}</span>
                        <span className="text-xs font-bold text-emerald-600">({assignedPercentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${assignedPercentage}%` }} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unassigned / Solo</span>
                        <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <UserX size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600">{unassignedCount}</span>
                        <span className="text-xs font-bold text-amber-500">
                            ({totalParticipants > 0 ? 100 - assignedPercentage : 0}%)
                        </span>
                    </div>
                    <p className="text-xs text-amber-700 font-medium mt-1">Needs team placement</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Leaders</span>
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Crown size={18} />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-purple-700">{leaderCount}</div>
                    <p className="text-xs text-gray-500 mt-1">Appointed team captains</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, reg no, department, team..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-200 hover:bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-gray-200 overflow-x-auto">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                statusFilter === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            All ({totalParticipants})
                        </button>
                        <button
                            onClick={() => setStatusFilter('assigned')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'assigned'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-emerald-700'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${statusFilter === 'assigned' ? 'bg-white' : 'bg-emerald-500'}`} />
                            In Team ({assignedCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('unassigned')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'unassigned'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-amber-700'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${statusFilter === 'unassigned' ? 'bg-white' : 'bg-amber-500'}`} />
                            Unassigned ({unassignedCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('leaders')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'leaders'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-purple-700'
                            }`}
                        >
                            <Crown size={12} />
                            Leaders ({leaderCount})
                        </button>
                    </div>
                </div>

                {/* Secondary Filters: Dept, Year, Sorting */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                    <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Department
                        </label>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="w-full text-xs font-medium bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {DEPT_OPTIONS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Academic Year
                        </label>
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="w-full text-xs font-medium bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {YEAR_OPTIONS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Sort Order
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                            className="w-full text-xs font-medium bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="date_desc">Latest Registered First</option>
                            <option value="name_asc">Name (A &rarr; Z)</option>
                            <option value="name_desc">Name (Z &rarr; A)</option>
                            <option value="team_asc">Team Name</option>
                            <option value="reg_asc">Registration Number</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Participants Table List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/70 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-600 flex items-center gap-2">
                        <Users size={14} className="text-indigo-600" />
                        Showing {filteredParticipants.length} of {totalParticipants} Participants
                    </div>
                    {(searchQuery || statusFilter !== 'all' || deptFilter !== 'All Departments' || yearFilter !== 'All Years') && (
                        <button
                            onClick={() => {
                                setSearchQuery('')
                                setStatusFilter('all')
                                setDeptFilter('All Departments')
                                setYearFilter('All Years')
                            }}
                            className="text-xs text-indigo-600 font-bold hover:underline"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <RefreshCw size={36} className="animate-spin text-indigo-600 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-700">Loading participant records...</p>
                        <p className="text-xs text-gray-400 mt-1">Fetching profiles and team associations</p>
                    </div>
                ) : filteredParticipants.length === 0 ? (
                    <div className="py-16 text-center px-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                            <UserX size={26} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-1">No Participants Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            {searchQuery || statusFilter !== 'all' || deptFilter !== 'All Departments' || yearFilter !== 'All Years'
                                ? 'No participants match the selected filter criteria. Try adjusting your search or filters.'
                                : 'No participants have registered on the platform yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3.5 px-4">Student Details</th>
                                    <th className="py-3.5 px-4">Registration No</th>
                                    <th className="py-3.5 px-4">Department & Year</th>
                                    <th className="py-3.5 px-4">Team Assignment</th>
                                    <th className="py-3.5 px-4">Registered Date</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredParticipants.map((student) => {
                                    const initials = (student.name || student.email || 'P')
                                        .split(' ')
                                        .map(n => n[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Student Details */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                                                        student.is_leader
                                                            ? 'bg-purple-600 text-white ring-2 ring-purple-200'
                                                            : student.is_assigned
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-gray-900 text-sm">
                                                                {student.name || 'Unnamed Participant'}
                                                            </span>
                                                            {student.is_leader && (
                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200" title="Team Leader">
                                                                    <Crown size={10} className="text-purple-600" />
                                                                    Leader
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                                                            <span>{student.email}</span>
                                                            <button
                                                                onClick={() => handleCopyEmail(student.email)}
                                                                className="text-gray-400 hover:text-gray-700 p-0.5 transition-colors"
                                                                title="Copy email"
                                                            >
                                                                {copiedEmail === student.email ? (
                                                                    <Check size={11} className="text-emerald-600" />
                                                                ) : (
                                                                    <Copy size={11} />
                                                                )}
                                                            </button>
                                                        </div>
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
                                                    <span className="text-gray-400 font-medium italic">Not set</span>
                                                )}
                                            </td>

                                            {/* Department & Year */}
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-gray-800 flex items-center gap-1">
                                                        <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                                                        <span className="truncate max-w-[180px]" title={student.dept || 'Department not specified'}>
                                                            {student.dept || 'General Track'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                                                        {student.year && (
                                                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium border border-indigo-100">
                                                                {student.year}
                                                            </span>
                                                        )}
                                                        {student.section && (
                                                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                                                Sec {student.section}
                                                            </span>
                                                        )}
                                                        {!student.year && !student.section && (
                                                            <span className="text-gray-400 italic">—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Team Assignment */}
                                            <td className="py-3.5 px-4">
                                                {student.is_assigned && student.team ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-gray-900 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                <UserCheck size={11} className="text-emerald-600" />
                                                                {student.team.team_name}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                                                            <span>ID: {student.team.team_code}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1">
                                                            <UserX size={12} className="text-amber-500" />
                                                            Unassigned
                                                        </span>
                                                        <button
                                                            onClick={() => handleOpenAssignModal(student)}
                                                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 transition-colors flex items-center gap-1"
                                                            title="Assign to an existing team"
                                                        >
                                                            <UserPlus size={12} />
                                                            Assign Team
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Registered Date */}
                                            <td className="py-3.5 px-4 text-gray-500 text-[11px] font-medium">
                                                {student.created_at ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        <span>{new Date(student.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEditModal(student)}
                                                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                                        title="Edit student profile details"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModalStudent(student)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                        title="Remove / Delete student from DB and website"
                                                    >
                                                        <Trash2 size={15} />
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
            {/* DELETE PARTICIPANT CONFIRMATION MODAL      */}
            {/* ========================================== */}
            {deleteModalStudent && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                                <ShieldAlert size={26} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Remove Student from Website & DB</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    This action cannot be undone. Are you sure you want to permanently delete this participant?
                                </p>
                            </div>
                        </div>

                        {/* Student Details Card */}
                        <div className="my-5 p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-600">Student Name:</span>
                                <span className="font-bold text-gray-900">{deleteModalStudent.name || 'Unnamed'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-600">Email Address:</span>
                                <span className="font-mono text-gray-900">{deleteModalStudent.email}</span>
                            </div>
                            {deleteModalStudent.reg_no && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">Registration No:</span>
                                    <span className="font-mono font-bold text-gray-900">{deleteModalStudent.reg_no}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-600">Team Status:</span>
                                <span className="font-bold">
                                    {deleteModalStudent.is_assigned && deleteModalStudent.team ? (
                                        <span className="text-purple-700">
                                            Member of {deleteModalStudent.team.team_name} {deleteModalStudent.is_leader && '(Leader)'}
                                        </span>
                                    ) : (
                                        <span className="text-amber-700">Not in any team</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-[11px] text-amber-800 leading-relaxed">
                            <strong>Note:</strong> Removing this student will automatically unbind them from any team memberships. If they are a Team Leader, the leadership will be transferred to another remaining team member.
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteModalStudent(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteParticipant}
                                disabled={isDeleting}
                                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        Deleting Student...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        Confirm & Delete Student
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* EDIT PARTICIPANT MODAL                     */}
            {/* ========================================== */}
            {editModalStudent && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Edit3 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Edit Participant Profile</h3>
                                    <p className="text-xs text-gray-500">Update student information</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setEditModalStudent(null)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 my-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Registration / Roll Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 21CS045"
                                        value={editForm.reg_no}
                                        onChange={(e) => setEditForm({ ...editForm, reg_no: e.target.value })}
                                        className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Department / Branch
                                    </label>
                                    <select
                                        value={editForm.dept}
                                        onChange={(e) => setEditForm({ ...editForm, dept: e.target.value })}
                                        className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select Department</option>
                                        {DEPT_OPTIONS.slice(1).map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Academic Year
                                    </label>
                                    <select
                                        value={editForm.year}
                                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                        className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select Year</option>
                                        {YEAR_OPTIONS.slice(1).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Section
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A, B, C"
                                        value={editForm.section}
                                        onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                                        className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditModalStudent(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isSavingEdit ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            Save Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* ASSIGN STUDENT TO TEAM MODAL               */}
            {/* ========================================== */}
            {assignModalStudent && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Assign Participant to Team</h3>
                                    <p className="text-xs text-gray-500">Select a team to add this student</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setAssignModalStudent(null)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignToTeam} className="space-y-4 my-4">
                            {/* Target Student Preview */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-gray-900">{assignModalStudent.name || assignModalStudent.email}</div>
                                    <div className="text-gray-500 text-[11px]">{assignModalStudent.email}</div>
                                    {assignModalStudent.dept && (
                                        <div className="text-indigo-600 font-medium text-[11px] mt-0.5">
                                            {assignModalStudent.dept} {assignModalStudent.year && `• ${assignModalStudent.year}`}
                                        </div>
                                    )}
                                </div>
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                    Unassigned
                                </span>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700">
                                        Choose Team <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        {teams.length} team(s) available
                                    </span>
                                </div>

                                {/* Team Search Filter inside modal */}
                                {teams.length > 5 && (
                                    <div className="relative mb-2">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search team name or ID..."
                                            value={assignTeamSearch}
                                            onChange={(e) => setAssignTeamSearch(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                )}

                                {/* Loading state */}
                                {loadingTeams ? (
                                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-gray-200">
                                        <RefreshCw size={20} className="animate-spin text-emerald-600 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Loading team options...</p>
                                    </div>
                                ) : teams.length === 0 ? (
                                    <div className="p-5 text-center bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                                        <p className="text-xs font-semibold text-gray-700">No teams exist yet.</p>
                                        <p className="text-[11px] text-gray-500">Create a new team first in Manage Teams.</p>
                                        <Link
                                            href="/dashboard/organizer/teams"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                                        >
                                            Go to Manage Teams &rarr;
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Dropdown Selector */}
                                        <select
                                            required
                                            value={selectedTeamId}
                                            onChange={(e) => setSelectedTeamId(e.target.value)}
                                            className="w-full text-xs font-medium bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">-- Choose a team from dropdown --</option>
                                            {modalFilteredTeams.map(t => {
                                                const isFull = (t.memberCount || 0) >= 4
                                                return (
                                                    <option 
                                                        key={t.id} 
                                                        value={t.id}
                                                        disabled={isFull}
                                                    >
                                                        {t.team_name} ({t.team_code}) — {t.memberCount || 0}/4 members {isFull ? '(FULL)' : ''}
                                                    </option>
                                                )
                                            })}
                                        </select>

                                        {/* Quick Pick Team Cards (Scrollable) */}
                                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                            {modalFilteredTeams.map(t => {
                                                const isFull = (t.memberCount || 0) >= 4
                                                const isSelected = selectedTeamId === t.id

                                                return (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => {
                                                            if (!isFull) setSelectedTeamId(t.id)
                                                        }}
                                                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                                                            isFull
                                                                ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                                                                : isSelected
                                                                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-200 shadow-sm'
                                                                : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                                                isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                                                            }`}>
                                                                {isSelected && <Check size={10} className="text-white" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900">{t.team_name}</div>
                                                                <div className="text-[10px] text-gray-500 font-mono">Code: {t.team_code}</div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            {isFull ? (
                                                                <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] font-bold">
                                                                    4/4 (Full)
                                                                </span>
                                                            ) : (
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {t.memberCount || 0}/4 Members
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setAssignModalStudent(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAssigning || !selectedTeamId}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isAssigning ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={14} />
                                            Assign to Selected Team
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
