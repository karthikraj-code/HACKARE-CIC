'use client'

import { useState, useEffect } from 'react'
import { getSession } from 'next-auth/react'
import Link from 'next/link'
import { 
    UserCircle, 
    Mail, 
    Hash, 
    Building2, 
    GraduationCap, 
    Layers, 
    Users, 
    Save, 
    CheckCircle2, 
    AlertCircle, 
    Copy, 
    Check, 
    ArrowRight,
    Sparkles,
    Shield
} from 'lucide-react'

export default function ParticipantProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [copiedTeamId, setCopiedTeamId] = useState(false)

    const [user, setUser] = useState<any>(null)
    const [team, setTeam] = useState<any>(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        reg_no: '',
        dept: '',
        section: '',
        year: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/user/profile')
            const data = await res.json()

            if (data.success) {
                setUser(data.user)
                setTeam(data.team)
                setFormData({
                    name: data.user.name || '',
                    email: data.user.email || '',
                    reg_no: data.user.reg_no || '',
                    dept: data.user.dept || '',
                    section: data.user.section || '',
                    year: data.user.year || ''
                })
            }
        } catch (err) {
            console.error('Failed to load profile:', err)
            setError('Failed to load profile details.')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        setError('')

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    reg_no: formData.reg_no,
                    dept: formData.dept,
                    section: formData.section,
                    year: formData.year
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile')
            }

            setMessage('Profile updated successfully!')
            setUser(data.user)
            setTimeout(() => setMessage(''), 4000)
        } catch (err: any) {
            setError(err.message || 'Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const handleCopyTeamId = () => {
        const idToCopy = team?.team_code || team?.id
        if (!idToCopy) return
        navigator.clipboard.writeText(idToCopy)
        setCopiedTeamId(true)
        setTimeout(() => setCopiedTeamId(false), 2000)
    }


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-medium text-gray-600">Loading Profile Details...</p>
            </div>
        )
    }

    // Filter out the current user to get teammates only
    const teammates = team?.team_members
        ?.map((m: any) => m.users)
        ?.filter((u: any) => u && u.id !== user?.id) || []

    const isProfileComplete = Boolean(formData.reg_no && formData.dept && formData.section && formData.year)

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-16">
            
            {/* Header Banner */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span className="bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5 mb-2">
                            <Sparkles size={13} /> Participant Profile
                        </span>
                        <h1 className="text-3xl font-black text-gray-900">My Profile & Academic Details</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Keep your academic registration details updated and view your assigned team information.
                        </p>
                    </div>

                    {!isProfileComplete && (
                        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2 shrink-0">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <span>Action Required: Fill academic details</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Success & Error Notifications */}
            {message && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-3 text-sm font-semibold animate-in fade-in">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 text-sm font-semibold animate-in fade-in">
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Academic & Personal Form */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <GraduationCap size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">Academic & Personal Info</h2>
                                <p className="text-xs text-gray-500">Provide your college registration number, department, section, and year.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold"
                                />
                            </div>

                            {/* Email (Read Only) */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Google Email (Primary Account)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        disabled
                                        value={formData.email}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Registration Number */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Registration Number (Reg No) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.reg_no}
                                        onChange={e => setFormData({ ...formData, reg_no: e.target.value })}
                                        placeholder="e.g. 21BCE1024 / RA2111003010..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono font-bold"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">This will be visible to organizers and teammates.</p>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Department / Branch <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.dept}
                                        onChange={e => setFormData({ ...formData, dept: e.target.value })}
                                        placeholder="e.g. Computer Science, AI & DS, IT, ECE"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Section & Year in 2 Columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Section <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.section}
                                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                                            placeholder="e.g. A, B, C, CSE-1"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Year of Study <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold bg-white"
                                    >
                                        <option value="">Select Year...</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer mt-2"
                            >
                                <Save size={18} />
                                {saving ? 'Saving Details...' : 'Save Profile Details'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Team Information */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                <Users size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">Team Information</h2>
                                <p className="text-xs text-gray-500">Your registered team and teammates details.</p>
                            </div>
                        </div>

                        {team ? (
                            <div className="space-y-6">
                                
                                {/* Team Name Card */}
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                                        Team Name
                                    </span>
                                    <h3 className="text-2xl font-black text-gray-900">{team.team_name}</h3>
                                </div>

                                {/* Team ID with Copy Button */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            Team ID
                                        </span>
                                        <button
                                            onClick={handleCopyTeamId}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                                        >
                                            {copiedTeamId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                            {copiedTeamId ? 'Copied' : 'Copy ID'}
                                        </button>
                                    </div>
                                    <p className="font-mono text-sm text-slate-800 font-black break-all select-all bg-white px-3 py-2 rounded-lg border border-slate-200">
                                        {team.team_code || team.id}
                                    </p>

                                </div>

                                {/* Teammates List (Excluding Current User) */}
                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                                            Teammates ({teammates.length})
                                        </h4>
                                        <span className="text-[10px] text-gray-400 font-semibold">Excludes yourself</span>
                                    </div>

                                    {teammates.length > 0 ? (
                                        <div className="space-y-2.5">
                                            {teammates.map((teammate: any) => (
                                                <div
                                                    key={teammate.id}
                                                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-3 hover:border-blue-200 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                            {teammate.name?.charAt(0) || 'T'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                                                {teammate.name}
                                                            </p>
                                                            <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                                                                Reg No: {teammate.reg_no || <span className="text-gray-400 font-normal italic">Not updated</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                                            <Users size={32} className="mx-auto text-slate-300" />
                                            <p className="text-xs font-bold text-slate-600">No other teammates joined yet</p>
                                            <p className="text-[11px] text-slate-400">
                                                Share your invite code <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border">{team.invite_code}</span> with your teammates.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href="/dashboard/participant/team"
                                        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white py-3 rounded-xl font-bold text-xs transition-colors shadow-sm"
                                    >
                                        Manage Team & Members <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-4">
                                <Users size={40} className="mx-auto text-slate-300" />
                                <div>
                                    <h4 className="text-base font-bold text-gray-900">Not In A Team Yet</h4>
                                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                                        Form a team of up to 4 members to compete in HACKARE.
                                    </p>

                                </div>
                                <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                                    <Link
                                        href="/dashboard/participant/team/create"
                                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"
                                    >
                                        Create Team
                                    </Link>
                                    <Link
                                        href="/dashboard/participant/team/join"
                                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"
                                    >
                                        Join with Code
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
