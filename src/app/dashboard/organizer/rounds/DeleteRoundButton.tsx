'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteRoundButtonProps {
    roundId: string
    roundName: string
    onDeleted?: (roundId: string) => void
}

export default function DeleteRoundButton({ roundId, roundName, onDeleted }: DeleteRoundButtonProps) {
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

            if (onDeleted) {
                onDeleted(roundId)
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
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Delete Round"
        >
            {isDeleting ? <Loader2 size={18} className="animate-spin text-red-500" /> : <Trash2 size={18} />}
        </button>
    )
}
