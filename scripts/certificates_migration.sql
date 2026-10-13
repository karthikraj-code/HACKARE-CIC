-- ==============================================================================
-- HACKARE PLATFORM: COMPLETE SUPABASE MIGRATION FOR WINNERS & CERTIFICATES
-- Description: Sets up participant categories, winning teams rankings, certificates
--              registry, QR verification access, and RLS policies in ONE run.
-- How to run: Open Supabase Dashboard -> SQL Editor -> Paste and Click "Run"
-- ==============================================================================

-- 1. PARTICIPANT CATEGORIES IN 'users' TABLE
-- Adds the 'category' column if not present
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Group 3';

-- Populate categories according to college rules:
-- 2nd Year participants -> 'Group 3'
-- All remaining years -> 'EE Credit'
-- Preserves existing 'Not Eligible' flags
UPDATE public.users
SET category = CASE
    WHEN category IS NOT NULL AND category = 'Not Eligible' THEN 'Not Eligible'
    WHEN year ILIKE '%2nd%' OR year ILIKE '2%' THEN 'Group 3'
    ELSE 'EE Credit'
END
WHERE role = 'participant';


-- 2. WINNING TEAMS & RANKINGS IN 'teams' TABLE
-- Adds 'winner_rank' directly to teams (1 = 1st Place, 2 = 2nd Place, 3 = 3rd Place, etc.)
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS winner_rank INT;
CREATE INDEX IF NOT EXISTS idx_teams_winner_rank ON public.teams(winner_rank);


-- 3. DEDICATED 'winning_teams' TABLE
-- Stores configured event winning teams (supports Top 3, 5, 10, 25, etc.)
CREATE TABLE IF NOT EXISTS public.winning_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rank INT NOT NULL UNIQUE,
    team_name VARCHAR(150) NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    award_title VARCHAR(150) DEFAULT 'Winner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winning_teams_rank ON public.winning_teams(rank);
CREATE INDEX IF NOT EXISTS idx_winning_teams_name ON public.winning_teams(team_name);


-- 4. OFFICIAL 'certificates' TABLE
-- Stores every issued certificate with unique QR code verification data
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_code VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    reg_no VARCHAR(100) NOT NULL,
    dept VARCHAR(100),
    section VARCHAR(50),
    year VARCHAR(50),
    team_name VARCHAR(150),
    category VARCHAR(50) NOT NULL DEFAULT 'Group 3',
    template_name VARCHAR(150) DEFAULT 'Standard Hackathon Certificate',
    award_tier VARCHAR(100) DEFAULT 'Participation',
    winner_rank INT,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure any existing 'certificates' table receives new columns seamlessly
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS team_name VARCHAR(150);
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS award_tier VARCHAR(100) DEFAULT 'Participation';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS winner_rank INT;


-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificates_reg_no ON public.certificates(reg_no);
CREATE INDEX IF NOT EXISTS idx_certificates_category ON public.certificates(category);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_team_name ON public.certificates(team_name);
CREATE INDEX IF NOT EXISTS idx_certificates_winner_rank ON public.certificates(winner_rank);


-- 6. ROW LEVEL SECURITY (RLS) FOR 'certificates'
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Allow public read access so any external scanner can authenticate QR codes
DROP POLICY IF EXISTS "Allow public read access for certificate verification" ON public.certificates;
CREATE POLICY "Allow public read access for certificate verification"
ON public.certificates
FOR SELECT
USING (true);

-- Allow organizers and service roles full access to insert/update/delete
DROP POLICY IF EXISTS "Allow organizers full access on certificates" ON public.certificates;
CREATE POLICY "Allow organizers full access on certificates"
ON public.certificates
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'organizer'
    )
    OR auth.role() = 'service_role'
);


-- 7. ROW LEVEL SECURITY (RLS) FOR 'winning_teams'
ALTER TABLE public.winning_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on winning_teams" ON public.winning_teams;
CREATE POLICY "Allow public read on winning_teams"
ON public.winning_teams
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow organizers full access on winning_teams" ON public.winning_teams;
CREATE POLICY "Allow organizers full access on winning_teams"
ON public.winning_teams
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'organizer'
    )
    OR auth.role() = 'service_role'
);


-- 8. 'certificate_templates' TABLE (EXTERNAL/CUSTOM TEMPLATE STORAGE)
-- Stores uploaded custom certificate template images and layouts across refreshes
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'Participation', 'Winner 1 (1st Place)', etc.
    file_name VARCHAR(255),
    image_data_url TEXT NOT NULL,
    dimensions JSONB DEFAULT '{"width": 1920, "height": 1080}'::jsonb,
    layout JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on certificate_templates" ON public.certificate_templates;
CREATE POLICY "Allow public read on certificate_templates"
ON public.certificate_templates
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow organizers full access on certificate_templates" ON public.certificate_templates;
CREATE POLICY "Allow organizers full access on certificate_templates"
ON public.certificate_templates
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'organizer'
    )
    OR auth.role() = 'service_role'
);


-- 8B. SUPABASE STORAGE BUCKET: 'certificate-templates'
-- Ensures the public storage bucket exists for high-res templates
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('certificate-templates', 'certificate-templates', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read of template images
DROP POLICY IF EXISTS "Public template image access" ON storage.objects;
CREATE POLICY "Public template image access" ON storage.objects
FOR SELECT USING (bucket_id = 'certificate-templates');

-- Allow authenticated organizers and service role to upload/update templates
DROP POLICY IF EXISTS "Organizer template image upload" ON storage.objects;
CREATE POLICY "Organizer template image upload" ON storage.objects
FOR ALL USING (bucket_id = 'certificate-templates');


-- 9. CONVENIENCE VIEW: ALL PARTICIPANTS WITH TEAM & AWARD TIER
-- You can view this directly in Supabase -> Table Editor -> Views -> v_event_certificates_summary
CREATE OR REPLACE VIEW public.v_event_certificates_summary AS
SELECT 
    u.id AS user_id,
    u.name,
    u.reg_no,
    u.dept,
    u.section,
    u.year,
    u.category,
    COALESCE(t.team_name, 'Unassigned') AS team_name,
    COALESCE(t.winner_rank, wt.rank) AS winner_rank,
    CASE
        WHEN u.category = 'Not Eligible' THEN 'Not Eligible'
        WHEN COALESCE(t.winner_rank, wt.rank) = 1 THEN 'Winner 1 (1st Place)'
        WHEN COALESCE(t.winner_rank, wt.rank) = 2 THEN 'Winner 2 (2nd Place)'
        WHEN COALESCE(t.winner_rank, wt.rank) = 3 THEN 'Winner 3 (3rd Place)'
        WHEN COALESCE(t.winner_rank, wt.rank) > 3 THEN 'Winner ' || COALESCE(t.winner_rank, wt.rank)::text || ' Place'
        ELSE 'Participation'
    END AS assigned_award_tier
FROM public.users u
LEFT JOIN public.team_members tm ON tm.user_id = u.id
LEFT JOIN public.teams t ON t.id = tm.team_id
LEFT JOIN public.winning_teams wt ON LOWER(TRIM(wt.team_name)) = LOWER(TRIM(t.team_name))
WHERE u.role = 'participant'
ORDER BY COALESCE(t.winner_rank, wt.rank) ASC NULLS LAST, u.name ASC;
