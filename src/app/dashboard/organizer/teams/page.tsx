'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserPlus, UserMinus, ShieldCheck, AlertCircle, Lightbulb } from 'lucide-react'

export default function ManageTeamsPage() {
    const supabase = createClient()

    const [teams, setTeams] = useState<any[]>([])
    const [judges, setJudges] = useState<any[]>([])
    const [whitelistedEmails, setWhitelistedEmails] = useState<string[]>([])
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null) // Contains teamId-judgeId

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [
                { data: teamsData }, 
                { data: judgesData }, 
                { data: assignsData },
                { data: whitelistedData }
            ] = await Promise.all([
                supabase.from('teams').select(`
                    id, 
                    team_name, 
                    team_code,
                    team_members(
                        user_id,
                        users(name, email)
                    ),
                    problem_selections(
                        problem_statements(
                            statement_code,
                            title,
                            domain
                        )
                    )
                `).order('created_at'),

                supabase.from('users').select('id, name, email').eq('role', 'judge'),
                supabase.from('judge_assignments').select('*'),
                supabase.from('judge_emails').select('email')
            ])

            setTeams(teamsData || [])
            setJudges(judgesData || [])
            setAssignments(assignsData || [])
            setWhitelistedEmails((whitelistedData || []).map(d => d.email.toLowerCase()))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-medium text-gray-600">Loading Teams and Judges...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Manage Teams & Judges</h2>
                <p className="text-gray-600 text-sm">
                    Assign registered teams to judges for Round 1 (PPT) and Round 2 (Code & Demo) evaluations. Teams have a max of 4 members and 1 locked problem statement.
                </p>
            </div>

            {judges.length === 0 && (
                <div className="bg-sky-50 text-sky-800 p-4 rounded-xl flex items-start gap-3 border border-sky-200">
                    <ShieldCheck className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold">No Registered Judges Found</p>
                        <p className="text-xs">You need to have users registered as 'judge' to assign them. Please whitelist or create judge accounts.</p>
                    </div>
                </div>
            )}

            {/* Bulk Assignment Panel */}
            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm bg-gradient-to-r from-blue-50/50 to-white">
                <h3 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <UserPlus size={18} />
                    Bulk Judge Assignment
                </h3>
                {judges.length > 0 ? (
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[240px]">
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Select Judge for Bulk Assignment</label>
                            <select 
                                id="bulk-judge-select"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                defaultValue=""
                            >
                                <option value="" disabled>-- Choose a judge --</option>
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
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md disabled:bg-gray-400 flex items-center gap-2"
                        >
                            {processing?.startsWith('bulk') ? 'Processing...' : <><UserPlus size={16} /> Assign All Teams</>}
                        </button>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 italic">
                        Bulk assignment will be available once at least one judge has registered.
                    </p>
                )}
            </div>

            {/* Teams List */}
            <div className="grid grid-cols-1 gap-6">
                {teams.map(team => {
                    const sel = team.problem_selections?.[0] || team.problem_selections
                    const ps = sel?.problem_statements

                    return (
                        <div key={team.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-gray-100 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-extrabold text-xl text-white">{team.team_name}</h3>
                                        {team.team_code && (
                                            <span className="text-xs font-mono bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-lg font-bold">
                                                ID: {team.team_code}
                                            </span>
                                        )}
                                        <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                                            {team.team_members?.length || 0} / 4 Members
                                        </span>
                                    </div>

                                    {ps ? (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-blue-300 font-semibold">
                                            <Lightbulb size={14} className="text-amber-400" />
                                            <span>{ps.statement_code}: {ps.title}</span>
                                            <span className="bg-white/10 text-white px-2 py-0.2 rounded text-[10px] uppercase tracking-wider">{ps.domain}</span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-300 mt-1 font-semibold">Problem Statement: Pending Selection</p>
                                    )}
                                </div>

                                <a href="/dashboard/organizer/submissions" className="text-xs text-blue-300 hover:text-white font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 transition-colors">
                                    View Submissions &rarr;
                                </a>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6">
                                {/* Members */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Team Members</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {team.team_members?.map((member: any) => (
                                            <div key={member.user_id} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium">
                                                <span className="font-bold text-gray-900">{member.users?.name || 'Unknown'}</span>
                                                <span className="text-gray-400 ml-1.5">({member.users?.email})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Assign Judges */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Assigned Judges</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {judges.map(judge => {
                                            const assigned = isAssigned(team.id, judge.id)
                                            const key = `${team.id}-${judge.id}`
                                            const isProcessing = processing === key

                                            return (
                                                <div key={judge.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                                    assigned ? 'bg-blue-50/60 border-blue-200' : 'bg-white border-gray-200'
                                                }`}>
                                                    <div className="pr-2 truncate">
                                                        <p className="font-bold text-xs text-gray-900 truncate">{judge.name}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{judge.email}</p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleAssignment(team.id, judge.id, assigned ? 'remove' : 'assign')}
                                                        disabled={isProcessing}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
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

                {teams.length === 0 && (
                    <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                        No teams have registered yet.
                    </div>
                )}
            </div>
        </div>
    )
}
