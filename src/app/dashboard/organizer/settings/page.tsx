'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Trash2, Plus, UserPlus, GraduationCap, HeartHandshake, Database, Copy, Check } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'

export default function OrganizerSettingsPage() {
    const [organizers, setOrganizers] = useState<any[]>([])
    const [judges, setJudges] = useState<any[]>([])
    const [volunteers, setVolunteers] = useState<any[]>([])
    const [newEmail, setNewEmail] = useState('')
    const [selectedRole, setSelectedRole] = useState<'organizer' | 'judge' | 'volunteer'>('volunteer')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState('')
    const [copiedSql, setCopiedSql] = useState(false)

    useEffect(() => {
        fetchEmails()
    }, [])

    const fetchEmails = async () => {
        try {
            const res = await fetch('/api/organizer/invites')
            if (res.ok) {
                const data = await res.json()
                setOrganizers(data.organizers || [])
                setJudges(data.judges || [])
                setVolunteers(data.volunteers || [])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail.trim()) return

        setAdding(true)
        setError('')
        try {
            const res = await fetch('/api/organizer/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, role: selectedRole })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to add email')
            }

            setNewEmail('')
            fetchEmails()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAdding(false)
        }
    }

    const handleRemove = async (email: string, role: string) => {
        if (!confirm(`Are you sure you want to revoke ${role} access for ${email}?`)) return

        try {
            const res = await fetch('/api/organizer/invites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            })
            if (!res.ok) throw new Error('Failed to remove')
            fetchEmails()
        } catch (err) {
            alert(`Failed to remove ${role} access`)
        }
    }

    const sqlSetupScript = `-- Run this in Supabase SQL Editor (optional, dual-mode persistent fallback is active)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'volunteer';

CREATE TABLE IF NOT EXISTS public.volunteer_emails (
    email TEXT PRIMARY KEY,
    added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slot TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present',
    marked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(session_id, user_id)
);`

    const handleCopySql = () => {
        navigator.clipboard.writeText(sqlSetupScript)
        setCopiedSql(true)
        setTimeout(() => setCopiedSql(false), 2500)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading access list...</div>

    return (
        <div className="max-w-5xl space-y-6 pb-12">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ShieldAlert className="text-blue-600" /> Platform Access Control
                </h2>
                <p className="text-gray-600 text-sm">
                    Manage which email addresses are automatically granted Organizer, Judge, or Volunteer rights upon logging in with Google.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ADD ACCESS */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-600" /> Grant Access
                    </h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                                Google Email Address
                            </label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                placeholder="goole@gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                                Role Type
                            </label>
                            <select
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value as any)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white font-medium"
                            >
                                <option value="volunteer">Volunteer (Attendance Tracking)</option>
                                <option value="judge">Judge (Round Evaluation)</option>
                                <option value="organizer">Organizer (Full Admin)</option>
                            </select>
                        </div>
                        {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">{error}</p>}
                        <button
                            type="submit"
                            disabled={adding}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2"
                        >
                            <Plus size={16} /> {adding ? 'Adding...' : 'Grant Access'}
                        </button>
                    </form>
                </div>

                {/* LISTS */}
                <div className="md:col-span-2 space-y-6">

                    {/* VOLUNTEERS */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50/60 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <HeartHandshake className="text-emerald-600" size={18} />
                                Allowed Volunteers (Attendance Panel)
                            </h3>
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                                {volunteers.length} Authorized
                            </span>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto text-xs">
                            {volunteers.map((e) => (
                                <li key={e.email} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-900">{e.email}</p>
                                        <p suppressHydrationWarning className="text-[11px] text-gray-500">Added: {formatDate(e.created_at)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(e.email, 'volunteer')}
                                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                        title="Revoke volunteer access"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                            {volunteers.length === 0 && (
                                <li className="px-6 py-6 text-center text-gray-400 font-medium">
                                    No volunteers added yet. Add volunteer emails above to grant attendance tracking access.
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* JUDGES */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-sky-50/60 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <GraduationCap className="text-sky-600" size={18} />
                                Allowed Judges
                            </h3>
                            <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-bold">
                                {judges.length} Authorized
                            </span>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto text-xs">
                            {judges.map((e) => (
                                <li key={e.email} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-900">{e.email}</p>
                                        <p suppressHydrationWarning className="text-[11px] text-gray-500">Added: {formatDate(e.created_at)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(e.email, 'judge')}
                                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                        title="Revoke judge access"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                            {judges.length === 0 && (
                                <li className="px-6 py-6 text-center text-gray-400 font-medium">
                                    No judges added.
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* ORGANIZERS */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-purple-50/60 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <ShieldAlert className="text-purple-600" size={18} />
                                Allowed Organizers
                            </h3>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
                                {organizers.length} Authorized
                            </span>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto text-xs">
                            {organizers.map((e) => (
                                <li key={e.email} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-900">{e.email}</p>
                                        <p suppressHydrationWarning className="text-[11px] text-gray-500">Added: {formatDate(e.created_at)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(e.email, 'organizer')}
                                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                        title="Revoke organizer access"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                            {organizers.length === 0 && (
                                <li className="px-6 py-6 text-center text-gray-400 font-medium">
                                    No extra organizers added.
                                </li>
                            )}
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    )
}
