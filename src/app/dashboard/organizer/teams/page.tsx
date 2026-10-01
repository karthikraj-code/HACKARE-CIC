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
    Check,
    Plus,
    PlusCircle,
    Mail,
    UserCheck
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
    const [students, setStudents] = useState<any[]>([])
    const [whitelistedEmails, setWhitelistedEmails] = useState<string[]>([])
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    // Notification states
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'ps_locked' | 'ps_pending' | 'judge_assigned' | 'no_judge' | 'needs_members'>('all')

    // ==========================================
    // 1. CREATE NEW TEAM MODAL STATE
    // ==========================================
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [creatingTeam, setCreatingTeam] = useState(false)
    const [createModalError, setCreateModalError] = useState('')
    const [createModalSuccess, setCreateModalSuccess] = useState('')
    const [createMemberTab, setCreateMemberTab] = useState<'unassigned' | 'manual'>('unassigned')
    const [createStudentSearch, setCreateStudentSearch] = useState('')
    
    const [newTeamData, setNewTeamData] = useState<{
        team_name: string
        team_code: string
        invite_code: string
        problem_id: string
        members: Array<{
            user_id?: string
            name: string
            email: string
            reg_no: string
            dept: string
            section: string
            year: string
            is_leader: boolean
        }>
    }>({
        team_name: '',
        team_code: '',
        invite_code: '',
        problem_id: '',
        members: []
    })

    const [createManualStudent, setCreateManualStudent] = useState({
        name: '',
        email: '',
        reg_no: '',
        dept: '',
        section: '',
        year: '',
        is_leader: false
    })

    // ==========================================
    // 2. QUICK ADD STUDENT TO EXISTING TEAM STATE
    // ==========================================
    const [quickAddTeam, setQuickAddTeam] = useState<any>(null)
    const [quickAddTab, setQuickAddTab] = useState<'unassigned' | 'manual'>('unassigned')
    const [quickAddSearch, setQuickAddSearch] = useState('')
    const [quickAddSaving, setQuickAddSaving] = useState(false)
    const [quickAddError, setQuickAddError] = useState('')
    const [quickAddManualStudent, setQuickAddManualStudent] = useState({
        name: '',
        email: '',
        reg_no: '',
        dept: '',
        section: '',
        year: '',
        set_as_leader: false
    })

    // ==========================================
    // 3. EDIT TEAM & PROFILES MODAL STATE
    // ==========================================
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'team' | 'members' | 'add_member'>('team')
    const [editingTeam, setEditingTeam] = useState<any>(null)
    const [savingTeam, setSavingTeam] = useState(false)
    const [modalError, setModalError] = useState('')
    const [modalSuccess, setModalSuccess] = useState('')
    const [editAddStudentTab, setEditAddStudentTab] = useState<'unassigned' | 'manual'>('unassigned')
    const [editStudentSearch, setEditStudentSearch] = useState('')

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
        add_member_manual: {
            name: string
            email: string
            reg_no: string
            dept: string
            section: string
            year: string
            user_id?: string
            is_leader?: boolean
        }
    }>({
        team_name: '',
        team_code: '',
        invite_code: '',
        leader_id: '',
        problem_id: '',
        members: [],
        remove_member_user_ids: [],
        add_member_email: '',
        add_member_manual: {
            name: '',
            email: '',
            reg_no: '',
            dept: '',
            section: '',
            year: '',
            is_leader: false
        }
    })

    // ==========================================
    // 4. QUICK CHANGE PROBLEM STATEMENT MODAL
    // ==========================================
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
                { data: whitelistedData },
                studentsRes
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
                supabase.from('judge_emails').select('email'),
                fetch('/api/organizer/students').then(r => r.json()).catch(() => ({ students: [] }))
            ])

            if (teamsErr) {
                console.error('Error fetching teams:', teamsErr)
            }

            setTeams(teamsData || [])
            setProblemStatements(psData || [])
            setJudges(judgesData || [])
            setAssignments(assignsData || [])
            setWhitelistedEmails((whitelistedData || []).map(d => d.email.toLowerCase()))
            setStudents(studentsRes?.students || [])
        } catch (err) {
            console.error(err)
            setError('Failed to fetch teams and student data.')
        } finally {
            setLoading(false)
        }
    }

    // Helper: Generate Random Unique Code
    const generateRandomCode = (prefix = 'TEAM') => {
        const rand = Math.floor(100 + Math.random() * 900)
        return `${prefix}-${rand}`
    }

    const generateInviteCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }

    // ==========================================
    // CREATE TEAM HANDLERS
    // ==========================================
    const handleOpenCreateModal = () => {
        const nextNum = teams.length + 1
        const suggestedCode = `TEAM-${nextNum < 10 ? '0' + nextNum : nextNum}`
        const suggestedInvite = generateInviteCode()

        setNewTeamData({
            team_name: '',
            team_code: suggestedCode,
            invite_code: suggestedInvite,
            problem_id: '',
            members: []
        })
        setCreateManualStudent({
            name: '',
            email: '',
            reg_no: '',
            dept: '',
            section: '',
            year: '',
            is_leader: false
        })
        setCreateModalError('')
        setCreateModalSuccess('')
        setCreateMemberTab('unassigned')
        setCreateStudentSearch('')
        setIsCreateModalOpen(true)
    }

    const handleAddStudentToCreateRoster = (student: any, isLeader = false) => {
        if (newTeamData.members.length >= 4) {
            setCreateModalError('A team can have a maximum of 4 members.')
            return
        }

        const isAlreadyAdded = newTeamData.members.some(
            m => (student.id && m.user_id === student.id) || (student.email && m.email.toLowerCase() === student.email.toLowerCase())
        )
        if (isAlreadyAdded) {
            setCreateModalError(`Student ${student.name || student.email} is already in this team's roster.`)
            return
        }

        const shouldBeLeader = isLeader || newTeamData.members.length === 0

        const newMember = {
            user_id: student.id || undefined,
            name: student.name || '',
            email: student.email || '',
            reg_no: student.reg_no || '',
            dept: student.dept || '',
            section: student.section || '',
            year: student.year || '',
            is_leader: shouldBeLeader
        }

        setNewTeamData(prev => {
            let updatedMembers = [...prev.members]
            if (shouldBeLeader) {
                // Remove leader flag from existing members
                updatedMembers = updatedMembers.map(m => ({ ...m, is_leader: false }))
            }
            return {
                ...prev,
                members: [...updatedMembers, newMember]
            }
        })
        setCreateModalError('')
    }

    const handleAddManualStudentToCreateRoster = (e: React.FormEvent) => {
        e.preventDefault()
        if (!createManualStudent.email.trim()) {
            setCreateModalError('Student email address is required.')
            return
        }

        handleAddStudentToCreateRoster(createManualStudent, createManualStudent.is_leader)
        setCreateManualStudent({
            name: '',
            email: '',
            reg_no: '',
            dept: '',
            section: '',
            year: '',
            is_leader: false
        })
    }

    const handleRemoveFromCreateRoster = (indexToRemove: number) => {
        setNewTeamData(prev => {
            const remaining = prev.members.filter((_, idx) => idx !== indexToRemove)
            // If the removed member was the leader, make the first remaining member leader
            const wasLeader = prev.members[indexToRemove]?.is_leader
            if (wasLeader && remaining.length > 0) {
                remaining[0] = { ...remaining[0], is_leader: true }
            }
            return { ...prev, members: remaining }
        })
    }

    const handleSetLeaderInCreateRoster = (indexToLeader: number) => {
        setNewTeamData(prev => ({
            ...prev,
            members: prev.members.map((m, idx) => ({
                ...m,
                is_leader: idx === indexToLeader
            }))
        }))
    }

    const handleCreateTeamSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTeamData.team_name.trim()) {
            setCreateModalError('Team name is required.')
            return
        }

        if (!newTeamData.team_code.trim()) {
            setCreateModalError('Team ID is required.')
            return
        }

        setCreatingTeam(true)
        setCreateModalError('')
        setCreateModalSuccess('')

        try {
            const res = await fetch('/api/organizer/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_name: newTeamData.team_name.trim(),
                    team_code: newTeamData.team_code.trim().toUpperCase(),
                    invite_code: newTeamData.invite_code.trim().toUpperCase(),
                    problem_id: newTeamData.problem_id || null,
                    members: newTeamData.members
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create team.')
            }

            setCreateModalSuccess(`Team "${newTeamData.team_name}" created successfully!`)
            setMessage(`Team "${newTeamData.team_name}" created successfully with ${newTeamData.members.length} member(s)!`)
            await fetchData()
            setTimeout(() => {
                setIsCreateModalOpen(false)
            }, 800)
        } catch (err: any) {
            setCreateModalError(err.message || 'Failed to create team.')
        } finally {
            setCreatingTeam(false)
        }
    }

    // ==========================================
    // QUICK ADD STUDENT TO EXISTING TEAM
    // ==========================================
    const handleOpenQuickAddStudent = (team: any) => {
        setQuickAddTeam(team)
        setQuickAddError('')
        setQuickAddTab('unassigned')
        setQuickAddSearch('')
        setQuickAddManualStudent({
            name: '',
            email: '',
            reg_no: '',
            dept: '',
            section: '',
            year: '',
            set_as_leader: (team.team_members || []).length === 0
        })
    }

    const handleQuickAddExistingStudent = async (student: any) => {
        if (!quickAddTeam) return
        setQuickAddSaving(true)
        setQuickAddError('')

        try {
            const res = await fetch(`/api/organizer/teams/${quickAddTeam.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: student.id,
                    email: student.email,
                    name: student.name,
                    reg_no: student.reg_no,
                    dept: student.dept,
                    section: student.section,
                    year: student.year,
                    set_as_leader: (quickAddTeam.team_members || []).length === 0
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to add student to team.')

            setMessage(`Added "${student.name || student.email}" to "${quickAddTeam.team_name}"!`)
            setQuickAddTeam(null)
            await fetchData()
        } catch (err: any) {
            setQuickAddError(err.message || 'Failed to add student')
        } finally {
            setQuickAddSaving(false)
        }
    }

    const handleQuickAddManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickAddTeam) return
        if (!quickAddManualStudent.email.trim()) {
            setQuickAddError('Student email address is required.')
            return
        }

        setQuickAddSaving(true)
        setQuickAddError('')

        try {
            const res = await fetch(`/api/organizer/teams/${quickAddTeam.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: quickAddManualStudent.email.trim().toLowerCase(),
                    name: quickAddManualStudent.name.trim(),
                    reg_no: quickAddManualStudent.reg_no.trim() || null,
                    dept: quickAddManualStudent.dept.trim() || null,
                    section: quickAddManualStudent.section.trim() || null,
                    year: quickAddManualStudent.year.trim() || null,
                    set_as_leader: quickAddManualStudent.set_as_leader || (quickAddTeam.team_members || []).length === 0
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to add student to team.')

            setMessage(`Added "${quickAddManualStudent.name || quickAddManualStudent.email}" to "${quickAddTeam.team_name}"!`)
            setQuickAddTeam(null)
            await fetchData()
        } catch (err: any) {
            setQuickAddError(err.message || 'Failed to add student')
        } finally {
            setQuickAddSaving(false)
        }
    }

    // ==========================================
    // EDIT TEAM & PROFILES HANDLERS
    // ==========================================
    const handleOpenEditModal = (team: any) => {
        setEditingTeam(team)
        setModalError('')
        setModalSuccess('')
        setActiveTab('team')
        setEditAddStudentTab('unassigned')
        setEditStudentSearch('')

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
            add_member_email: '',
            add_member_manual: {
                name: '',
                email: '',
                reg_no: '',
                dept: '',
                section: '',
                year: '',
                is_leader: false
            }
        })

        setIsEditModalOpen(true)
    }

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
            // Check if there is a pending manual member addition
            let memberToAddObj: any = null
            if (editFormData.add_member_manual.email.trim()) {
                memberToAddObj = {
                    email: editFormData.add_member_manual.email.trim().toLowerCase(),
                    name: editFormData.add_member_manual.name.trim(),
                    reg_no: editFormData.add_member_manual.reg_no.trim() || null,
                    dept: editFormData.add_member_manual.dept.trim() || null,
                    section: editFormData.add_member_manual.section.trim() || null,
                    year: editFormData.add_member_manual.year.trim() || null,
                    user_id: editFormData.add_member_manual.user_id || null,
                    is_leader: editFormData.add_member_manual.is_leader || false
                }
            }

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
                    add_member_email: editFormData.add_member_email.trim(),
                    add_member: memberToAddObj
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

    const handleAddExistingStudentInEditModal = async (student: any) => {
        if (!editingTeam) return
        setSavingTeam(true)
        setModalError('')

        try {
            const res = await fetch(`/api/organizer/teams/${editingTeam.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: student.id,
                    email: student.email,
                    name: student.name,
                    reg_no: student.reg_no,
                    dept: student.dept,
                    section: student.section,
                    year: student.year
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to add student.')

            setModalSuccess(`Added "${student.name || student.email}" to team!`)
            await fetchData()
            // Update modal state with refreshed team
            if (data.team) {
                handleOpenEditModal(data.team)
                setActiveTab('members')
            }
        } catch (err: any) {
            setModalError(err.message || 'Failed to add student.')
        } finally {
            setSavingTeam(false)
        }
    }

    const handleMemberChange = (index: number, field: string, value: string) => {
        setEditFormData(prev => {
            const updated = [...prev.members]
            updated[index] = { ...updated[index], [field]: value }
            return { ...prev, members: updated }
        })
    }

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

    // ==========================================
    // QUICK PROBLEM STATEMENT CHANGER
    // ==========================================
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

    // ==========================================
    // DELETE TEAM
    // ==========================================
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

    // ==========================================
    // JUDGE ASSIGNMENT HANDLERS
    // ==========================================
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
        const memberCount = (team.team_members || []).length

        if (statusFilter === 'ps_locked' && !hasPs) return false
        if (statusFilter === 'ps_pending' && hasPs) return false
        if (statusFilter === 'judge_assigned' && !hasJudge) return false
        if (statusFilter === 'no_judge' && hasJudge) return false
        if (statusFilter === 'needs_members' && memberCount >= 4) return false

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

    // Unassigned students list for quick selection
    const unassignedStudents = students.filter(s => !s.is_assigned)

    // Filtered students for create modal
    const filteredStudentsForCreate = unassignedStudents.filter(s => {
        const q = createStudentSearch.toLowerCase().trim()
        if (!q) return true
        return (
            s.name?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.reg_no?.toLowerCase().includes(q) ||
            s.dept?.toLowerCase().includes(q)
        )
    })

    // Filtered students for quick add modal
    const filteredStudentsForQuickAdd = unassignedStudents.filter(s => {
        const q = quickAddSearch.toLowerCase().trim()
        if (!q) return true
        return (
            s.name?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.reg_no?.toLowerCase().includes(q) ||
            s.dept?.toLowerCase().includes(q)
        )
    })

    // Filtered students for edit modal
    const filteredStudentsForEdit = unassignedStudents.filter(s => {
        const q = editStudentSearch.toLowerCase().trim()
        if (!q) return true
        return (
            s.name?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.reg_no?.toLowerCase().includes(q) ||
            s.dept?.toLowerCase().includes(q)
        )
    })

    // Metrics
    const totalTeams = teams.length
    const totalMembers = teams.reduce((acc, t) => acc + (t.team_members?.length || 0), 0)
    const teamsWithPs = teams.filter(t => Boolean(t.problem_selections?.[0] || t.problem_selections || t.selected_problem_id)).length
    const teamsWithJudges = teams.filter(t => assignments.some(a => a.team_id === t.id)).length
    const teamsNeedingMembers = teams.filter(t => (t.team_members?.length || 0) < 4).length

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-bold text-gray-700">Loading Teams & Student Rosters...</p>
                <p className="text-xs text-gray-400 mt-1">Retrieving team structures, student participants, problem selections, and academic profiles</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            
            {/* Header Banner with Create Team Action */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1 flex items-center gap-2.5">
                        <Users className="text-blue-600" /> Manage Teams & Students
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Create teams, enroll students, allocate problem statements, customize Team IDs, and manage judge evaluations.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* PRIMARY CREATE TEAM BUTTON */}
                    <button
                        onClick={handleOpenCreateModal}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
                    >
                        <PlusCircle size={16} /> Create Team & Add Students
                    </button>

                    <button
                        onClick={fetchData}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <a
                        href="/dashboard/organizer/problem-statements"
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Lightbulb size={14} className="text-amber-300" /> Problem Statements
                    </a>
                </div>
            </div>

            {/* Notification Messages */}
            {message && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2 text-sm font-semibold animate-in fade-in">
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
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center justify-between gap-2 text-sm font-semibold animate-in fade-in">
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
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-gray-900">{totalMembers}</p>
                            <span className="text-[11px] font-bold text-gray-500">
                                ({unassignedStudents.length} unassigned)
                            </span>
                        </div>
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

            {/* Quick Unassigned Students Banner if available */}
            {unassignedStudents.length > 0 && (
                <div className="p-4.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-white rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {unassignedStudents.length}
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-blue-950">
                                {unassignedStudents.length} Registered Student{unassignedStudents.length > 1 ? 's' : ''} Awaiting Team Assignment
                            </h4>
                            <p className="text-xs text-blue-800/80">
                                You can create a new team for them or add them directly to any existing team below.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                        <PlusCircle size={14} /> Create Team from Unassigned
                    </button>
                </div>
            )}

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
                            placeholder="Search by Team Name, Team ID, Student Name, Email, Reg No, or Problem Statement..."
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
                            onClick={() => setStatusFilter('needs_members')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                statusFilter === 'needs_members'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            Open Slots ({teamsNeedingMembers})
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
                    const canAddMembers = memberCount < 4

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

                                {/* Header Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* QUICK ADD STUDENT BUTTON ON TEAM CARD */}
                                    {canAddMembers && (
                                        <button
                                            onClick={() => handleOpenQuickAddStudent(team)}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                                            title="Add a student to this team"
                                        >
                                            <UserPlus size={14} /> + Add Student
                                        </button>
                                    )}

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
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                                <Users size={14} className="text-gray-400" />
                                                Team Members & Academic Profiles ({members.length}/4)
                                            </h4>
                                            {canAddMembers && (
                                                <button
                                                    onClick={() => handleOpenQuickAddStudent(team)}
                                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                                >
                                                    <Plus size={12} /> Add Student ({4 - memberCount} slot{4 - memberCount > 1 ? 's' : ''} left)
                                                </button>
                                            )}
                                        </div>
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
                                        <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center space-y-2">
                                            <p className="text-xs text-gray-500 font-medium">
                                                No students have joined or been assigned to this team yet.
                                            </p>
                                            <button
                                                onClick={() => handleOpenQuickAddStudent(team)}
                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                            >
                                                <UserPlus size={13} /> + Add Students to this Team
                                            </button>
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
                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-300 space-y-4">
                        <Search size={36} className="mx-auto text-gray-300" />
                        <div>
                            <h3 className="font-black text-gray-800 text-base">No teams matching your search or filters</h3>
                            <p className="text-xs text-gray-400 mt-1">Try adjusting search keywords or create a new team.</p>
                        </div>
                        <button
                            onClick={handleOpenCreateModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            <PlusCircle size={15} /> Create a New Team Now
                        </button>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* MODAL 1: CREATE NEW TEAM & ADD STUDENTS MODAL */}
            {/* ========================================================================= */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-8 animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
                                    <PlusCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">
                                        Create New Team & Add Students
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Register a team, assign a problem statement, and enroll up to 4 student participants.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Error / Success Notifications */}
                        {createModalError && (
                            <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2 shrink-0">
                                <AlertCircle size={16} className="shrink-0 text-red-600" />
                                <span>{createModalError}</span>
                            </div>
                        )}
                        {createModalSuccess && (
                            <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2 shrink-0">
                                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                                <span>{createModalSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateTeamSubmit} className="space-y-6 overflow-y-auto pr-1 flex-1">
                            
                            {/* SECTION 1: TEAM DETAILS */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                                    <Layers size={14} /> 1. Team Identification & Setup
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Team Name */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                            Team Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newTeamData.team_name}
                                            onChange={e => setNewTeamData({ ...newTeamData, team_name: e.target.value })}
                                            placeholder="e.g. Neural Ninjas, CyberForge"
                                            required
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-bold"
                                        />
                                    </div>

                                    {/* Team ID / Code */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                                                Team ID / Custom Code <span className="text-red-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setNewTeamData({ ...newTeamData, team_code: generateRandomCode() })}
                                                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Regenerate ID
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                value={newTeamData.team_code}
                                                onChange={e => setNewTeamData({ ...newTeamData, team_code: e.target.value.toUpperCase() })}
                                                placeholder="e.g. TEAM-01, HACK-101"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold text-sm uppercase tracking-wider"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Invite Code */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                                                Invite Code
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setNewTeamData({ ...newTeamData, invite_code: generateInviteCode() })}
                                                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Generate New
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={newTeamData.invite_code}
                                            onChange={e => setNewTeamData({ ...newTeamData, invite_code: e.target.value.toUpperCase() })}
                                            placeholder="e.g. 9FA2B"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold text-sm uppercase"
                                        />
                                    </div>

                                    {/* Problem Statement Selection */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                            Assign Problem Statement (Optional)
                                        </label>
                                        <select
                                            value={newTeamData.problem_id}
                                            onChange={e => setNewTeamData({ ...newTeamData, problem_id: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm font-semibold"
                                        >
                                            <option value="">-- Assign Later (Pending) --</option>
                                            {problemStatements.map(ps => (
                                                <option key={ps.id} value={ps.id}>
                                                    {ps.statement_code}: {ps.title} [{ps.domain}]
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: ADD STUDENTS & DESIGNATE LEADER */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                                            <Users size={14} /> 2. Add Students / Team Roster ({newTeamData.members.length}/4)
                                        </h4>
                                        <p className="text-xs text-gray-500">Pick from existing registered students or enter student email & profile.</p>
                                    </div>
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                        newTeamData.members.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {newTeamData.members.length} of 4 Added
                                    </span>
                                </div>

                                {/* Current Roster List */}
                                {newTeamData.members.length > 0 ? (
                                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                                            Added Team Members (Select Crown to change Leader):
                                        </p>
                                        <div className="space-y-2">
                                            {newTeamData.members.map((m, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                                        m.is_leader 
                                                            ? 'bg-blue-50/80 border-blue-300 shadow-2xs' 
                                                            : 'bg-white border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="truncate">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold text-xs text-gray-900 truncate">
                                                                    {m.name || m.email.split('@')[0]}
                                                                </span>
                                                                {m.is_leader && (
                                                                    <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                                                        <Crown size={10} /> Team Leader
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 truncate">
                                                                {m.email} {m.dept ? `• ${m.dept}` : ''} {m.reg_no ? `• Reg: ${m.reg_no}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {!m.is_leader && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetLeaderInCreateRoster(idx)}
                                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg cursor-pointer"
                                                            >
                                                                Set as Leader
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFromCreateRoster(idx)}
                                                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                                            title="Remove from roster"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-gray-500 text-center">
                                        No students added to the roster yet. Add at least 1 student or create an open team.
                                    </div>
                                )}

                                {/* Member Addition Panel (if < 4) */}
                                {newTeamData.members.length < 4 && (
                                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                        {/* Tabs for Add Mode */}
                                        <div className="flex border-b border-gray-200 bg-slate-50/70">
                                            <button
                                                type="button"
                                                onClick={() => setCreateMemberTab('unassigned')}
                                                className={`flex-1 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                                    createMemberTab === 'unassigned'
                                                        ? 'border-blue-600 text-blue-600 bg-white'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                Select Registered Student ({unassignedStudents.length} available)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCreateMemberTab('manual')}
                                                className={`flex-1 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                                    createMemberTab === 'manual'
                                                        ? 'border-blue-600 text-blue-600 bg-white'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                + Enter Student by Email / Profile
                                            </button>
                                        </div>

                                        <div className="p-4">
                                            {/* TAB 1: SELECT REGISTERED STUDENT */}
                                            {createMemberTab === 'unassigned' && (
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                        <input
                                                            type="text"
                                                            placeholder="Search available students by name, email, dept, reg no..."
                                                            value={createStudentSearch}
                                                            onChange={e => setCreateStudentSearch(e.target.value)}
                                                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>

                                                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                                        {filteredStudentsForCreate.map(student => {
                                                            const isAlreadyInRoster = newTeamData.members.some(
                                                                m => (student.id && m.user_id === student.id) || (m.email.toLowerCase() === student.email.toLowerCase())
                                                            )

                                                            return (
                                                                <div 
                                                                    key={student.id}
                                                                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-xs"
                                                                >
                                                                    <div className="truncate pr-2">
                                                                        <p className="font-bold text-gray-900 truncate">
                                                                            {student.name || 'Student'} <span className="text-gray-400 font-normal">({student.email})</span>
                                                                        </p>
                                                                        <p className="text-[10px] text-gray-500">
                                                                            {student.dept || 'No dept'} {student.reg_no ? `• ${student.reg_no}` : ''} {student.year ? `• ${student.year}` : ''}
                                                                        </p>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        disabled={isAlreadyInRoster}
                                                                        onClick={() => handleAddStudentToCreateRoster(student)}
                                                                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                                                                            isAlreadyInRoster
                                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                                                                        }`}
                                                                    >
                                                                        {isAlreadyInRoster ? 'Added' : '+ Add to Team'}
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}

                                                        {filteredStudentsForCreate.length === 0 && (
                                                            <div className="text-center py-6 text-gray-400 text-xs">
                                                                No unassigned students found matching search. You can enter student details manually in the next tab.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 2: MANUAL ENTRY */}
                                            {createMemberTab === 'manual' && (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                                Email Address <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="email"
                                                                value={createManualStudent.email}
                                                                onChange={e => setCreateManualStudent({ ...createManualStudent, email: e.target.value })}
                                                                placeholder="student@example.com"
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                                Full Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={createManualStudent.name}
                                                                onChange={e => setCreateManualStudent({ ...createManualStudent, name: e.target.value })}
                                                                placeholder="e.g. Alex Johnson"
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                                Registration / Roll No
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={createManualStudent.reg_no}
                                                                onChange={e => setCreateManualStudent({ ...createManualStudent, reg_no: e.target.value })}
                                                                placeholder="e.g. 21BCE1001"
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                                Department
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={createManualStudent.dept}
                                                                onChange={e => setCreateManualStudent({ ...createManualStudent, dept: e.target.value })}
                                                                placeholder="e.g. CSE, IT, ECE"
                                                                list="create-dept-options"
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <datalist id="create-dept-options">
                                                                {DEPT_OPTIONS.map(d => <option key={d} value={d} />)}
                                                            </datalist>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                                Section
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={createManualStudent.section}
                                                                onChange={e => setCreateManualStudent({ ...createManualStudent, section: e.target.value })}
                                                                placeholder="e.g. A, B"
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                                Academic Year
                                                            </label>
                                                            <select
                                                                value={createManualStudent.year}
                                                                onChange={e => setCreateManualStudent({ ...createManualStudent, year: e.target.value })}
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="">-- Select Year --</option>
                                                                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddManualStudentToCreateRoster}
                                                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                                                        >
                                                            <UserPlus size={13} /> Add to Team Roster
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex justify-end items-center gap-3 pt-5 border-t border-gray-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={creatingTeam}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {creatingTeam ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <PlusCircle size={14} />
                                    )}
                                    {creatingTeam ? 'Creating Team...' : `Create Team (${newTeamData.members.length} Member${newTeamData.members.length !== 1 ? 's' : ''})`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: QUICK ADD STUDENT TO EXISTING TEAM */}
            {/* ========================================================================= */}
            {quickAddTeam && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">
                                        Add Student to {quickAddTeam.team_name}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Team ID: <span className="font-mono font-bold text-gray-700">{quickAddTeam.team_code}</span> • Currently {(quickAddTeam.team_members || []).length}/4 members
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setQuickAddTeam(null)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {quickAddError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0 text-red-600" />
                                <span>{quickAddError}</span>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                type="button"
                                onClick={() => setQuickAddTab('unassigned')}
                                className={`flex-1 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                    quickAddTab === 'unassigned'
                                        ? 'border-emerald-600 text-emerald-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Registered Students ({unassignedStudents.length} available)
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickAddTab('manual')}
                                className={`flex-1 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                    quickAddTab === 'manual'
                                        ? 'border-emerald-600 text-emerald-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Enter Email & Profile
                            </button>
                        </div>

                        {/* Tab 1: Unassigned Registered Students */}
                        {quickAddTab === 'unassigned' && (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search available students by name, email, reg no..."
                                        value={quickAddSearch}
                                        onChange={e => setQuickAddSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>

                                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                    {filteredStudentsForQuickAdd.map(student => (
                                        <div 
                                            key={student.id}
                                            className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs"
                                        >
                                            <div className="truncate pr-2">
                                                <p className="font-bold text-gray-900 truncate">
                                                    {student.name || 'Student'} <span className="text-gray-400 font-normal">({student.email})</span>
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    {student.dept || 'No dept'} {student.reg_no ? `• Reg: ${student.reg_no}` : ''} {student.year ? `• ${student.year}` : ''}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={quickAddSaving}
                                                onClick={() => handleQuickAddExistingStudent(student)}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                                            >
                                                {quickAddSaving ? 'Adding...' : '+ Add to Team'}
                                            </button>
                                        </div>
                                    ))}

                                    {filteredStudentsForQuickAdd.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-xs">
                                            No available registered students found. Switch to manual entry tab to add by email.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Manual Student Details Form */}
                        {quickAddTab === 'manual' && (
                            <form onSubmit={handleQuickAddManualSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={quickAddManualStudent.email}
                                            onChange={e => setQuickAddManualStudent({ ...quickAddManualStudent, email: e.target.value })}
                                            placeholder="student@example.com"
                                            required
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={quickAddManualStudent.name}
                                            onChange={e => setQuickAddManualStudent({ ...quickAddManualStudent, name: e.target.value })}
                                            placeholder="e.g. Jane Doe"
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Registration / Roll No
                                        </label>
                                        <input
                                            type="text"
                                            value={quickAddManualStudent.reg_no}
                                            onChange={e => setQuickAddManualStudent({ ...quickAddManualStudent, reg_no: e.target.value })}
                                            placeholder="e.g. 21BCE2048"
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            value={quickAddManualStudent.dept}
                                            onChange={e => setQuickAddManualStudent({ ...quickAddManualStudent, dept: e.target.value })}
                                            placeholder="e.g. CSE, IT, AI/DS"
                                            list="quick-dept-options"
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <datalist id="quick-dept-options">
                                            {DEPT_OPTIONS.map(d => <option key={d} value={d} />)}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Section
                                        </label>
                                        <input
                                            type="text"
                                            value={quickAddManualStudent.section}
                                            onChange={e => setQuickAddManualStudent({ ...quickAddManualStudent, section: e.target.value })}
                                            placeholder="e.g. A, B"
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                            Academic Year
                                        </label>
                                        <select
                                            value={quickAddManualStudent.year}
                                            onChange={e => setQuickAddManualStudent({ ...quickAddManualStudent, year: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">-- Select Year --</option>
                                            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={quickAddManualStudent.set_as_leader}
                                            onChange={e => setQuickAddManualStudent({ ...quickAddManualStudent, set_as_leader: e.target.checked })}
                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>Set as Team Leader</span>
                                    </label>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setQuickAddTeam(null)}
                                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={quickAddSaving}
                                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            {quickAddSaving ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
                                            {quickAddSaving ? 'Adding Student...' : 'Add Student to Team'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: FULL EDIT TEAM & PROFILES MODAL */}
            {/* ========================================================================= */}
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
                                    + Add Member ({4 - editFormData.members.length} slot{4 - editFormData.members.length > 1 ? 's' : ''} left)
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
                                <div className="space-y-4">
                                    <div className="flex border-b border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setEditAddStudentTab('unassigned')}
                                            className={`flex-1 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                                editAddStudentTab === 'unassigned'
                                                    ? 'border-blue-600 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            Pick Registered Student ({unassignedStudents.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditAddStudentTab('manual')}
                                            className={`flex-1 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                                                editAddStudentTab === 'manual'
                                                    ? 'border-blue-600 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            Enter Email & Profile
                                        </button>
                                    </div>

                                    {editAddStudentTab === 'unassigned' && (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Search available students..."
                                                    value={editStudentSearch}
                                                    onChange={e => setEditStudentSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                                                {filteredStudentsForEdit.map(student => (
                                                    <div 
                                                        key={student.id}
                                                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-xs"
                                                    >
                                                        <div className="truncate pr-2">
                                                            <p className="font-bold text-gray-900 truncate">
                                                                {student.name || 'Student'} <span className="text-gray-400 font-normal">({student.email})</span>
                                                            </p>
                                                            <p className="text-[11px] text-gray-500">
                                                                {student.dept || 'No dept'} {student.reg_no ? `• Reg: ${student.reg_no}` : ''}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={savingTeam}
                                                            onClick={() => handleAddExistingStudentInEditModal(student)}
                                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                                                        >
                                                            + Add to Team
                                                        </button>
                                                    </div>
                                                ))}

                                                {filteredStudentsForEdit.length === 0 && (
                                                    <div className="text-center py-6 text-gray-400 text-xs">
                                                        No available registered students found.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {editAddStudentTab === 'manual' && (
                                        <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                        Participant Email Address <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={editFormData.add_member_manual.email}
                                                        onChange={e => setEditFormData({
                                                            ...editFormData,
                                                            add_member_manual: { ...editFormData.add_member_manual, email: e.target.value }
                                                        })}
                                                        placeholder="participant@example.com"
                                                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editFormData.add_member_manual.name}
                                                        onChange={e => setEditFormData({
                                                            ...editFormData,
                                                            add_member_manual: { ...editFormData.add_member_manual, name: e.target.value }
                                                        })}
                                                        placeholder="e.g. John Doe"
                                                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                        Registration / Roll No
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editFormData.add_member_manual.reg_no}
                                                        onChange={e => setEditFormData({
                                                            ...editFormData,
                                                            add_member_manual: { ...editFormData.add_member_manual, reg_no: e.target.value }
                                                        })}
                                                        placeholder="e.g. 21BCE1001"
                                                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                        Department
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editFormData.add_member_manual.dept}
                                                        onChange={e => setEditFormData({
                                                            ...editFormData,
                                                            add_member_manual: { ...editFormData.add_member_manual, dept: e.target.value }
                                                        })}
                                                        placeholder="e.g. CSE, IT"
                                                        list="edit-dept-list"
                                                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <datalist id="edit-dept-list">
                                                        {DEPT_OPTIONS.map(d => <option key={d} value={d} />)}
                                                    </datalist>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-gray-400">
                                                Clicking "Save Team & Profile Changes" below will add this student to the team.
                                            </p>
                                        </div>
                                    )}
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

            {/* ========================================================================= */}
            {/* MODAL 4: QUICK PROBLEM STATEMENT CHANGER */}
            {/* ========================================================================= */}
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
