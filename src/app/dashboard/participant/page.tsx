import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { 
    Users, 
    Lightbulb, 
    Target, 
    ArrowRight, 
    CheckCircle2, 
    AlertCircle, 
    Clock,
    Calendar,
    Sparkles,
    FileText,
    Video,
    Github,
    Check
} from 'lucide-react'
import CopyButton from '@/components/CopyButton'
import { ensureDbUser } from '@/lib/ensureUser'
import { normalizeSubmissionConfig } from '@/lib/submissionConfig'
import { formatDateTime } from '@/lib/dateUtils'

export default async function ParticipantDashboard() {
    const supabase = await createAdminClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    const dbUser = await ensureDbUser(user)
    const activeUserId = dbUser?.id || user?.id
    const userIds = [activeUserId, user?.id].filter(Boolean)

    const userData = dbUser || user

    // 1. Get user's team membership
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, teams(*)')
        .in('user_id', userIds)
        .maybeSingle()

    const team = membership?.teams as any
    const teamId = team?.id

    // 2. Get Team Members count
    let memberCount = 0
    if (teamId) {
        const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
        memberCount = count || 0
    }

    // 3. Get team's selected problem statement
    let selectedProblem: any = null
    if (teamId) {
        const { data: selection } = await supabase
            .from('problem_selections')
            .select('*, problem_statements(*)')
            .eq('team_id', teamId)
            .maybeSingle()
        selectedProblem = selection?.problem_statements
    }

    // 4. Fetch all competition rounds from database dynamically
    const { data: allRounds } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true })

    const roundsList = allRounds || []

    // 5. Fetch team's actual submissions
    const submittedRoundIds = new Set<string>()
    const submissionsMap: Record<string, any> = {}

    if (teamId) {
        const { data: submissions } = await supabase
            .from('submissions')
            .select('*')
            .eq('team_id', teamId)

        submissions?.forEach((s: any) => {
            if (s.round_id) {
                submittedRoundIds.add(s.round_id)
                submissionsMap[s.round_id] = s
            }
        })
    }

    const isLeader = team?.leader_id === activeUserId || team?.leader_id === user?.id

    // Calculate dynamic milestone completion
    const totalMilestones = 2 + roundsList.length
    let completedMilestones = 0
    if (team) completedMilestones += 1
    if (selectedProblem) completedMilestones += 1
    roundsList.forEach(r => {
        if (submittedRoundIds.has(r.id)) completedMilestones += 1
    })

    const progressPercentage = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100) 
        : 0

    const now = new Date()

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Welcome Banner */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-sky-400" />
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Welcome to HACKARE, {userData?.name || 'Participant'}!
                </h2>
                <p className="text-gray-600 text-base max-w-3xl">
                    Follow the competition milestones below: form your team, lock your problem statement, and submit each round's deliverables before the deadline.
                </p>
            </div>

            {/* Current Team & Problem Statement Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                <Users className="text-blue-600" size={20} />
                                My Team
                            </h3>
                            {team ? (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {memberCount} / 4 Members
                                </span>
                            ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    Not Formed
                                </span>
                            )}
                        </div>
                        {team ? (
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xl font-bold text-gray-900">{team.team_name}</p>
                                    {team.team_code && (
                                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                            {team.team_code}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    {isLeader ? '👑 You are the Team Leader' : 'Team Member'}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-sm text-amber-700 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200">
                                    You have not joined a team yet. Create or join a team (up to 4 members).
                                </p>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/dashboard/participant/team"
                        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2.5 px-4 rounded-lg transition-colors"
                    >
                        {team ? 'Manage Team' : 'Create or Join Team'} <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Problem Statement Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                <Lightbulb className="text-amber-500" size={20} />
                                Problem Statement
                            </h3>
                            {selectedProblem ? (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Locked
                                </span>
                            ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                    Pending Selection
                                </span>
                            )}
                        </div>
                        {selectedProblem ? (
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                                    {selectedProblem.statement_code} • {selectedProblem.domain}
                                </span>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <p className="font-extrabold text-gray-900 text-base line-clamp-1">
                                        {selectedProblem.title}
                                    </p>
                                    <CopyButton
                                        text={`${selectedProblem.statement_code}: ${selectedProblem.title}\n\n${selectedProblem.description}`}
                                        label="Copy"
                                        variant="pill"
                                        className="shrink-0"
                                    />
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {selectedProblem.description}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    Browse available problem statements and lock your choice for your team.
                                </p>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/dashboard/participant/problem-statement"
                        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 py-2.5 px-4 rounded-lg transition-colors"
                    >
                        {selectedProblem ? 'View Problem Statement' : 'Choose Problem Statement'} <ArrowRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Real Hackathon Flow & Milestones */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                {/* Section Header with Live Progress */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Target className="text-blue-600" />
                            Hackathon Flow & Milestones
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Live progression tracking across all competition stages and submission rounds.
                        </p>
                    </div>

                    {/* Progress Bar & Counter */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex-1 sm:w-40 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-700 font-mono whitespace-nowrap">
                            {completedMilestones}/{totalMilestones} Completed ({progressPercentage}%)
                        </span>
                    </div>
                </div>

                {/* Milestone Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Step 1: Team Formation */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        team 
                            ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
                            : 'bg-slate-50/80 border-slate-200'
                    }`}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-xs ${
                                    team ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                    1
                                </span>
                                {team ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 size={13} /> Completed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                                        <AlertCircle size={13} /> Required
                                    </span>
                                )}
                            </div>

                            <div>
                                <h4 className="font-extrabold text-gray-900 text-sm mb-1">
                                    Team Formation
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Form or join a team of up to 4 members using an invite code.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-500 truncate">
                                {team ? `${team.team_name} (${memberCount}/4)` : 'Not Formed'}
                            </span>
                            <Link 
                                href="/dashboard/participant/team" 
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 flex items-center gap-1"
                            >
                                {team ? 'Team' : 'Join'} &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* Step 2: Problem Selection */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        selectedProblem 
                            ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
                            : 'bg-slate-50/80 border-slate-200'
                    }`}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-xs ${
                                    selectedProblem ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                    2
                                </span>
                                {selectedProblem ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 size={13} /> Completed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                                        <AlertCircle size={13} /> Next Step
                                    </span>
                                )}
                            </div>

                            <div>
                                <h4 className="font-extrabold text-gray-900 text-sm mb-1">
                                    Problem Selection
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Choose 1 problem statement for your team to reverse engineer.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-500 font-mono truncate">
                                {selectedProblem ? selectedProblem.statement_code : 'Pending Selection'}
                            </span>
                            <Link 
                                href="/dashboard/participant/problem-statement" 
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 flex items-center gap-1"
                            >
                                {selectedProblem ? 'View' : 'Select'} &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* Step 3..N: Real Dynamic Competition Rounds */}
                    {roundsList.map((round, idx) => {
                        const stepNum = idx + 3
                        const isSubmitted = submittedRoundIds.has(round.id)
                        const startTime = round.start_time ? new Date(round.start_time) : null
                        const endTime = round.end_time ? new Date(round.end_time) : null

                        const isUpcoming = startTime ? now < startTime : false
                        const isClosed = endTime ? now > endTime : false
                        const isActive = !isUpcoming && !isClosed

                        const config = normalizeSubmissionConfig(round.submission_type, round.round_number, round.name)

                        // Format checklist
                        const formatTags: string[] = []
                        if (config.fields.text.enabled) formatTags.push('Text')
                        if (config.fields.live_demo.enabled) formatTags.push('Demo')
                        if (config.fields.github.enabled) formatTags.push('GitHub')
                        if (config.fields.ppt.enabled) formatTags.push('PPT')

                        return (
                            <div 
                                key={round.id}
                                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                    isSubmitted 
                                        ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
                                        : isActive 
                                        ? 'bg-white border-blue-300 ring-1 ring-blue-500/10 shadow-xs'
                                        : isUpcoming
                                        ? 'bg-slate-50/80 border-slate-200'
                                        : 'bg-slate-50/60 border-slate-200 opacity-80'
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-xs ${
                                            isSubmitted 
                                                ? 'bg-emerald-600 text-white' 
                                                : isActive 
                                                ? 'bg-blue-600 text-white'
                                                : isUpcoming
                                                ? 'bg-slate-700 text-white'
                                                : 'bg-slate-400 text-white'
                                        }`}>
                                            {stepNum}
                                        </span>

                                        {isSubmitted ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                                                <CheckCircle2 size={13} /> Submitted
                                            </span>
                                        ) : isActive ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                                                <Clock size={12} /> Active
                                            </span>
                                        ) : isUpcoming ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                <Calendar size={12} className="text-amber-600" /> Upcoming
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                                                Closed
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="font-extrabold text-gray-900 text-sm mb-1 line-clamp-1">
                                            {round.round_number ? `Round ${round.round_number}: ` : ''}{round.name}
                                        </h4>
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                            {round.description || 'Submit required deliverables before the round deadline.'}
                                        </p>
                                    </div>

                                    {/* Formats Pills */}
                                    {formatTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {formatTags.map(fmt => (
                                                <span key={fmt} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                    {fmt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-500">
                                        {isSubmitted 
                                            ? 'Recorded ✓' 
                                            : isUpcoming
                                            ? `Opens: ${formatDateTime(round.start_time)}`
                                            : `Due: ${formatDateTime(round.end_time)}`
                                        }
                                    </span>
                                    <Link 
                                        href={`/dashboard/participant/rounds/${round.id}`} 
                                        className={`text-xs font-bold hover:underline shrink-0 flex items-center gap-1 ${
                                            isSubmitted 
                                                ? 'text-emerald-700' 
                                                : isActive
                                                ? 'text-blue-600 font-black'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        {isSubmitted ? 'View' : isActive ? 'Submit' : 'Details'} &rarr;
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
