/**
 * Deterministic date-time formatter that produces identical output
 * on both server (SSR) and client to prevent React hydration mismatch errors.
 * Example output: "Aug 30, 09:00 AM"
 */
export function formatDateTime(dateInput: Date | string | null | undefined): string {
    if (!dateInput) return ''
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ''

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const day = d.getDate()
    
    let hours = d.getHours()
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const formattedHours = hours.toString().padStart(2, '0')

    return `${month} ${day}, ${formattedHours}:${minutes} ${ampm}`
}

/**
 * Deterministic date-only formatter (e.g. "Aug 30, 2026")
 */
export function formatDate(dateInput: Date | string | null | undefined): string {
    if (!dateInput) return ''
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ''

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const day = d.getDate()
    const year = d.getFullYear()

    return `${month} ${day}, ${year}`
}

/**
 * Deterministic time-only formatter (e.g. "09:00 AM")
 */
export function formatTime(dateInput: Date | string | null | undefined): string {
    if (!dateInput) return ''
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ''

    let hours = d.getHours()
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const formattedHours = hours.toString().padStart(2, '0')

    return `${formattedHours}:${minutes} ${ampm}`
}
