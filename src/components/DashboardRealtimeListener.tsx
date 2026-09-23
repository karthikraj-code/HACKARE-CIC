'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface DashboardRealtimeListenerProps {
    /** Optional fallback polling interval in ms (default: disabled / 0 to save connection limits) */
    intervalMs?: number
}

export default function DashboardRealtimeListener({ intervalMs = 0 }: DashboardRealtimeListenerProps) {
    const router = useRouter()
    const lastRefreshTimeRef = useRef<number>(Date.now())
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const MIN_COOLDOWN_MS = 8000 // Minimum 8 seconds between router.refresh calls

        const triggerThrottledRefresh = () => {
            const now = Date.now()
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }

            const timeSinceLast = now - lastRefreshTimeRef.current
            const delay = timeSinceLast < MIN_COOLDOWN_MS ? MIN_COOLDOWN_MS - timeSinceLast : 800

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
                .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statements' }, () => {
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
            }, Math.max(intervalMs, 10000))
        }

        // 3. Tab visibility / Focus auto-refresh (only if away for > 20s)
        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible') {
                const elapsed = Date.now() - lastRefreshTimeRef.current
                if (elapsed > 20000) {
                    triggerThrottledRefresh()
                }
            }
        }

        window.addEventListener('focus', handleVisibilityOrFocus)
        document.addEventListener('visibilitychange', handleVisibilityOrFocus)

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
            window.removeEventListener('focus', handleVisibilityOrFocus)
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
        }
    }, [router, intervalMs])

    return null
}
