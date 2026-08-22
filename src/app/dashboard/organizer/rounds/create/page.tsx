'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlusCircle } from 'lucide-react'

// Base configurations for 3 rounds
const ROUND_PRESETS = [
    { 
        name: 'Round 1: Problem Definition & System Architecture (PPT)', 
        type: ['problem_architecture_ppt'],
        description: 'Formulate your problem understanding, proposed AI/Tech solution, system architecture diagram, tech stack, and implementation roadmap in a presentation.'
    },
    { 
        name: 'Round 2: Intermediate Prototype & Core Implementation', 
        type: ['product_code_demo'],
        description: 'Midway development milestone. Submit your GitHub repository, working prototype or API endpoints demo, and progress on core AI modules.'
    },
    { 
        name: 'Round 3: Final Working Product & Code Demonstration', 
        type: ['product_code_demo'],
        description: 'Final working product evaluation. Submit your complete source code repository, live deployed application link, and a walkthrough demo video demonstrating the full working product.'
    },
]



export default function CreateRoundPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: ROUND_PRESETS[0].name,
        description: '',
        start_time: '',
        end_time: '',
        submission_types: ROUND_PRESETS[0].type,
    })

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPreset = ROUND_PRESETS.find(p => p.name === e.target.value)
        if (selectedPreset) {
            setFormData({
                ...formData,
                name: selectedPreset.name,
                description: selectedPreset.description,
                submission_types: selectedPreset.type
            })
        } else {
            setFormData({ ...formData, name: e.target.value })
        }
    }

    const handleTypeToggle = (type: string) => {
        setFormData(prev => {
            const types = prev.submission_types.includes(type)
                ? prev.submission_types.filter(t => t !== type)
                : [...prev.submission_types, type]
            return { ...prev, submission_types: types }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/rounds/create', {
                method: 'POST',
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
                throw new Error(data.error || 'Failed to create round')
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
        <div className="max-w-2xl space-y-6">
            <Link href="/dashboard/organizer/rounds" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rounds
            </Link>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                        <PlusCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Create New Round</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Round Template</label>
                        <select
                            value={formData.name}
                            onChange={handlePresetChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent bg-white"
                            required
                        >
                            {ROUND_PRESETS.map((preset) => (
                                <option key={preset.name} value={preset.name}>
                                    {preset.name}
                                </option>
                            ))}
                            <option value="Custom Round">Custom Round...</option>
                        </select>
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
                        {loading ? 'Creating...' : 'Create Round'}
                    </button>
                </form>
            </div>
        </div>
    )
}
