'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Shield, Sparkles, Hash } from 'lucide-react'

export default function CreateTeamPage() {
    const [teamName, setTeamName] = useState('')
    const [teamCode, setTeamCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!teamName.trim()) {
            setError('Please enter a team name')
            return
        }
        if (!teamCode.trim()) {
            setError('Please enter a Team ID')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/team/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    team_name: teamName.trim(),
                    team_code: teamCode.trim().toUpperCase()
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create team')
            }

            router.push('/dashboard/participant/team')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-12">
            <Link href="/dashboard/participant/team" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Team
            </Link>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                
                <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                        <Users size={26} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Create a New Team</h2>
                        <p className="text-xs text-gray-500 font-medium">Form your team to participate in HACKARE</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-5">
                    {/* Team ID Input */}
                    <div>
                        <label htmlFor="teamCode" className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                            Team ID <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                id="teamCode"
                                type="text"
                                value={teamCode}
                                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                                placeholder="E.g., TEAM-01, T101, HACK-42"
                                required
                                maxLength={20}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono font-bold text-sm tracking-wide transition-all uppercase"
                            />
                        </div>
                        <p className="mt-1.5 text-[11px] text-gray-500 font-medium">
                            A unique identifier for your team in the competition.
                        </p>
                    </div>

                    {/* Team Name Input */}
                    <div>
                        <label htmlFor="teamName" className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                            Team Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="teamName"
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="E.g., Neural Knights, CyberForge"
                            required
                            maxLength={50}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-semibold transition-all"
                        />
                    </div>

                    {/* Notice */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Shield size={14} className="text-blue-600" /> Team Leader Role:
                        </p>
                        <p>
                            As the creator, you will be the <strong>Team Leader</strong>. You will receive an invite code to add up to 3 teammates (4 members total) and lock your team&apos;s problem statement.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold animate-in fade-in">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !teamName.trim() || !teamCode.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Sparkles size={16} />
                        {loading ? 'Creating Team...' : 'Create Team'}
                    </button>
                </form>
            </div>
        </div>
    )
}
