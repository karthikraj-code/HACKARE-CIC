'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
    Users, 
    UserPlus, 
    UserMinus, 
    ShieldCheck, 
    AlertCircle, 
    Lightbulb, 
    Edit3, 
    Trash2, 
    Save, 
    X, 
    Search, 
    Filter, 
    CheckCircle2, 
    Crown, 
    GraduationCap, 
    Building2, 
    Hash, 
    Sparkles, 
    RefreshCw, 
    Layers, 
    Sliders,
    ArrowRight,
    Copy,
    Check
} from 'lucide-react'
import CopyButton from '@/components/CopyButton'

const DEPT_OPTIONS = [
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
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Postgraduate / Masters'
]

const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Other']

export default function ManageTeamsPage() {
    const supabase = createClient()

    const [teams, setTeams] = useState<any[]>([])
    const [problemStatements, setProblemStatements] = useState<any[]>([])
    const [judges, setJudges] = useState<any[]>([])
    const [whitelistedEmails, setWhitelistedEmails] = useState<string[]>([])
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    // Notification states
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'ps_locked' | 'ps_pending' | 'judge_assigned' | 'no_judge'>('all')

    // Edit Team & Profiles Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'team' | 'members' | 'add_member'>('team')
    const [editingTeam, setEditingTeam] = useState<any>(null)
    const [savingTeam, setSavingTeam] = useState(false)
    const [modalError, setModalError] = useState('')
    const [modalSuccess, setModalSuccess] = useState('')

    // Form data for editing
    const [editFormData, setEditFormData] = useState<{
        team_name: string
        team_code: string
        invite_code: string
        leader_id: string
        problem_id: string
        members: Array<{
            user_id: string
            name: string
            email: string
            reg_no: string
            dept: string
            section: string
            year: string
        }>
        remove_member_user_ids: string[]
        add_member_email: string
    }>({
        team_name: '',
        team_code: '',
        invite_code: '',
        leader_id: '',
        problem_id: '',
        members: [],
        remove_member_user_ids: [],
        add_member_email: ''
    })

    // Quick Change Problem Statement Modal
    const [quickPsTeam, setQuickPsTeam] = useState<any>(null)
    const [quickPsSelectedId, setQuickPsSelectedId] = useState<string>('')
    const [quickPsSaving, setQuickPsSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [
                { data: teamsData, error: teamsErr }, 
                { data: psData },
                { data: judgesData }, 
                { data: assignsData },
                { data: whitelistedData }
            ] = await Promise.all([
                supabase.from('teams').select(`
                    id, 
                    team_name, 
                    team_code,
                    leader_id,
                    invite_code,
                    selected_problem_id,
                    created_at,
                    team_members(
                        user_id,
                        users(id, name, email, reg_no, dept, section, year, role)
                    ),
                    problem_selections(
                        problem_id,
                        problem_statements(
                            id,
                            statement_code,
                            title,
                            domain,
                            description,
                            max_teams
                        )
                    )
                `).order('created_at', { ascending: true }),

                supabase.from('problem_statements').select('id, statement_code, title, domain, max_teams').order('statement_code', { ascending: true }),
                supabase.from('users').select('id, name, email').eq('role', 'judge'),
                supabase.from('judge_assignments').select('*'),
                supabase.from('judge_emails').select('email')
            ])

            if (teamsErr) {
                console.error('Error fetching teams:', teamsErr)
            }

            setTeams(teamsData || [])
            setProblemStatements(psData || [])
            setJudges(judgesData || [])
            setAssignments(assignsData || [])
            setWhitelistedEmails((whitelistedData || []).map(d => d.email.toLowerCase()))
        } catch (err) {
            console.error(err)
            setError('Failed to fetch teams data.')
        } finally {
            setLoading(false)
        }
    }

    // Open Main Edit Modal
    const handleOpenEditModal = (team: any) => {
        setEditingTeam(team)
        setModalError('')
        setModalSuccess('')
        setActiveTab('team')

        const currentSel = team.problem_selections?.[0] || team.problem_selections
        const currentProblemId = currentSel?.problem_id || currentSel?.problem_statements?.id || team.selected_problem_id || ''

        const mappedMembers = (team.team_members || []).map((tm: any) => ({
            user_id: tm.user_id || tm.users?.id,
            name: tm.users?.name || '',
            email: tm.users?.email || '',
            reg_no: tm.users?.reg_no || '',
            dept: tm.users?.dept || '',
            section: tm.users?.section || '',
            year: tm.users?.year || ''
        }))

        setEditFormData({
            team_name: team.team_name || '',
            team_code: team.team_code || '',
            invite_code: team.invite_code || '',
            leader_id: team.leader_id || (mappedMembers[0]?.user_id || ''),
            problem_id: currentProblemId,
            members: mappedMembers,
            remove_member_user_ids: [],
            add_member_email: ''
        })

        setIsEditModalOpen(true)
    }

    // Save Team & Profiles
    const handleSaveTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingTeam) return

        if (!editFormData.team_name.trim()) {
            setModalError('Team name is required.')
            return
        }

        if (!editFormData.team_code.trim()) {
            setModalError('Team ID / Code is required.')
            return
        }

        setSavingTeam(true)
        setModalError('')
        setModalSuccess('')

        try {
            const res = await fetch(`/api/organizer/teams/${editingTeam.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_name: editFormData.team_name.trim(),
                    team_code: editFormData.team_code.trim().toUpperCase(),
                    invite_code: editFormData.invite_code.trim().toUpperCase(),
                    leader_id: editFormData.leader_id,
                    problem_id: editFormData.problem_id || null,
                    members: editFormData.members,
                    remove_member_user_ids: editFormData.remove_member_user_ids,
                    add_member_email: editFormData.add_member_email.trim()
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update team details.')
            }

            setModalSuccess('Team & Profile details updated successfully!')
            setMessage(`Team "${editFormData.team_name}" updated successfully!`)
            await fetchData()
            setTimeout(() => {
                setIsEditModalOpen(false)
            }, 800)
        } catch (err: any) {
            setModalError(err.message || 'Failed to update team.')
        } finally {
            setSavingTeam(false)
        }
    }

    // Quick Change Problem Statement
    const handleOpenQuickPs = (team: any) => {
        setQuickPsTeam(team)
        const currentSel = team.problem_selections?.[0] || team.problem_selections
        const currentProblemId = currentSel?.problem_id || currentSel?.problem_statements?.id || team.selected_problem_id || ''
        setQuickPsSelectedId(currentProblemId)
    }

    const handleSaveQuickPs = async () => {
        if (!quickPsTeam) return
        setQuickPsSaving(true)
        try {
            const res = await fetch(`/api/organizer/teams/${quickPsTeam.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem_id: quickPsSelectedId || null
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update problem statement')

            setMessage(`Problem statement updated for team "${quickPsTeam.team_name}".`)
            setQuickPsTeam(null)
            await fetchData()
        } catch (err: any) {
            alert(err.message || 'Failed to update problem statement')
        } finally {
            setQuickPsSaving(false)
        }
    }

    // Delete Team
    const handleDeleteTeam = async (team: any) => {
        const confirmMsg = `Are you sure you want to permanently delete team "${team.team_name}" (ID: ${team.team_code})?\n\nThis will delete their member associations, problem selections, submissions, and scores.`
        if (!confirm(confirmMsg)) return

        try {
            const res = await fetch(`/api/organizer/teams/${team.id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete team')

            setMessage(`Team "${team.team_name}" has been permanently deleted.`)
            if (isEditModalOpen && editingTeam?.id === team.id) {
                setIsEditModalOpen(false)
            }
            await fetchData()
        } catch (err: any) {
            setError(err.message || 'Failed to delete team')
        }
    }

    // Handle Member Input Changes in Edit Modal
    const handleMemberChange = (index: number, field: string, value: string) => {
        setEditFormData(prev => {
            const updated = [...prev.members]
            updated[index] = { ...updated[index], [field]: value }
            return { ...prev, members: updated }
        })
    }

    // Mark Member for Removal in Edit Modal
    const handleRemoveMember = (userId: string) => {
        setEditFormData(prev => {
            const remaining = prev.members.filter(m => m.user_id !== userId)
            const removeIds = [...prev.remove_member_user_ids, userId]
            let newLeaderId = prev.leader_id
            if (newLeaderId === userId && remaining.length > 0) {
                newLeaderId = remaining[0].user_id
            }
            return {
                ...prev,
                members: remaining,
                remove_member_user_ids: removeIds,
                leader_id: newLeaderId
            }
        })
    }

    // Judge Assignment
    const handleAssignment = async (team_id: string, judge_id: string, action: 'assign' | 'remove') => {
        const key = `${team_id}-${judge_id}`
        setProcessing(key)
        try {
            const res = await fetch('/api/organizer/assign-judge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_id, judge_id, action })
            })
            if (!res.ok) throw new Error('Failed to update assignment')
            await fetchData()
        } catch (err) {
            console.error(err)
            alert('Failed to update assignment')
        } finally {
            setProcessing(null)
        }
    }

    const isAssigned = (teamId: string, judgeId: string) => {
        return assignments.some(a => a.team_id === teamId && a.judge_id === judgeId)
    }

    const handleBulkAssignment = async (judge_id: string) => {
        if (!confirm('Are you sure you want to assign ALL teams to this judge?')) return
        setProcessing(`bulk-${judge_id}`)
        try {
            const res = await fetch('/api/organizer/assign-judge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ judge_id, action: 'bulk_assign' })
            })
            if (!res.ok) throw new Error('Failed to bulk assign')
            await fetchData()
            alert('All teams assigned successfully!')
        } catch (err) {
            console.error(err)
            alert('Failed to bulk assign')
        } finally {
            setProcessing(null)
        }
    }

    // Filter and search logic
    const filteredTeams = teams.filter(team => {
        const sel = team.problem_selections?.[0] || team.problem_selections
        const ps = sel?.problem_statements
        const hasPs = Boolean(ps)
        const teamAssignedJudges = assignments.filter(a => a.team_id === team.id)
        const hasJudge = teamAssignedJudges.length > 0

        if (statusFilter === 'ps_locked' && !hasPs) return false
        if (statusFilter === 'ps_pending' && hasPs) return false
        if (statusFilter === 'judge_assigned' && !hasJudge) return false
        if (statusFilter === 'no_judge' && hasJudge) return false

        const query = searchQuery.toLowerCase().trim()
        if (!query) return true

        const matchesTeamName = team.team_name?.toLowerCase().includes(query)
        const matchesTeamCode = team.team_code?.toLowerCase().includes(query)
        const matchesInviteCode = team.invite_code?.toLowerCase().includes(query)
        const matchesPsTitle = ps?.title?.toLowerCase().includes(query)
        const matchesPsCode = ps?.statement_code?.toLowerCase().includes(query)
        const matchesPsDomain = ps?.domain?.toLowerCase().includes(query)

        const matchesMembers = (team.team_members || []).some((tm: any) => {
            const u = tm.users || {}
            return (
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.reg_no?.toLowerCase().includes(query) ||
                u.dept?.toLowerCase().includes(query) ||
                u.section?.toLowerCase().includes(query) ||
                u.year?.toLowerCase().includes(query)
            )
        })

        return matchesTeamName || matchesTeamCode || matchesInviteCode || matchesPsTitle || matchesPsCode || matchesPsDomain || matchesMembers
    })

    // Metrics
    const totalTeams = teams.length
    const totalMembers = teams.reduce((acc, t) => acc + (t.team_members?.length || 0), 0)
    const teamsWithPs = teams.filter(t => Boolean(t.problem_selections?.[0] || t.problem_selections || t.selected_problem_id)).length
    const teamsWithJudges = teams.filter(t => assignments.some(a => a.team_id === t.id)).length

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-bold text-gray-700">Loading Teams & Profile Details...</p>
                <p className="text-xs text-gray-400 mt-1">Retrieving team rosters, problem selections, and academic profiles</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            
            {/* Header Banner */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1 flex items-center gap-2">
                        <Users className="text-blue-600" /> Manage Teams & Profiles
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Edit team details, customize Team IDs, reassign problem statements, update participant academic profiles, and manage judge allocations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                    <a
                        href="/dashboard/organizer/problem-statements"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Lightbulb size={14} className="text-amber-300" /> Problem Statements
                    </a>
                </div>
            </div>

            {/* Notification Messages */}
            {message && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 text-sm font-semibold animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span>{message}</span>
                    </div>
                    <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-between gap-2 text-sm font-semibold animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="text-red-700 hover:text-red-900 cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Teams</p>
                        <p className="text-2xl font-black text-gray-900">{totalTeams}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <GraduationCap size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Participants</p>
                        <p className="text-2xl font-black text-gray-900">{totalMembers}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Lightbulb size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">PS Locked</p>
                        <p className="text-2xl font-black text-gray-900">{teamsWithPs} / {totalTeams}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Judge Assigned</p>
                        <p className="text-2xl font-black text-gray-900">{teamsWithJudges} / {totalTeams}</p>
                    </div>
                </div>
            </div>

            {/* Bulk Assignment Panel */}
            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h3 className="text-base font-black text-blue-900 flex items-center gap-2">
                            <UserPlus size={18} className="text-blue-600" />
                            Bulk Judge Allocation
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Quickly assign all registered teams to a designated evaluation judge.
                        </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {judges.length} Registered Judges
                    </span>
                </div>

                {judges.length > 0 ? (
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[240px]">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Judge</label>
                            <select 
                                id="bulk-judge-select"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
                                defaultValue=""
                            >
                                <option value="" disabled>-- Choose a registered judge --</option>
                                {judges.map(j => (
                                    <option key={j.id} value={j.id}>{j.name} ({j.email})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => {
                                const select = document.getElementById('bulk-judge-select') as HTMLSelectElement
                                if (select.value) handleBulkAssignment(select.value)
                                else alert('Please select a judge first')
                            }}
                            disabled={!!processing}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md disabled:bg-gray-400 flex items-center gap-2 cursor-pointer shrink-0"
                        >
                            {processing?.startsWith('bulk') ? 'Assigning...' : <><UserPlus size={15} /> Assign All Teams to Selected Judge</>}
                        </button>
                    </div>
                ) : (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-xs font-medium flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <span>No registered judges found. Invite or whitelist judge emails in Access Settings.</span>
                    </div>
                )}
            </div>

            {/* Search and Filters Bar */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Team Name, Team ID, Member Name, Email, Reg No, or Problem Statement..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm shadow-sm font-medium"
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                statusFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            All ({teams.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('ps_locked')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                statusFilter === 'ps_locked'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            PS Locked ({teamsWithPs})
                        </button>
                        <button
                            onClick={() => setStatusFilter('ps_pending')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                statusFilter === 'ps_pending'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            PS Pending ({totalTeams - teamsWithPs})
                        </button>
                        <button
                            onClick={() => setStatusFilter('judge_assigned')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                statusFilter === 'judge_assigned'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            Judge Assigned ({teamsWithJudges})
                        </button>
                        <button
                            onClick={() => setStatusFilter('no_judge')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                statusFilter === 'no_judge'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            No Judge ({totalTeams - teamsWithJudges})
                        </button>
                    </div>
                </div>
            </div>

            {/* Teams List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredTeams.map(team => {
                    const sel = team.problem_selections?.[0] || team.problem_selections
                    const ps = sel?.problem_statements
                    const members = team.team_members || []
                    const memberCount = members.length
                    const leaderId = team.leader_id

                    return (
                        <div key={team.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-blue-300">
                            
                            {/* Team Header Bar */}
                            <div className="px-6 py-4.5 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="font-extrabold text-xl text-white tracking-tight">{team.team_name}</h3>
                                        
                                        {team.team_code && (
                                            <span className="font-mono text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-lg">
                                                ID: {team.team_code}
                                            </span>
                                        )}

                                        {team.invite_code && (
                                            <span className="font-mono text-xs font-bold bg-white/10 text-gray-300 border border-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                                <span>Invite: {team.invite_code}</span>
                                                <CopyButton text={team.invite_code} label="" variant="icon" />
                                            </span>
                                        )}

                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                            memberCount === 4 
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                                                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                        }`}>
                                            {memberCount} / 4 Members
                                        </span>
                                    </div>
                                </div>

                                {/* Header Actions: Edit Team, Quick Change PS, Delete, Submissions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => handleOpenEditModal(team)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                                        title="Edit Team Name, ID, Members Profile, Academic Details, and Problem Statement"
                                    >
                                        <Edit3 size={14} /> Edit Team & Profiles
                                    </button>

                                    <button
                                        onClick={() => handleOpenQuickPs(team)}
                                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                        title="Quickly change or assign problem statement"
                                    >
                                        <Lightbulb size={14} /> {ps ? 'Change PS' : 'Assign PS'}
                                    </button>

                                    <a 
                                        href="/dashboard/organizer/submissions" 
                                        className="text-xs text-blue-300 hover:text-white font-bold bg-white/10 px-3 py-2 rounded-xl border border-white/15 transition-colors"
                                    >
                                        Submissions &rarr;
                                    </a>

                                    <button
                                        onClick={() => handleDeleteTeam(team)}
                                        className="text-gray-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
                                        title="Delete Team"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6">
                                
                                {/* Problem Statement Assigned Card */}
                                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Lightbulb size={18} className={ps ? 'text-amber-500' : 'text-gray-400'} />
                                            <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                                                Assigned Problem Statement:
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleOpenQuickPs(team)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Edit3 size={13} /> {ps ? 'Reassign / Change Statement' : 'Assign Statement Now'}
                                        </button>
                                    </div>

                                    {ps ? (
                                        <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 shadow-2xs space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                                    {ps.statement_code}
                                                </span>
                                                <span className="text-xs font-bold text-gray-800">{ps.title}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                                    {ps.domain}
                                                </span>
                                            </div>
                                            {ps.description && (
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                    {ps.description}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 text-xs font-medium text-amber-900 flex items-center justify-between">
                                            <span>No problem statement currently assigned or selected by this team.</span>
                                            <button
                                                onClick={() => handleOpenQuickPs(team)}
                                                className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 cursor-pointer shrink-0"
                                            >
                                                Assign Problem Statement
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Team Members & Academic Profiles Grid */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                            <Users size={14} className="text-gray-400" />
                                            Team Members & Academic Profiles ({members.length}/4)
                                        </h4>
                                        <button
                                            onClick={() => {
                                                handleOpenEditModal(team)
                                                setActiveTab('members')
                                            }}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                                        >
                                            <Edit3 size={13} /> Edit Profiles
                                        </button>
                                    </div>

                                    {members.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                            {members.map((member: any) => {
                                                const u = member.users || {}
                                                const isLeader = (member.user_id === leaderId) || (u.id === leaderId)

                                                return (
                                                    <div 
                                                        key={member.user_id || u.id} 
                                                        className={`p-3.5 rounded-xl border transition-all ${
                                                            isLeader 
                                                                ? 'bg-blue-50/40 border-blue-200 shadow-2xs' 
                                                                : 'bg-white border-gray-200'
                                                        }`}
                                                    >
                                                        {/* Name & Leader Badge */}
                                                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                                            <p className="font-extrabold text-xs text-gray-900 truncate">
                                                                {u.name || 'Unnamed Participant'}
                                                            </p>
                                                            {isLeader && (
                                                                <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                                                    <Crown size={10} /> Leader
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Email */}
                                                        <p className="text-[11px] text-gray-500 truncate mb-2" title={u.email}>
                                                            {u.email}
                                                        </p>

                                                        {/* Academic Details Pills */}
                                                        <div className="space-y-1 text-[11px] font-medium text-gray-600 pt-2 border-t border-gray-100">
                                                            <div className="flex items-center gap-1 text-gray-700">
                                                                <Hash size={12} className="text-gray-400 shrink-0" />
                                                                <span className="font-bold text-gray-900 truncate">
                                                                    {u.reg_no ? u.reg_no : <span className="text-gray-400 italic font-normal">Reg: Not set</span>}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-1 text-gray-700">
                                                                <Building2 size={12} className="text-gray-400 shrink-0" />
                                                                <span className="truncate">
                                                                    {u.dept ? u.dept : <span className="text-gray-400 italic">Dept: Not set</span>}
                                                                    {u.section ? ` (Sec ${u.section})` : ''}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-1 text-gray-700">
                                                                <GraduationCap size={12} className="text-gray-400 shrink-0" />
                                                                <span className="truncate">
                                                                    {u.year ? u.year : <span className="text-gray-400 italic">Year: Not set</span>}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-gray-400 italic">
                                            No members have joined this team yet.
                                        </div>
                                    )}
                                </div>

                                {/* Assigned Judges Section */}
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-gray-400" />
                                        Assigned Evaluation Judges
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {judges.map(judge => {
                                            const assigned = isAssigned(team.id, judge.id)
                                            const key = `${team.id}-${judge.id}`
                                            const isProcessing = processing === key

                                            return (
                                                <div 
                                                    key={judge.id} 
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                                        assigned ? 'bg-blue-50/60 border-blue-200' : 'bg-white border-gray-200'
                                                    }`}
                                                >
                                                    <div className="pr-2 truncate">
                                                        <p className="font-bold text-xs text-gray-900 truncate">{judge.name}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{judge.email}</p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleAssignment(team.id, judge.id, assigned ? 'remove' : 'assign')}
                                                        disabled={isProcessing}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                                                            assigned
                                                                ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                                                        }`}
                                                    >
                                                        {isProcessing ? '...' : assigned ? 'Unassign' : 'Assign'}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {filteredTeams.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300 space-y-3">
                        <Search size={36} className="mx-auto text-gray-300" />
                        <h3 className="font-bold text-gray-700">No teams matching your search/filters</h3>
                        <p className="text-xs text-gray-400">Try adjusting search keywords or clearing status filters.</p>
                    </div>
                )}
            </div>

            {/* FULL EDIT TEAM & PROFILES MODAL */}
            {isEditModalOpen && editingTeam && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Edit3 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">
                                        Edit Team & Academic Profiles
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Updating team info, problem statement, and member profiles for <span className="font-bold text-gray-900">{editingTeam.team_name}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-gray-200 mb-6 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab('team')}
                                className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'team'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                1. Team & Problem Statement
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('members')}
                                className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'members'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                2. Member Profiles ({editFormData.members.length})
                            </button>
                            {editFormData.members.length < 4 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('add_member')}
                                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                        activeTab === 'add_member'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    + Add Member
                                </button>
                            )}
                        </div>

                        {/* Alerts */}
                        {modalError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2 shrink-0">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}
                        {modalSuccess && (
                            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2 shrink-0">
                                <CheckCircle2 size={16} className="shrink-0" />
                                <span>{modalSuccess}</span>
                            </div>
                        )}

                        {/* Modal Body / Scrollable Content */}
                        <form onSubmit={handleSaveTeam} className="space-y-6 overflow-y-auto pr-1 flex-1">
                            
                            {/* TAB 1: TEAM & PROBLEM STATEMENT */}
                            {activeTab === 'team' && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Team Name */}
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                                Team Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.team_name}
                                                onChange={e => setEditFormData({ ...editFormData, team_name: e.target.value })}
                                                placeholder="e.g. Code Crafters"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-bold"
                                            />
                                        </div>

                                        {/* Team ID / Code */}
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                                Team ID / Custom Code <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={editFormData.team_code}
                                                    onChange={e => setEditFormData({ ...editFormData, team_code: e.target.value.toUpperCase() })}
                                                    placeholder="e.g. TEAM-01, HACK-102"
                                                    required
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold text-sm tracking-wider uppercase"
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">Unique team identifier visible across platform</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Invite Code */}
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                                Invite Code
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.invite_code}
                                                onChange={e => setEditFormData({ ...editFormData, invite_code: e.target.value.toUpperCase() })}
                                                placeholder="e.g. 9FA2B"
                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold text-sm uppercase"
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">Used by teammates to join this team</p>
                                        </div>

                                        {/* Team Leader Select */}
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                                Designate Team Leader
                                            </label>
                                            <select
                                                value={editFormData.leader_id}
                                                onChange={e => setEditFormData({ ...editFormData, leader_id: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-semibold"
                                            >
                                                {editFormData.members.map((m, idx) => (
                                                    <option key={m.user_id || idx} value={m.user_id}>
                                                        {m.name || m.email} ({m.email})
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-gray-400 mt-1">Has authority to lock PS and submit rounds</p>
                                        </div>
                                    </div>

                                    {/* Problem Statement Selector */}
                                    <div className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Lightbulb className="text-amber-500" size={20} />
                                            <div>
                                                <h4 className="text-sm font-black text-gray-900">Assigned Problem Statement</h4>
                                                <p className="text-xs text-gray-500">Change or unassign the problem statement allocated to this team.</p>
                                            </div>
                                        </div>

                                        <select
                                            value={editFormData.problem_id}
                                            onChange={e => setEditFormData({ ...editFormData, problem_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-bold"
                                        >
                                            <option value="">-- No Problem Statement (Pending Selection) --</option>
                                            {problemStatements.map(ps => (
                                                <option key={ps.id} value={ps.id}>
                                                    {ps.statement_code}: {ps.title} [{ps.domain}] (Max {ps.max_teams} Teams)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: MEMBER ACADEMIC PROFILES */}
                            {activeTab === 'members' && (
                                <div className="space-y-6">
                                    <p className="text-xs text-gray-600 font-medium">
                                        Edit full names, emails, registration numbers, departments, sections, and study years for each member.
                                    </p>

                                    {editFormData.members.map((member, idx) => {
                                        const isLeader = member.user_id === editFormData.leader_id

                                        return (
                                            <div 
                                                key={member.user_id || idx} 
                                                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                                                    isLeader ? 'bg-blue-50/30 border-blue-200 shadow-2xs' : 'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                {/* Header for Member */}
                                                <div className="flex justify-between items-center pb-2 border-b border-gray-200/80">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm font-black text-gray-900">
                                                            Member #{idx + 1} {isLeader ? '(Team Leader)' : ''}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {!isLeader && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditFormData({ ...editFormData, leader_id: member.user_id })}
                                                                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                                            >
                                                                Set as Leader
                                                            </button>
                                                        )}
                                                        {editFormData.members.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMember(member.user_id)}
                                                                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer ml-2"
                                                            >
                                                                <UserMinus size={13} /> Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Row 1: Name & Email */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                                            Full Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={member.name}
                                                            onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                                                            placeholder="e.g. John Doe"
                                                            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                                            Email Address
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={member.email}
                                                            onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                                                            placeholder="john@example.com"
                                                            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 2: Registration No & Department */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                                            Registration / Roll Number
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={member.reg_no}
                                                            onChange={e => handleMemberChange(idx, 'reg_no', e.target.value)}
                                                            placeholder="e.g. 21BCE1024"
                                                            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                                            Department
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={member.dept}
                                                            onChange={e => handleMemberChange(idx, 'dept', e.target.value)}
                                                            placeholder="e.g. CSE, IT, ECE"
                                                            list={`dept-list-${idx}`}
                                                            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                        <datalist id={`dept-list-${idx}`}>
                                                            {DEPT_OPTIONS.map(d => <option key={d} value={d} />)}
                                                        </datalist>
                                                    </div>
                                                </div>

                                                {/* Row 3: Section & Academic Year */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                                            Section
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={member.section}
                                                            onChange={e => handleMemberChange(idx, 'section', e.target.value)}
                                                            placeholder="e.g. A, B, C"
                                                            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                                            Academic Year
                                                        </label>
                                                        <select
                                                            value={member.year}
                                                            onChange={e => handleMemberChange(idx, 'year', e.target.value)}
                                                            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        >
                                                            <option value="">-- Select Year --</option>
                                                            {YEAR_OPTIONS.map(y => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* TAB 3: ADD MEMBER */}
                            {activeTab === 'add_member' && (
                                <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="text-blue-600" size={20} />
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900">Add Registered Member to Team</h4>
                                            <p className="text-xs text-gray-500">Enter email of participant to attach them to this team.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Participant Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={editFormData.add_member_email}
                                            onChange={e => setEditFormData({ ...editFormData, add_member_email: e.target.value })}
                                            placeholder="participant@example.com"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            If the user hasn't created an account yet, a new participant record will be created automatically.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Actions */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 border-t border-gray-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTeam(editingTeam)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 size={14} /> Delete Team
                                </button>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={savingTeam}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400 cursor-pointer"
                                    >
                                        {savingTeam ? (
                                            <RefreshCw size={14} className="animate-spin" />
                                        ) : (
                                            <Save size={14} />
                                        )}
                                        {savingTeam ? 'Saving Changes...' : 'Save Team & Profile Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QUICK PROBLEM STATEMENT CHANGER MODAL */}
            {quickPsTeam && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
                            <div className="flex items-center gap-2.5">
                                <Lightbulb className="text-amber-500" size={22} />
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Change Problem Statement</h3>
                                    <p className="text-xs text-gray-500">For {quickPsTeam.team_name} (ID: {quickPsTeam.team_code})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setQuickPsTeam(null)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                                    Select Problem Statement
                                </label>
                                <select
                                    value={quickPsSelectedId}
                                    onChange={e => setQuickPsSelectedId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-bold"
                                >
                                    <option value="">-- No Problem Statement (Release Selection) --</option>
                                    {problemStatements.map(ps => (
                                        <option key={ps.id} value={ps.id}>
                                            {ps.statement_code}: {ps.title} [{ps.domain}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setQuickPsTeam(null)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveQuickPs}
                                    disabled={quickPsSaving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {quickPsSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    {quickPsSaving ? 'Updating...' : 'Update Problem Statement'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
