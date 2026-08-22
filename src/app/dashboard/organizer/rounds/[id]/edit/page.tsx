import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import EditRoundForm from './EditRoundForm'

export default async function EditRoundPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const roundId = resolvedParams.id
    const supabase = await createClient()

    const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', roundId)
        .single()

    if (!round) {
        redirect('/dashboard/organizer/rounds')
    }

    return (
        <div className="max-w-2xl space-y-6">
            <Link href="/dashboard/organizer/rounds" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rounds
            </Link>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                        <Edit size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Round</h2>
                </div>

                <EditRoundForm round={round} />
            </div>
        </div>
    )
}
