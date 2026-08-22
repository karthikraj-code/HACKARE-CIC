'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Trash2, Plus, UserPlus, GraduationCap } from 'lucide-react'

export default function OrganizerSettingsPage() {
    const [organizers, setOrganizers] = useState<any[]>([])
    const [judges, setJudges] = useState<any[]>([])
    const [newEmail, setNewEmail] = useState('')
    const [selectedRole, setSelectedRole] = useState<'organizer' | 'judge'>('judge')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState('')

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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading access list...</div>

    return (
        <div className="max-w-4xl space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ShieldAlert className="text-blue-600" /> Platform Access Control
                </h2>
                <p className="text-gray-600">
                    Manage which email addresses are automatically granted Organizer or Judge rights upon logging in with Google.
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Google Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                placeholder="colleague@gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
                            <select
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                            >
                                <option value="judge">Judge</option>
                                <option value="organizer">Organizer</option>
                            </select>
                        </div>
                        {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
                        <button
                            type="submit"
                            disabled={adding}
                            className="w-full bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            <Plus size={18} /> {adding ? 'Adding...' : 'Grant Access'}
                        </button>
                    </form>
                </div>

                {/* LISTS */}
                <div className="md:col-span-2 space-y-6">

                    {/* JUDGES */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><GraduationCap className="text-sky-600" size={18} /> Allowed Judges</h3>
                            <span className="text-sm bg-sky-50 text-sky-600 px-2 py-0.5 rounded font-medium">{judges.length} Authorized</span>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                            {judges.map((e) => (
                                <li key={e.email} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900">{e.email}</p>
                                        <p className="text-xs text-gray-500">Added: {new Date(e.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(e.email, 'judge')}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        title="Revoke access"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </li>
                            ))}
                            {judges.length === 0 && (
                                <li className="px-6 py-8 text-center text-gray-500">
                                    No judges added.
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* ORGANIZERS */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><ShieldAlert className="text-blue-600" size={18} /> Allowed Organizers</h3>
                            <span className="text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{organizers.length} Authorized</span>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                            {organizers.map((e) => (
                                <li key={e.email} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900">{e.email}</p>
                                        <p className="text-xs text-gray-500">Added: {new Date(e.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(e.email, 'organizer')}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        title="Revoke access"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </li>
                            ))}
                            {organizers.length === 0 && (
                                <li className="px-6 py-8 text-center text-gray-500">
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
