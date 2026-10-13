'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
    CheckCircle2, 
    XCircle, 
    ShieldCheck, 
    Award, 
    Search, 
    Building2, 
    GraduationCap, 
    Hash, 
    Calendar, 
    ExternalLink, 
    QrCode, 
    Sparkles, 
    Check, 
    Copy,
    FileCheck,
    AlertTriangle,
    ShieldAlert
} from 'lucide-react'

function VerificationContent() {
    const searchParams = useSearchParams()
    const queryId = searchParams.get('id') || searchParams.get('code') || ''

    const [certificateId, setCertificateId] = useState(queryId)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (queryId) {
            verifyCode(queryId)
        }
    }, [queryId])

    const verifyCode = async (codeToVerify: string) => {
        if (!codeToVerify.trim()) return
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            // Forward URL query parameters if present (for fallback decoding)
            const forwardParams = searchParams.toString()
            const res = await fetch(`/api/verify-certificate?${forwardParams ? forwardParams : `id=${encodeURIComponent(codeToVerify.trim())}`}`)
            const data = await res.json()

            if (res.ok && data.verified) {
                setResult(data.certificate)
            } else {
                setError(data.error || 'This certificate could not be authenticated in the official registry.')
            }
        } catch (err: any) {
            console.error('Verification error:', err)
            setError('Unable to connect to verification server. Please check network connection.')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (certificateId.trim()) {
            verifyCode(certificateId.trim())
        }
    }

    const copyCertificateId = () => {
        if (result?.certificate_code) {
            navigator.clipboard.writeText(result.certificate_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
            {/* Header */}
            <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                            H
                        </div>
                        <div>
                            <span className="font-extrabold text-lg tracking-tight text-white">HACKARE</span>
                            <span className="text-emerald-400 text-xs font-semibold block uppercase tracking-widest -mt-1">Credential Registry</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span>Tamper-Proof Verification</span>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
                {/* Search Bar for manual lookup */}
                <div className="mb-8">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={certificateId}
                            onChange={(e) => setCertificateId(e.target.value)}
                            placeholder="Enter Unique Certificate ID (e.g. HC26-88A1-92B3)..."
                            className="w-full pl-11 pr-28 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                        />
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <button
                            type="submit"
                            disabled={loading || !certificateId.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
                        >
                            {loading ? 'Checking...' : 'Verify'}
                        </button>
                    </form>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                            <ShieldCheck size={32} className="animate-spin" />
                        </div>
                        <h2 className="text-lg font-bold text-white mb-1">Authenticating Credential...</h2>
                        <p className="text-xs text-slate-400 font-mono">Querying cryptographic records for {certificateId}</p>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="bg-rose-950/30 border border-rose-800/60 rounded-3xl p-8 sm:p-10 text-center backdrop-blur-xl shadow-xl shadow-rose-950/20">
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                            <XCircle size={36} />
                        </div>
                        <h2 className="text-xl font-bold text-rose-200 mb-2">Verification Failed</h2>
                        <p className="text-sm text-rose-300/80 max-w-md mx-auto mb-6">
                            {error}
                        </p>
                        <p className="text-xs text-slate-400">
                            Please verify that the Certificate ID or QR code was issued directly by the HACKARE hackathon organizing committee.
                        </p>
                    </div>
                )}

                {/* Success Verification Card */}
                {!loading && result && (() => {
                    const isNotEligible = result.category === 'Not Eligible' || result.eligible === false || result.is_not_eligible === true

                    return (
                        <div className={`relative rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden border ${
                            isNotEligible
                                ? 'bg-gradient-to-b from-slate-900/95 via-rose-950/20 to-slate-950/95 border-rose-500/50 shadow-rose-950/40'
                                : 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-emerald-500/30 shadow-emerald-950/30'
                        }`}>
                            {/* Glow orb */}
                            <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
                                isNotEligible ? 'bg-rose-500/15' : 'bg-emerald-500/10'
                            }`} />
                            <div className={`absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
                                isNotEligible ? 'bg-rose-600/10' : 'bg-teal-500/10'
                            }`} />

                            {/* Top Verified Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center shadow-lg ${
                                        isNotEligible
                                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-500/25'
                                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
                                    }`}>
                                        {isNotEligible ? <AlertTriangle size={30} /> : <CheckCircle2 size={32} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${
                                                isNotEligible ? 'text-rose-400' : 'text-emerald-400'
                                            }`}>
                                                {isNotEligible ? 'Institutional Record' : 'Official Credential'}
                                            </span>
                                            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                                                isNotEligible ? 'bg-rose-400' : 'bg-emerald-400'
                                            }`} />
                                        </div>
                                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                            <span>Verified</span>
                                            {isNotEligible && <span className="text-rose-400">• NOT ELIGIBLE</span>}
                                        </h1>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Award / Tier Distinction Badge */}
                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase border flex items-center gap-1.5 ${
                                        (result.certificate_type || '').includes('Winner 1') || (result.certificate_type || '').includes('1st')
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                                            : (result.certificate_type || '').includes('Winner 2') || (result.certificate_type || '').includes('2nd')
                                            ? 'bg-slate-300/20 text-slate-200 border-slate-300/40 shadow-lg shadow-slate-300/10'
                                            : (result.certificate_type || '').includes('Winner 3') || (result.certificate_type || '').includes('3rd')
                                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-lg shadow-orange-500/10'
                                            : (result.certificate_type || '').toLowerCase().includes('winner')
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                                            : (result.certificate_type || '').includes('Special')
                                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    }`}>
                                        <span>
                                            {(result.certificate_type || '').includes('Winner 1') || (result.certificate_type || '').includes('1st') ? '🥇' :
                                             (result.certificate_type || '').includes('Winner 2') || (result.certificate_type || '').includes('2nd') ? '🥈' :
                                             (result.certificate_type || '').includes('Winner 3') || (result.certificate_type || '').includes('3rd') ? '🥉' :
                                             (result.certificate_type || '').toLowerCase().includes('winner') ? '🏆' :
                                             (result.certificate_type || '').includes('Special') ? '⭐' : '🎖️'}
                                        </span>
                                        <span>{result.certificate_type || 'Participation'}</span>
                                    </span>

                                    {/* Category Badge */}
                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase border ${
                                        isNotEligible
                                            ? 'bg-rose-500/25 text-rose-200 border-rose-500/50 shadow-md shadow-rose-500/20 font-black flex items-center gap-1.5'
                                            : result.category === 'EE Credit' 
                                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                    }`}>
                                        {isNotEligible ? (
                                            <>
                                                <span>🚫</span>
                                                <span>NOT ELIGIBLE</span>
                                            </>
                                        ) : (
                                            `Category: ${result.category || 'Group 3'}`
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Prominent Eligibility Callout Banner for NOT ELIGIBLE participants */}
                            {isNotEligible && (
                                <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3.5 text-rose-200 shadow-inner">
                                    <AlertTriangle size={24} className="text-rose-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-rose-100 uppercase tracking-wide flex items-center gap-2">
                                            <span>Institutional Status: Marked Not Eligible</span>
                                        </h3>
                                        <p className="text-xs text-rose-300 leading-relaxed">
                                            This participant was enrolled and participated in HACKARE. However, official institutional credit and competition eligibility are officially marked as <strong className="text-white underline">NOT ELIGIBLE</strong> in the database registry.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Certificate Recipient Hero */}
                            <div className="my-8 text-center sm:text-left bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
                                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Awarded To</span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
                                    {result.name}
                                </h2>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg font-mono font-semibold">
                                        Reg No: {result.reg_no}
                                    </span>
                                    {result.dept && (
                                        <span className="bg-slate-800/90 text-slate-300 px-3 py-1 rounded-lg">
                                            {result.dept}
                                        </span>
                                    )}
                                    {isNotEligible && (
                                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-lg font-bold">
                                            ● Not Eligible for Academic Credit
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Verified Credential Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                                {/* Department */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-slate-800 text-teal-400">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Department</span>
                                        <span className="text-sm font-semibold text-white">{result.dept || 'General Engineering'}</span>
                                    </div>
                                </div>

                                {/* Year & Section */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400">
                                        <GraduationCap size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Academic Cohort</span>
                                        <span className="text-sm font-semibold text-white">
                                            {result.year ? `${result.year}` : 'Active'} 
                                            {result.section && ` • Section ${result.section}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Category Distinction */}
                                <div className={`border rounded-2xl p-4 flex items-start gap-3 ${
                                    isNotEligible ? 'bg-rose-950/30 border-rose-800/60' : 'bg-slate-900/60 border-slate-800/80'
                                }`}>
                                    <div className={`p-2.5 rounded-xl ${
                                        isNotEligible ? 'bg-rose-500/20 text-rose-400' :
                                        result.category === 'EE Credit' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-slate-800 text-indigo-400'
                                    }`}>
                                        <Award size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Credit / Eligibility</span>
                                        <span className={`text-sm font-bold ${
                                            isNotEligible ? 'text-rose-300 font-black' :
                                            result.category === 'EE Credit' ? 'text-amber-300' :
                                            'text-indigo-300'
                                        }`}>
                                            {isNotEligible ? 'NOT ELIGIBLE' : result.category || 'Group 3'}
                                        </span>
                                        {isNotEligible && (
                                            <span className="block text-[11px] text-rose-400/90 font-semibold mt-0.5">
                                                No Academic Credit Granted
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Issue Date */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-slate-800 text-purple-400">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Issue Date</span>
                                        <span className="text-sm font-semibold text-white">
                                            {result.issue_date ? new Date(result.issue_date).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : '2026 Academic Season'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Certificate Unique ID Footer */}
                            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block">Unique Certificate ID</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="font-mono text-sm font-bold text-emerald-400 select-all">
                                            {result.certificate_code}
                                        </span>
                                        <button
                                            onClick={copyCertificateId}
                                            className="text-slate-400 hover:text-white transition-colors p-1"
                                            title="Copy Certificate ID"
                                        >
                                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <FileCheck size={16} className="text-emerald-400" />
                                    <span>Verified by HACKARE Organizing Board</span>
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* Initial Empty State */}
                {!loading && !result && !error && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                            <QrCode size={32} />
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Verify a Certificate</h2>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                            Point your mobile device camera at the QR code printed on the official certificate, or paste the Certificate ID above to view verified participant credentials.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
                <p>© {new Date().getFullYear()} HACKARE. All Rights Reserved. Official Certificate Verification Portal.</p>
            </footer>
        </div>
    )
}

export default function VerifyCertificatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="animate-pulse text-sm">Loading verification portal...</div>
            </div>
        }>
            <VerificationContent />
        </Suspense>
    )
}
