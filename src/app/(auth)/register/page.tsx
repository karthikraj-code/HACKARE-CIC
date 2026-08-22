import { redirect } from 'next/navigation'

export default function RegisterPage() {
    // Since we use Google Auth for both Login and Register natively,
    // we just redirect the register route to login to keep a single entry point.
    redirect('/login')
}
