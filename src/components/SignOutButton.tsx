'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors group cursor-pointer"
        >
            <LogOut className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            <span className="font-semibold text-sm">Sign Out</span>
        </button>
    )
}
