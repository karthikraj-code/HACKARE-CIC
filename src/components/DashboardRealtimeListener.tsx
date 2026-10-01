'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface DashboardRealtimeListenerProps {
    /** Optional fallback polling interval in ms (default: disabled / 0 to save connection limits) */
    intervalMs?: number
}

// Pages that handle their own granular in-place realtime updates without needing router.refresh()
const SELF_SYNCING_PATHS = [
    '/dashboard/participant/problem-statement',
    '/dashboard/organizer/problem-statements',
    '/dashboard/organizer/teams'
]

export default function DashboardRealtimeListener({ intervalMs = 0 }: DashboardRealtimeListenerProps) {
    const router = useRouter()
    const pathname = usePathname()
    const lastRefreshTimeRef = useRef<number>(Date.now())
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    const isSelfSyncing = SELF_SYNCING_PATHS.some(path => pathname?.startsWith(path))

    useEffect(() => {
        // If on a page that handles its own granular live updates, bypass full router.refresh
        if (isSelfSyncing) return

        const MIN_COOLDOWN_MS = 10000 // Minimum 10 seconds between router.refresh calls

        const triggerThrottledRefresh = () => {
            const now = Date.now()
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }

            const timeSinceLast = now - lastRefreshTimeRef.current
            const delay = timeSinceLast < MIN_COOLDOWN_MS ? MIN_COOLDOWN_MS - timeSinceLast : 1000

            debounceTimerRef.current = setTimeout(() => {
                if (document.visibilityState === 'visible') {
                    lastRefreshTimeRef.current = Date.now()
                    router.refresh()
                }
            }, delay)
        }

        // 1. Setup targeted Supabase Realtime channel for global competition state
        let channel: any = null
        try {
            const supabase = createClient()
            channel = supabase
                .channel('global-competition-sync')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => {
                    triggerThrottledRefresh()
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_config' }, () => {
                    triggerThrottledRefresh()
                })
                .subscribe()
        } catch (err) {
            console.warn('Realtime sync subscription init error:', err)
        }

        // 2. Optional fallback background interval (only if explicitly enabled > 0)
        let interval: NodeJS.Timeout | null = null
        if (intervalMs > 0) {
            interval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    triggerThrottledRefresh()
                }
            }, Math.max(intervalMs, 15000))
        }

        return () => {
            if (channel) {
                channel.unsubscribe()
            }
            if (interval) {
                clearInterval(interval)
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [router, intervalMs, isSelfSyncing])

    return null
}
