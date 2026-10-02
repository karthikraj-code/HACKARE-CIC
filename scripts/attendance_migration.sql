-- ============================================================================
-- HACKARE PLATFORM: VOLUNTEER & ATTENDANCE SYSTEM SQL MIGRATION
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor and click RUN
-- ============================================================================

-- 1. Extend user_role ENUM to support 'volunteer'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'volunteer';

-- 2. Create volunteer_emails table for access whitelist
CREATE TABLE IF NOT EXISTS public.volunteer_emails (
    email TEXT PRIMARY KEY,
    added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create attendance_sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slot TEXT NOT NULL CHECK (slot IN ('morning', 'afternoon', 'evening', 'night', 'custom')),
    date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create attendance_records table (Present / Absent status per user per session)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    marked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(session_id, user_id)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.volunteer_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for authenticated and service_role access
CREATE POLICY "Allow all access to service_role" ON public.volunteer_emails FOR ALL TO service_role USING (true);
CREATE POLICY "Allow read access on volunteer_emails" ON public.volunteer_emails FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all access to service_role" ON public.attendance_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Allow read access on attendance_sessions" ON public.attendance_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all access to service_role" ON public.attendance_records FOR ALL TO service_role USING (true);
CREATE POLICY "Allow read access on attendance_records" ON public.attendance_records FOR SELECT TO authenticated USING (true);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(date);
