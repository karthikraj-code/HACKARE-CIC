'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
    text: string
    label?: string
    copiedLabel?: string
    className?: string
    iconSize?: number
    variant?: 'pill' | 'icon' | 'outline' | 'subtle'
    title?: string
}

export default function CopyButton({
    text,
    label,
    copiedLabel = 'Copied!',
    className = '',
    iconSize = 13,
    variant = 'pill',
    title = 'Copy to clipboard'
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        if (!text) return

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text)
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea')
                textArea.value = text
                textArea.style.position = 'fixed'
                textArea.style.opacity = '0'
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text:', err)
        }
    }

    const baseStyles = 'inline-flex items-center gap-1.5 transition-all cursor-pointer select-none font-semibold'

    const variantStyles = {
        pill: copied
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs shadow-2xs'
            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs shadow-2xs hover:border-slate-300',
        outline: copied
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs shadow-2xs'
            : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-xs hover:border-slate-300 hover:text-slate-900',
        subtle: copied
            ? 'text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-0.5 rounded-md text-xs',
        icon: copied
            ? 'p-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300'
            : 'p-1.5 rounded-lg bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200'
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={title}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {copied ? (
                <>
                    <Check size={iconSize} className="text-emerald-600 shrink-0" />
                    {label !== undefined && <span>{copiedLabel}</span>}
                </>
            ) : (
                <>
                    <Copy size={iconSize} className="shrink-0" />
                    {label !== undefined && <span>{label}</span>}
                </>
            )}
        </button>
    )
}
