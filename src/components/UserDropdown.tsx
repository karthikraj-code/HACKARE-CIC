'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { User, LogOut, ChevronDown } from 'lucide-react'

interface UserDropdownProps {
    user: {
        name?: string | null
        email?: string | null
        role?: string | null
    }
}

export default function UserDropdown({ user }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'P'

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 rounded-full md:rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                    {initial}
                </div>
                <div className="hidden md:block text-left pr-1">
                    <p className="text-xs font-bold text-gray-900 leading-tight max-w-[140px] truncate">{user?.name || 'Participant'}</p>
                    <p className="text-[10px] text-gray-500 truncate max-w-[140px]">{user?.email || ''}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Participant'}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                        <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-2 border border-blue-200">
                            {user?.role || 'Participant'}
                        </span>
                    </div>

                    <div className="py-1">
                        <Link
                            href="/dashboard/participant/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <User size={16} className="text-blue-600" />
                            Go to Profile
                        </Link>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                signOut({ callbackUrl: '/login' })
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
