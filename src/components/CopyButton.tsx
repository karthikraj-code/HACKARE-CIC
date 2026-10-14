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
            ? 'bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs'
            : 'bg-white hover:bg-gray-100 text-black border border-gray-200 px-2.5 py-1 rounded-lg text-xs hover:border-gray-300',
        outline: copied
            ? 'bg-blue-50 text-blue-700 border border-blue-300 px-3 py-1.5 rounded-xl text-xs'
            : 'bg-white hover:bg-gray-50 text-black border border-gray-200 px-3 py-1.5 rounded-xl text-xs hover:border-gray-300 hover:text-black',
        subtle: copied
            ? 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-xs'
            : 'text-gray-700 hover:text-black hover:bg-gray-100 px-2 py-0.5 rounded-md text-xs',
        icon: copied
            ? 'p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200'
            : 'p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 hover:text-black border border-gray-200'
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
                    <Check size={iconSize} className="text-blue-600 shrink-0" />
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
