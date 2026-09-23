# 🏆 HACKARE — AI Olympics Hackathon Platform

A high-performance, real-time hackathon management and competition scoring platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL)**.

Engineered to support **500+ concurrent participants, judges, and organizers** with atomic database transactions, real-time live synchronization, dynamic evaluation rubrics, and automated leaderboards.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features by Role](#-key-features-by-role)
  - [Participant Panel](#1-participant-panel)
  - [Judge Evaluation Portal](#2-judge-evaluation-portal)
  - [Organizer Command Center](#3-organizer-command-center)
  - [Public Leaderboard](#4-public-leaderboard)
- [Architecture & High-Concurrency Scaling](#-architecture--high-concurrency-scaling-500-users)
- [Tech Stack](#-tech-stack)
- [Database Schema & Migrations](#-database-schema--migrations)
- [Environment Variables](#-environment-variables)
- [Local Setup & Installation](#-local-setup--installation)
- [🧪 Scalability & Concurrency Testing Guide](#-scalability--concurrency-testing-guide)
- [API Routes Reference](#-api-routes-reference)
- [Deployment](#-deployment)

---

## 🌟 Overview

**HACKARE** streamlines all aspects of organizing and executing multi-round hackathons:
- **Zero Race Conditions**: Atomic PostgreSQL stored procedures lock problem statements and team memberships with row-level locks.
- **Dynamic Round Deliverables**: Organizers configure unique submission fields (PPT, Live Demo, GitHub Repo, Written Text) for each round.
- **Quantitative Rubric Matrix**: 4-tier benchmark grading criteria (Excellent, Good, Fair, Needs Improvement) for fair and rapid scoring.
- **Real-Time Sync**: Throttled Supabase Realtime listeners update participant and organizer dashboards instantly without database strain.

---

## 👥 Key Features by Role

### 1. Participant Panel
- **Google OAuth Sign-In**: Instant login with Google, followed by onboarding for registration number, department, year, and section.
- **Team Formation**:
  - Create a new team with an auto-generated 5-character invite code.
  - Join an existing team (enforces strict maximum of 4 members per team).
  - One-click invite code copying.
- **Problem Statement Selection**:
  - Live track/domain filter and keyword search.
  - Real-time capacity meter (maximum 2 teams per problem statement on a first-come, first-served basis).
  - Atomic leader locking prevents race conditions under high concurrency.
- **Multi-Round Submissions**:
  - Dynamic fields based on round configuration:
    - 📊 Google Slides / Presentation Link
    - 💻 Public GitHub Repository Link
    - 🎥 Live Deployed App / Demo Video URL
    - 📝 Written Solution Summary & Methodology
  - Automatic time window checks (`start_time` and `end_time`).
  - Allows edits until the round deadline passes.

---

### 2. Judge Evaluation Portal
- **Assigned Teams Dashboard**: Judges view only the teams assigned to them by organizers.
- **Deliverable Inspection**: Embedded preview links for GitHub repos, presentation decks, and live URLs.
- **4-Tier Quantitative Scoring Rubric**:
  - **🟢 Excellent (10 pts)**
  - **🔵 Good (7 pts)**
  - **🟡 Fair (4 pts)**
  - **🔴 Needs Improvement (2 pts)**
- **Qualitative Feedback**: Rich text area for suggestions and constructive comments.
- **Atomic Scoring**: Automatic total calculation and idempotent score upserting.

---

### 3. Organizer Command Center
- **Live Hackathon Dashboard**: Real-time counter of registered teams, total submissions, pending evaluations, and graded teams.
- **Problem Statement Management**:
  - Add, edit, and delete problem statements with domain tags and capacity limits.
  - Master release toggle: Lock problem statements until the official release moment.
- **Round Configuration**:
  - Create, update, and delete competition rounds.
  - Configure specific deliverable requirements (PPT, Code, Demo, Text) per round.
  - Customize quantitative rubrics and benchmark criteria per round.
  - Set opening start times and closing deadlines.
- **Judge Assignments**:
  - 1-click single or bulk assignment of judges to teams.
- **Platform Access Control**:
  - Pre-approve Google email addresses for Organizer and Judge privileges.
  - Automatically assigns roles upon login; revoke access at any time.
- **Leaderboard Release Switch**:
  - Private preview of live calculations before toggling public visibility.

---

### 4. Public Leaderboard
- **Live Standings**: Ranks all participating teams by aggregated scores across all rounds.
- **Top 3 Podium**: Visual badges and ring styling for 1st, 2nd, and 3rd place.
- **Caching**: 10-second ISR (Incremental Static Regeneration) prevents database thundering herds when hundreds of participants refresh simultaneously.

---

## ⚡ Architecture & High-Concurrency Scaling (500+ Users)

To handle 500+ concurrent students hitting the database simultaneously during problem statement release and submission deadlines, the platform includes:

1. **Atomic PostgreSQL Stored Procedures**:
   - `select_problem_atomic(p_team_id, p_problem_id, p_user_id)`: Uses `SELECT ... FOR UPDATE` row-level locks on `problem_statements` to guarantee that no statement exceeds its maximum team quota.
   - `join_team_atomic(p_invite_code, p_user_id)`: Uses `SELECT ... FOR UPDATE` locks on `teams` to guarantee that no team exceeds 4 members.
2. **13 High-Performance B-Tree Database Indexes**:
   - Indexed foreign keys on `submissions(team_id, round_id)`, `scores(team_id, round_id, judge_id)`, `team_members(team_id, user_id)`, `problem_selections(team_id, problem_id)`, and `users(email, role)`.
3. **In-Memory User & Catalog Caching**:
   - In-memory 5-minute TTL cache in `ensureUser.ts` eliminates duplicate database lookups during authenticated API requests.
   - In-memory 3-second catalog cache in `/api/problems` prevents database connection pool exhaustion during traffic bursts.
4. **Debounced Realtime Listeners**:
   - Event-driven Supabase broadcast with an 8-second cooldown prevents repeated page re-fetches during high traffic bursts.
5. **Server-Side Aggregation RPC & Static ISR**:
   - `get_leaderboard_scores()` computes all team totals directly in PostgreSQL in <5ms.
   - Static 10s ISR caching on `/leaderboard` serves pre-rendered HTML in <2ms.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) | Server & Client Components, Dynamic Routing |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict static typing across all routes and components |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Responsive modern UI with curated dark/light palettes |
| **Auth** | [NextAuth.js](https://next-auth.js.org/) | Google OAuth 2.0 with session role management |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Relational DB, Row Level Security (RLS), Atomic RPCs |
| **Realtime** | Supabase Realtime Channels | Live dashboard synchronization |

---

## 🗄️ Database Schema & Migrations

The database SQL migrations setup:
- **Core Tables**: `users`, `teams`, `team_members`, `rounds`, `submissions`, `scores`, `organizer_emails`, `judge_emails`, `judge_assignments`, `leaderboard_config`, `problem_statements`, `problem_selections`.
- **Atomic Functions**: `select_problem_atomic`, `join_team_atomic`, `get_leaderboard_scores`.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Google OAuth 2.0 Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase Credentials (from Supabase Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

---

## 🚀 Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/karthikraj-code/HACKARE-CIC.git
cd HACKARE-CIC
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` and fill in your Google OAuth and Supabase credentials.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🧪 Scalability & Concurrency Testing Guide

The repository comes with automated benchmark suites to test high-concurrency performance and race conditions:

### 1. Database Atomic Race-Condition Test
Simulates **20+ teams attempting to lock the exact same problem statement at the exact same millisecond**:
```bash
node scripts/test_race_conditions.mjs
```
**Expected Result**:
- `🟢 Accepted (Locked): 2`
- `🔴 Rejected (Capacity Full): 18`
- `🔍 DB Verified Locks: Exactly 2` (Zero duplicates, Zero deadlocks)

### 2. 500+ Concurrent Virtual Users Benchmark
Simulates 500 simultaneous virtual users hitting the cached Leaderboard, Problem Statements API, and Homepage:
```bash
# Start production server
npm run build
npm run start

# In another terminal:
node scripts/stress_test_500.mjs http://localhost:3000
```

### 3. Sustained Traffic Load Test (Autocannon)
Benchmark realistic event traffic under sustained load:
```bash
# Test Leaderboard with 50 persistent connections over 10s
npx autocannon -c 50 -d 10 http://localhost:3000/leaderboard

# Test Problem Statements API
npx autocannon -c 50 -d 10 http://localhost:3000/api/problems
```

---

## 📡 API Routes Reference

### Authentication & User
- `GET /api/user/profile`: Fetches current user profile, team data, and role.

### Participant
- `GET /api/problems`: Returns list of problem statements with real-time slot counts and release status.
- `POST /api/problems/select`: Atomic problem statement locking for team leaders.
- `POST /api/team/create`: Creates a new team and assigns leader.
- `POST /api/team/join`: Atomic team joining via 5-character invite code.
- `POST /api/rounds/submit`: Validates and upserts round submission deliverables.

### Judge
- `POST /api/judge/score`: Submits or updates quantitative criteria scores and qualitative feedback.

### Organizer
- `POST /api/rounds/create`: Creates a new competition round with custom deliverables and rubrics.
- `PUT /api/rounds/[id]`: Updates round details, time limits, or rubric schema.
- `DELETE /api/rounds/delete`: Deletes a round and cascades submissions/scores.
- `POST /api/organizer/problems`: Creates a new problem statement.
- `PUT /api/organizer/problems/[id]`: Updates problem statement details.
- `DELETE /api/organizer/problems/[id]`: Deletes problem statement and unlinks selections.
- `POST /api/organizer/problems/release`: Toggles problem statement release for participants.
- `GET|POST|DELETE /api/organizer/invites`: Manages organizer and judge Google email access control.
- `POST /api/organizer/assign-judge`: Assigns a judge to a team.
- `POST /api/organizer/leaderboard`: Toggles public visibility of the leaderboard.

---

## 🚢 Deployment

### Deploying to Vercel
1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Add all environment variables in **Project Settings -> Environment Variables**.
4. In Google Cloud Console, add your Vercel production domain to the **Authorized redirect URIs**:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```
5. Deploy!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
