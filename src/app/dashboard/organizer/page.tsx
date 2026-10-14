import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Calendar, ShieldCheck, Trophy, CheckCircle2, FileText } from 'lucide-react'
import { formatTime } from '@/lib/dateUtils'

export default async function OrganizerDashboard() {
    const supabase = await createAdminClient()
    const now = new Date()

    const [
        { count: teamCount },
        { count: participantCount },
        { data: rounds },
        { data: judgeAssignments },
        { data: scores },
        { data: lbConfig },
        { data: recentSubmissions },
        { data: allSubmissions },
    ] = await Promise.all([
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'participant'),
        supabase.from('rounds').select('id, name, start_time, end_time, round_number').order('round_number'),
        supabase.from('judge_assignments').select('judge_id'),
        supabase.from('scores').select('team_id, round_id'),
        supabase.from('leaderboard_config').select('is_released').eq('id', 1).single(),
        supabase.from('submissions')
            .select(`
                id,
                submitted_at,
                team_id,
                round_id,
                teams(team_name),
                rounds(name, round_number)
            `)
            .order('submitted_at', { ascending: false })
            .limit(10),
        supabase.from('submissions').select('round_id')
    ])

    const totalRounds = rounds?.length ?? 0
    const activeRounds = rounds?.filter(r => new Date(r.start_time) <= now && now <= new Date(r.end_time)).length ?? 0
    const uniqueJudges = new Set(judgeAssignments?.map(a => a.judge_id)).size
    const scoredPairs = new Set(scores?.map(s => `${s.team_id}-${s.round_id}`)).size
    const isLeaderboardReleased = lbConfig?.is_released ?? false

    // Analytics Calculation
    const submissionsByRound = allSubmissions?.reduce((acc: any, sub) => {
        acc[sub.round_id] = (acc[sub.round_id] || 0) + 1
        return acc
    }, {}) || {}

    const stats = [
        { label: 'Participants', value: participantCount ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Teams', value: teamCount ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Rounds', value: totalRounds, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Now', value: activeRounds, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Judges', value: uniqueJudges, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Scored Pairs', value: scoredPairs, icon: Trophy, color: 'text-blue-600', bg: 'bg-blue-50' },
    ]

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-black mb-1">Organizer Dashboard</h2>
                <p className="text-gray-700 text-sm">
                    Manage the hackathon, create rounds, assign judges, and release the leaderboard.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                            <stat.icon size={18} className={stat.color} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-black">{stat.value}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Links & Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Round Analytics breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-black flex items-center gap-2">
                            <Trophy size={18} className="text-blue-600" />
                            Participation Analytics
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {rounds && rounds.length > 0 ? rounds.map(r => {
                            const submittedCount = submissionsByRound[r.id] || 0
                            const totalTeams = teamCount || 0
                            const percentage = totalTeams > 0 ? (submittedCount / totalTeams) * 100 : 0
                            
                            return (
                                <div key={r.id} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-black truncate max-w-[140px]">{r.name}</span>
                                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                            {submittedCount} / {totalTeams}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                        <div 
                                            className="h-full transition-all duration-1000 bg-blue-600" 
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        }) : (
                            <p className="text-sm text-gray-500">No data available.</p>
                        )}
                    </div>
                </div>

                {/* Live Submission Feed */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-black flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            Live Submission Feed
                        </h3>
                        <Link href="/dashboard/organizer/submissions" className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700 transition-colors">
                            View All Submissions →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentSubmissions && recentSubmissions.length > 0 ? recentSubmissions.map((sub: any) => (
                            <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-black text-xs">
                                        {(sub.teams?.team_name || 'T').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-black">{sub.teams?.team_name}</p>
                                        <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                                            Round {sub.rounds?.round_number}: {sub.rounds?.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span suppressHydrationWarning className="text-[10px] font-bold text-gray-500 block mb-1">
                                        {formatTime(sub.submitted_at)}
                                    </span>
                                    <Link 
                                        href={`/dashboard/organizer/submissions/${sub.team_id}/${sub.round_id}`}
                                        className="text-xs text-blue-600 font-bold hover:underline"
                                    >
                                        Inspect &rarr;
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500 font-medium">No submissions recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-3">
                    <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-blue-600" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Link href="/dashboard/organizer/participants" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all text-sm font-bold text-black">
                            <Users size={16} className="text-blue-600" /> Participants Roster
                        </Link>
                        <Link href="/dashboard/organizer/rounds/create" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all text-sm font-bold text-black">
                            <Calendar size={16} className="text-blue-600" /> Create Round
                        </Link>
                        <Link href="/dashboard/organizer/teams" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all text-sm font-bold text-black">
                            <ShieldCheck size={16} className="text-blue-600" /> Assign Judges
                        </Link>
                        <Link href="/dashboard/organizer/leaderboard" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all text-sm font-bold text-black">
                            <Trophy size={16} className="text-blue-600" />
                            Leaderboard: {isLeaderboardReleased ? <span className="text-blue-600">Public</span> : <span className="text-gray-600">Hidden</span>}
                        </Link>
                        <Link href="/dashboard/organizer/submissions" className="flex items-center gap-3 p-3 rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-bold shadow-sm">
                            <FileText size={16} /> View Submissions
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
