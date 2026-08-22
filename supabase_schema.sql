-- ==========================================================
-- HACKARE: COMPLETE SUPABASE DATABASE SCHEMA
-- ==========================================================


-- 1. Create Enum for Roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('participant', 'organizer', 'judge');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'participant',
  reg_no TEXT,
  dept TEXT,
  section TEXT,
  year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);



-- 3. Problem Statements Table (60 curated problems)
CREATE TABLE IF NOT EXISTS public.problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_code TEXT NOT NULL UNIQUE, -- e.g., 'PS-01' to 'PS-60'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL, -- e.g., 'Healthcare AI', 'FinTech', etc.
  max_teams INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Establish Teams Table (Max 4 members per team)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  team_code TEXT,
  leader_id UUID REFERENCES public.users(id) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  selected_problem_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Team Members Table (Max 4 members per team)
CREATE TABLE IF NOT EXISTS public.team_members (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- 6. Team Problem Statement Selections Table (1 per team, max 3 teams per statement)
CREATE TABLE IF NOT EXISTS public.problem_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES public.problem_statements(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
  selected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Competition Rounds Table (Round 1 & Round 2)
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  submission_type JSONB NOT NULL DEFAULT '["problem_architecture_ppt"]'::jsonb,
  rubric JSONB DEFAULT '{"Problem Understanding & Clarity": 10, "Proposed Solution & Innovation": 10, "System Architecture & Technical Feasibility": 15, "Presentation & Documentation": 5}'::jsonb
);

-- 8. Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT, -- Used for Architecture Diagram / Demo Video
  link TEXT,     -- Used for Google Slides PPT / Live Deployed App
  github_url TEXT, -- Used for GitHub repo
  chatgpt_link_2 TEXT, -- Used for Tech Stack / Secondary link
  text_response TEXT, -- Used for Problem/Solution summary / Features
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, round_id)
);

-- 9. Judge Assignments Table
CREATE TABLE IF NOT EXISTS public.judge_assignments (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  judge_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (team_id, judge_id)
);

-- 10. Scores Table
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE NOT NULL,
  judge_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  criteria_scores JSONB,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, round_id, judge_id)
);

-- 11. Leaderboard & Competition Config Table
CREATE TABLE IF NOT EXISTS public.leaderboard_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_released BOOLEAN DEFAULT false,
  is_problems_released BOOLEAN DEFAULT false
);

INSERT INTO public.leaderboard_config (id, is_released, is_problems_released)
VALUES (1, false, false)
ON CONFLICT (id) DO NOTHING;


-- 12. Organizer and Judge Whitelists
CREATE TABLE IF NOT EXISTS public.organizer_emails (
  email TEXT PRIMARY KEY,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.organizer_emails (email)
VALUES ('99230040479@klu.ac.in')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.judge_emails (
  email TEXT PRIMARY KEY,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 13. Enable RLS
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select problem_statements" ON public.problem_statements FOR SELECT USING (true);
CREATE POLICY "Allow select problem_selections" ON public.problem_selections FOR SELECT USING (true);
CREATE POLICY "Allow all for authenticated problem_selections" ON public.problem_selections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role on problem_statements" ON public.problem_statements FOR ALL USING (true) WITH CHECK (true);
