import { redirect } from 'next/navigation'

export default function OrganizerStudentsRedirect() {
    redirect('/dashboard/organizer/participants')
}
