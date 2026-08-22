'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors group"
        >
            <LogOut className="h-5 w-5 opacity-75 group-hover:opacity-100" />
            <span className="font-medium">Sign Out</span>
        </button>
    )
}
