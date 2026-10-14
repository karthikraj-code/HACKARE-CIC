'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
    const [loading, setLoading] = useState(false)
    const [clientError, setClientError] = useState('')
    const searchParams = useSearchParams()
    const urlError = searchParams.get('error')

    const getErrorMessage = (errorCode: string | null) => {
        if (!errorCode) return null
        switch (errorCode) {
            case 'OAuthSignin':
            case 'OAuthCallback':
                return 'Error connecting with Google OAuth. Check your Redirect URI and credentials.'
            case 'OAuthCreateAccount':
            case 'Callback':
            case 'AccessDenied':
                return 'Access was denied or account could not be created.'
            case 'Configuration':
                return 'There is a server configuration issue. Check NEXTAUTH_SECRET and NEXTAUTH_URL in Vercel.'
            default:
                return `Authentication error: ${errorCode}`
        }
    }

    const displayedError = clientError || getErrorMessage(urlError)

    const handleGoogleLogin = async () => {
        setLoading(true)
        setClientError('')
        
        try {
            await signIn('google', { callbackUrl: '/dashboard' })
        } catch (err: any) {
            setClientError(err.message || 'Failed to initiate Google login')
            setLoading(false)
        }
    }

    return (
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-200">
            <div className="space-y-6">
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-gray-300 rounded-xl shadow-xs bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 flex items-center gap-3 relative overflow-hidden cursor-pointer"
                >
                    {loading && (
                        <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
                            <div className="w-full h-1 bg-blue-100 absolute bottom-0 left-0 overflow-hidden">
                                <div className="h-full bg-blue-500 w-1/2 animate-[progress_1s_ease-in-out_infinite]"></div>
                            </div>
                        </div>
                    )}
                    
                    {loading ? (
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                    )}
                    <span className="relative z-10">{loading ? 'Connecting securely...' : 'Sign in with Google'}</span>
                </button>
            </div>

            {displayedError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{displayedError}</span>
                </div>
            )}
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3.5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/group-2b.png"
                            alt="Google Developer Groups On Campus Kalasalingam Academy Of Research & Education"
                            width={240}
                            height={40}
                            className="h-8 md:h-9 w-auto object-contain"
                            priority
                        />
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Login Card Main */}
            <main className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <Image
                        src="/gdg-logo.png"
                        alt="GDG Logo"
                        width={64}
                        height={64}
                        className="mx-auto h-14 w-auto object-contain mb-4"
                    />
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Sign in to GDG-KARE Event Management Platform
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-sm mx-auto">
                        Google Developer Groups On Campus • Kalasalingam Academy Of Research & Education
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-5 px-4 text-center text-xs text-gray-500">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/gdg-logo.png"
                            alt="GDG Logo"
                            width={16}
                            height={16}
                            className="h-3.5 w-auto object-contain"
                        />
                        <p>© {new Date().getFullYear()} GDG-KARE Event Management Platform. All rights reserved.</p>
                    </div>
                    <p className="text-[11px] text-gray-400">Official Event & Competition Portal</p>
                </div>
            </footer>
        </div>
    )
}
