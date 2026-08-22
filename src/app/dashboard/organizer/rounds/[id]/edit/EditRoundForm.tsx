'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditRoundForm({ round }: { round: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Date formatting helper for datetime-local inputs
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        // Adjust for local timezone offset
        const offset = date.getTimezoneOffset()
        date.setMinutes(date.getMinutes() - offset)
        return date.toISOString().slice(0, 16)
    }

    const [formData, setFormData] = useState({
        name: round.name,
        description: round.description || '',
        start_time: formatDateForInput(round.start_time),
        end_time: formatDateForInput(round.end_time),
        submission_types: round.submission_type || [],
    })

    const handleTypeToggle = (type: string) => {
        setFormData(prev => {
            const types = prev.submission_types.includes(type)
                ? prev.submission_types.filter((t: string) => t !== type)
                : [...prev.submission_types, type]
            return { ...prev, submission_types: types }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/rounds/${round.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    start_time: new Date(formData.start_time).toISOString(),
                    end_time: new Date(formData.end_time).toISOString(),
                    submission_type: formData.submission_types
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update round')
            }

            router.push('/dashboard/organizer/rounds')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Round Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description / Instructions</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Instructions for participants..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Allowed Submission Types</label>
                <div className="flex flex-wrap gap-3">
                    {[
                        { id: 'problem_architecture_ppt', label: 'Round 1 (PPT & Architecture)' },
                        { id: 'product_code_demo', label: 'Round 2 (Code & Live Demo)' },
                        { id: 'text', label: 'Text Input' },
                        { id: 'file_upload', label: 'File Upload' },
                        { id: 'link', label: 'External Link' },
                    ].map(type => (
                        <label key={type.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.submission_types.includes(type.id)}
                                onChange={() => handleTypeToggle(type.id)}
                                className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-600"
                            />
                            <span className="text-sm font-medium text-gray-700">{type.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {error && (
                <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-md border border-slate-100">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-600 text-white py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-sm"
            >
                {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
        </form>
    )
}
