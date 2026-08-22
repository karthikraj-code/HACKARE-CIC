'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'

export default function JoinTeamPage() {
    const [inviteCode, setInviteCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/team/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invite_code: inviteCode.trim().toUpperCase() })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to join team')
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
        <div className="max-w-xl mx-auto space-y-6">
            <Link href="/dashboard/participant/team" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Team
            </Link>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 border border-gray-200">
                        <UserPlus size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Join a Team</h2>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                            Invite Code
                        </label>
                        <input
                            id="inviteCode"
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="e.g., AXR72"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono tracking-widest text-lg uppercase"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            Ask your team leader for the 5-character invite code. A team can have a maximum of 4 members.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-md border border-slate-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !inviteCode.trim()}
                        className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? 'Joining...' : 'Join Team'}
                    </button>
                </form>
            </div>
        </div>
    )
}
