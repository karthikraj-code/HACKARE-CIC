import { createClient } from '@/utils/supabase/server'
import ManageRoundsClient from './ManageRoundsClient'

export default async function OrganizerRoundsPage() {
    const supabase = await createClient()

    // Fetch all rounds
    const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true })

    return <ManageRoundsClient initialRounds={rounds || []} />
}

