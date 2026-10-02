'use client'

import { useState, useEffect, useMemo } from 'react'
import { Users, Search, Building2, Crown, UserCheck, UserX, Mail, Copy, Check, RefreshCw } from 'lucide-react'

interface Participant {
    id: string
    name: string
    email: string
    reg_no?: string | null
    dept?: string | null
    section?: string | null
    year?: string | null
    is_assigned: boolean
    team?: {
        team_name: string
        team_code: string
    } | null
    is_leader: boolean
}

export default function VolunteerParticipantsPage() {
    const [participants, setParticipants] = useState<Participant[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

    useEffect(() => {
        fetchParticipants()
    }, [])

    const fetchParticipants = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/organizer/students')
            const data = await res.json()
            if (data.students) setParticipants(data.students)
        } catch (e) {
            console.error('Error loading participants:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
        setCopiedEmail(email)
        setTimeout(() => setCopiedEmail(null), 2000)
    }

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return participants
        const q = searchQuery.toLowerCase().trim()
        return participants.filter(p => 
            (p.name || '').toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q) ||
            (p.reg_no || '').toLowerCase().includes(q) ||
            (p.dept || '').toLowerCase().includes(q) ||
            (p.team?.team_name || '').toLowerCase().includes(q) ||
            (p.team?.team_code || '').toLowerCase().includes(q)
        )
    }, [participants, searchQuery])

    return (
        <div className="space-y-6 pb-12">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Participant Roster Reference</h1>
                    <p className="text-xs text-gray-500">Quickly look up participants, team assignments, and departments.</p>
                </div>
                <div className="relative max-w-sm w-full">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search student or team..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center">
                        <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium">Loading roster...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3.5 px-4">Student</th>
                                    <th className="py-3.5 px-4">Reg No</th>
                                    <th className="py-3.5 px-4">Team</th>
                                    <th className="py-3.5 px-4">Department & Year</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                <span>{student.name || 'Participant'}</span>
                                                {student.is_leader && (
                                                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-purple-200">
                                                        Leader
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                <span>{student.email}</span>
                                                <button onClick={() => handleCopyEmail(student.email)} className="text-gray-400 hover:text-gray-600">
                                                    {copiedEmail === student.email ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                            {student.reg_no || <span className="text-gray-400 italic">—</span>}
                                        </td>
                                        <td className="py-3 px-4">
                                            {student.is_assigned && student.team ? (
                                                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {student.team.team_name} ({student.team.team_code})
                                                </span>
                                            ) : (
                                                <span className="text-amber-700 text-[11px] font-medium">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">
                                            <div>{student.dept || 'General Track'}</div>
                                            <div className="text-[11px] text-gray-400">{student.year || ''} {student.section && `• Sec ${student.section}`}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
