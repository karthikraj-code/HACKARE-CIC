'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeleteRoundButton({ roundId, roundName }: { roundId: string, roundName: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete the round "${roundName}"? This will permanently delete any quiz questions, submissions, and scores associated with it.`)) {
            return
        }

        setIsDeleting(true)

        try {
            const res = await fetch('/api/rounds/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roundId }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to delete round')
            }

            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete Round"
        >
            <Trash2 size={18} />
        </button>
    )
}
