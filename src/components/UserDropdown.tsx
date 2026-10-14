'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { User, LogOut, ChevronDown, Settings, CheckSquare, LayoutDashboard } from 'lucide-react'

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

    const displayName = user?.name || user?.email?.split('@')[0] || 'User'
    const initial = displayName.charAt(0).toUpperCase()
    const role = user?.role?.toLowerCase() || 'participant'

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
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 p-1 md:p-1.5 rounded-full md:rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label="User account menu"
            >
                <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-sm shadow-blue-500/20">
                    {initial}
                </div>
                <div className="hidden md:block text-left pr-1">
                    <p className="text-xs font-bold text-gray-900 leading-tight max-w-[130px] truncate">{displayName}</p>
                    <p className="text-[10px] text-gray-500 truncate max-w-[130px]">{user?.email || ''}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                        <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-2 border border-blue-200">
                            {role}
                        </span>
                    </div>

                    <div className="py-1">
                        {role === 'participant' && (
                            <Link
                                href="/dashboard/participant/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <User size={16} className="text-blue-600" />
                                Go to Profile
                            </Link>
                        )}
                        {role === 'organizer' && (
                            <Link
                                href="/dashboard/organizer/settings"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <Settings size={16} className="text-blue-600" />
                                Access Settings
                            </Link>
                        )}
                        {role === 'judge' && (
                            <Link
                                href="/dashboard/judge"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <LayoutDashboard size={16} className="text-blue-600" />
                                Judge Dashboard
                            </Link>
                        )}
                        {role === 'volunteer' && (
                            <Link
                                href="/dashboard/volunteer"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <CheckSquare size={16} className="text-blue-600" />
                                Attendance Tracker
                            </Link>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false)
                                signOut({ callbackUrl: '/login' })
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                        >
                            <LogOut size={16} className="text-red-500" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
