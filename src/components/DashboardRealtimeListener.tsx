'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface DashboardRealtimeListenerProps {
    intervalMs?: number
}

export default function DashboardRealtimeListener({ intervalMs = 4000 }: DashboardRealtimeListenerProps) {
    const router = useRouter()

    useEffect(() => {
        // 1. Setup Supabase Realtime channel
        let channel: any = null
        try {
            const supabase = createClient()
            channel = supabase
                .channel('db-changes-listener')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => {
                    router.refresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_config' }, () => {
                    router.refresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statements' }, () => {
                    router.refresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_selections' }, () => {
                    router.refresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
                    router.refresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
                    router.refresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
                    router.refresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
                    router.refresh()
                })
                .subscribe()
        } catch (err) {
            console.error('Realtime subscription init:', err)
        }

        // 2. Periodic background refresh polling
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.refresh()
            }
        }, intervalMs)

        // 3. Tab visibility / Focus auto-refresh
        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible') {
                router.refresh()
            }
        }

        window.addEventListener('focus', handleVisibilityOrFocus)
        document.addEventListener('visibilitychange', handleVisibilityOrFocus)

        return () => {
            if (channel) {
                channel.unsubscribe()
            }
            clearInterval(interval)
            window.removeEventListener('focus', handleVisibilityOrFocus)
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
        }
    }, [router, intervalMs])

    return null
}
