/**
 * HACKARE Atomic Race-Condition & Capacity Limit Test
 * 
 * Simulates simultaneous requests hitting atomic stored procedures to verify:
 * 1. Problem statements strictly enforce max_teams = 2 under high concurrency.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

// Parse .env.local manually
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
                const key = trimmed.slice(0, idx).trim();
                const val = trimmed.slice(idx + 1).trim();
                process.env[key] = val;
            }
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testAtomicProblemLocking() {
    console.log(`\n======================================================`);
    console.log(`🧪 ATOMIC PROBLEM LOCKING RACE-CONDITION TEST`);
    console.log(`   Simulating 20 teams attempting to lock the SAME problem statement simultaneously.`);
    console.log(`======================================================\n`);

    // 0. Ensure we have a valid test user in public.users
    let { data: testUser } = await supabase.from('users').select('id').limit(1).maybeSingle();
    if (!testUser) {
        const { data: newUser } = await supabase
            .from('users')
            .insert([{
                name: 'Stress Test Leader',
                email: `stress-test-${Date.now()}@hackare.test`,
                role: 'participant'
            }])
            .select()
            .single();
        testUser = newUser;
    }

    if (!testUser) {
        console.error('Could not get or create a valid user for testing');
        return;
    }

    // 1. Create a test problem statement with max_teams = 2
    const testCode = `TEST-${Date.now().toString().slice(-4)}`;
    const { data: problem, error: pErr } = await supabase
        .from('problem_statements')
        .insert([{
            statement_code: testCode,
            title: 'Automated Concurrency Test Problem',
            domain: 'AI & Concurrency',
            description: 'Concurrency stress testing statement',
            max_teams: 2
        }])
        .select()
        .single();

    if (pErr || !problem) {
        console.error('Failed to create test problem:', pErr);
        return;
    }

    console.log(`✅ Created Test Problem: ${problem.statement_code} (Capacity: 2 Teams)`);

    // 2. Create 20 test teams
    console.log(`⏳ Creating 20 test teams in database...`);
    const teamIds = [];
    for (let i = 1; i <= 20; i++) {
        const { data: team, error: tErr } = await supabase
            .from('teams')
            .insert([{
                team_name: `ConcurrencyTeam-${Date.now()}-${i}`,
                team_code: `T${i}-${Date.now().toString().slice(-3)}`,
                leader_id: testUser.id,
                invite_code: `C${Date.now().toString().slice(-3)}${i}`.slice(0, 5).toUpperCase()
            }])
            .select()
            .single();
        if (team) teamIds.push(team.id);
        if (tErr) console.error('Team insert error:', tErr);
    }

    console.log(`✅ Created ${teamIds.length} test teams.`);
    console.log(`🚀 Firing 20 simultaneous atomic lock requests at the EXACT same millisecond...`);

    // 3. Fire atomic locking RPC simultaneously
    const results = await Promise.all(
        teamIds.map(teamId =>
            supabase.rpc('select_problem_atomic', {
                p_team_id: teamId,
                p_problem_id: problem.id,
                p_user_id: testUser.id
            })
        )
    );

    // 4. Verify results
    const successes = results.filter(r => r.data?.success === true);
    const rejected = results.filter(r => r.data?.success === false || r.error);

    console.log(`\n📊 CONCURRENCY EXECUTION RESULTS:`);
    console.log(`   🟢 Accepted (Locked): ${successes.length}`);
    console.log(`   🔴 Rejected (Capacity Full): ${rejected.length}`);

    // Verify actual DB count
    const { count } = await supabase
        .from('problem_selections')
        .select('*', { count: 'exact', head: true })
        .eq('problem_id', problem.id);

    console.log(`   🔍 Database Verified Records in problem_selections: ${count}`);

    if (count === 2 && successes.length === 2) {
        console.log(`\n🎉 PASS: Atomic stored procedure successfully prevented race conditions! Exactly 2 teams locked.`);
    } else if (count > 2) {
        console.error(`\n❌ FAIL: Race condition detected! ${count} teams locked (expected max 2).`);
    } else {
        console.log(`\nℹ️ RPC Results Summary:`, { accepted: successes.length, rejected: rejected.length });
    }

    // Cleanup test problem & teams
    await supabase.from('problem_statements').delete().eq('id', problem.id);
    await supabase.from('teams').delete().in('id', teamIds);
    console.log(`🧹 Cleaned up temporary test data.\n`);
}

testAtomicProblemLocking();
