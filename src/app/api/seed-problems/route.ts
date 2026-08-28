import { createAdminClient, createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const PROBLEM_STATEMENTS_DATA = [
    // --- 1. Feed Systems & Caching Architecture ---
    {
        statement_code: 'PS-01',
        domain: 'Feed Systems & Multi-Tier Caching',
        title: 'Where Did the Old Reels Go? – Instagram Feed & Cache',
        description: "When an influencer's profile is opened, only the most recent reels load instantly even though thousands exist in total. As the user scrolls further back, older reels must still appear smoothly without the app fetching or rendering everything at once. Your task is to reverse-engineer how Instagram likely handles this at scale — including how content is paginated, what gets cached at the client vs. server, and how storage tiers (hot vs. cold) are organized. Design a simplified system that demonstrates efficient retrieval of historical content using pagination, lazy loading, and layered caching. Clearly justify your choice of cache eviction policy and data-fetching strategy. The final design should show how it avoids unnecessary load while keeping scroll experience seamless",
        max_teams: 2
    },

    // --- 2. Geospatial & Real-Time Dispatch ---
    {
        statement_code: 'PS-02',
        domain: 'Geospatial Indexing & Real-Time Dispatch',
        title: 'Who Gets the Ride? – Rapido/Ola/Uber Rider Allocation',
        description: "In a busy city, thousands of ride requests can hit the platform within the same second, each needing to be matched with an available driver almost instantly. Your task is to design a rider-driver matching engine that decides allocation based on live location, driver availability, distance, estimated time of arrival, and request priority (e.g., surge zones or waiting time). Address how the system avoids double-assigning a driver and how it handles a driver rejecting or timing out on a request. Explore the underlying data structures (e.g., geospatial indexing) needed to search nearby drivers efficiently. The design should balance fairness, speed, and resource utilization under high concurrent load.",
        max_teams: 2
    },

    // --- 3. Video Streaming & CDNs ---
    {
        statement_code: 'PS-03',
        domain: 'Video Streaming & CDN Distribution',
        title: 'One Movie, Millions of Screens – Netflix Streaming',
        description: "When a popular title is released, millions of users may stream it at the exact same time from different regions and devices. Your task is to reverse-engineer how such simultaneous demand is served without a single server buckling under load. Explore how video is broken into segments, how metadata and thumbnails are delivered separately from the main stream, and how content delivery networks (CDNs) cache data closer to users. Design a simplified architecture showing request flow from a user's play button click to the video segment being served. Explain how caching and geographic distribution reduce latency and central server load.",
        max_teams: 2
    },

    // --- 4. Live Broadcasting & Traffic Surge ---
    {
        statement_code: 'PS-04',
        domain: 'Live Broadcasting & Traffic Surge Resilience',
        title: 'Hotstar Peak-Time Challenge – Millions Watching Together',
        description: "During a marquee live event like a cricket final, millions of viewers attempt to start streaming within the same few minutes, creating an extreme, short-duration traffic spike. Your task is to design a system that can absorb this sudden surge without crashing or significantly degrading video quality. Cover load balancing across servers, session management for millions of concurrent viewers, and caching strategies specific to live (not on-demand) content. Discuss how the system scales up rapidly before the event and scales down afterward. The design should highlight trade-offs between cost, latency, and reliability during peak load.",
        max_teams: 2
    },

    // --- 5. Recommendation & Infinite Feeds ---
    {
        statement_code: 'PS-05',
        domain: 'Recommendation Engines & Infinite Feeds',
        title: 'YouTube Infinite Feed – How Does It Keep Loading?',
        description: 'As a user scrolls the YouTube homepage or Shorts feed, new videos keep appearing seamlessly, as if the list never ends. Your task is to recreate a simplified version of this infinite-scroll mechanism. Explain how pagination or cursor-based fetching works behind the scenes, how the next batch of videos is prefetched before the user reaches the end, and how a recommendation engine decides what to fetch next. Address how caching avoids repeated computation of recommendations for the same session. The final design should demonstrate smooth, low-latency continuous loading without ever fetching the "entire" dataset at once.',
        max_teams: 2
    },

    // --- 6. Concurrency & Inventory Booking ---
    {
        statement_code: 'PS-06',
        domain: 'High-Concurrency Ticketing & Lock Serialization',
        title: 'Tatkal Rush – One Train, Thousands of Users',
        description: "At exactly 10 AM, thousands of users simultaneously attempt to book a handful of remaining Tatkal train seats, all racing for the same limited inventory. Your task is to design a booking system that guarantees no seat is sold twice (no double booking) despite this extreme concurrency. Explore concepts like database locking, optimistic vs. pessimistic concurrency control, and request queuing to serialize competing requests fairly. Discuss how the system handles a user who reserves a seat but doesn't complete payment in time. The design must clearly demonstrate consistency and fairness under a massive concurrent write load.",
        max_teams: 2
    },

    // --- 7. Distributed Locking & Real-Time State ---
    {
        statement_code: 'PS-07',
        domain: 'Distributed Locking & State Consistency',
        title: 'Bus Seat Vanishing Act – Real-Time Seat Booking',
        description: 'When only a few bus seats remain, hundreds of users may try to select and book the same seats within seconds of each other. Your task is to design a real-time seat availability system that temporarily locks a seat once a user selects it, preventing others from booking it simultaneously. Address what happens if the user abandons the booking — the lock must expire and release the seat automatically. Cover how the system maintains transactional consistency between seat locking, payment, and final confirmation. The design should prevent both double-booking and seats getting "stuck" as falsely unavailable.',
        max_teams: 2
    },

    // --- 8. Traffic Spikes & Portal Scalability ---
    {
        statement_code: 'PS-08',
        domain: 'High-Load Systems & Read Caching',
        title: 'The Result Day Rush – College Portal Under Pressure',
        description: 'On result day, thousands of students hit the college portal within the same few minutes, causing it to slow down, throw timeouts, or crash entirely. Your task is to first identify the likely bottlenecks — database overload, lack of caching, insufficient server capacity, or no request throttling. Then design a scalable solution using caching (for repeated result lookups), load balancing across servers, request queues to smooth traffic spikes, and database optimization (indexing, read replicas). Also address concurrency control to prevent conflicting reads/writes on student records. The final design should demonstrate graceful handling of a short, extreme traffic spike.',
        max_teams: 2
    },

    // --- 9. Static File Delivery & Edge Caching ---
    {
        statement_code: 'PS-09',
        domain: 'Static Content Delivery & Edge Caching',
        title: 'The Exam Paper Rush – Everyone Downloads at Once',
        description: 'When an exam paper or admit card is released, a huge number of students attempt to download the same file within a very short window. Your task is to design a file-delivery system that can handle this concentrated demand without failing. Explore the role of a CDN and caching in serving the same static file to many users without repeatedly hitting the origin server. Discuss controlled/staggered access mechanisms (e.g., queuing or scheduled release) to prevent overload. The design should ensure fast, reliable downloads for all users despite the traffic being concentrated in a narrow time window.',
        max_teams: 2
    },

    // --- 10. Logistics Optimization & Dispatching ---
    {
        statement_code: 'PS-10',
        domain: 'On-Demand Delivery & Fleet Optimization',
        title: 'Swiggy/Zomato Delivery Allocation',
        description: 'During a lunch or dinner rush, hundreds of food orders are placed at once, each needing to be assigned to an available delivery partner. Your task is to design an allocation algorithm that considers delivery-partner location and availability, current workload (orders already assigned), restaurant location, and estimated delivery time. Address how the system avoids overloading a single delivery partner while also minimizing overall delivery time across all orders. Discuss what happens when no partner is available nearby — does the order wait, or expand the search radius? The design should balance speed, fairness, and partner efficiency at scale.',
        max_teams: 2
    },

    // --- 11. Flash Sales & High-Concurrency Inventory ---
    {
        statement_code: 'PS-11',
        domain: 'Flash Sales & Atomic Inventory Control',
        title: 'Amazon Flash Sale – The Last 100 Phones',
        description: 'During a flash sale, a limited stock of a popular phone (say, 100 units) faces demand from thousands of users clicking "Buy Now" within seconds. Your task is to design a system that maintains accurate inventory count and prevents overselling despite this massive concurrent demand. Explore techniques like atomic decrement operations, request queuing, and caching of "sold out" status to reduce database load. Discuss how the system fairly handles requests that arrive at nearly the same instant. The design should guarantee that exactly the available stock — no more, no less — is sold.',
        max_teams: 2
    },

    // --- 12. Fintech & Transaction Lifecycle ---
    {
        statement_code: 'PS-12',
        domain: 'Fintech & Idempotent Transaction Processing',
        title: 'UPI Payment Storm – Everyone Pays at Once',
        description: 'During a major sale event or festival, thousands of UPI payments are initiated simultaneously across the country, and the system must process each reliably. Your task is to model the transaction lifecycle — initiation, processing, success/failure, and status confirmation — under this heavy concurrent load. Address how the system handles duplicate payment requests (e.g., a user tapping "Pay" twice) and network-related retries without double-charging. Discuss how eventual consistency is managed when a payment\'s final status isn\'t known immediately. The design should ensure that every transaction ends in one, and only one, definitive state.',
        max_teams: 2
    },

    // --- 13. Cloud Storage & File Synchronization ---
    {
        statement_code: 'PS-13',
        domain: 'Cloud Synchronization & Conflict Resolution',
        title: 'Google Drive – Same File, Multiple Devices',
        description: 'A user edits a document on their laptop while the same file is also open or being accessed on their phone or another device. Your task is to design a synchronization system that keeps the file consistent across all devices without losing any changes. Explore how versioning tracks changes over time, how conflicts are detected when two edits happen close together, and what resolution strategy is used (e.g., last-write-wins, merge, or manual conflict resolution). Discuss the role of caching for offline access and how changes are reconciled once the device reconnects. The design should ensure no silent data loss across devices.',
        max_teams: 2
    },

    // --- 14. Presence Systems & Real-Time Messaging ---
    {
        statement_code: 'PS-14',
        domain: 'Real-Time Presence & Heartbeat Management',
        title: 'WhatsApp Last Seen – Who Is Actually Online?',
        description: "At any given moment, millions of users are connecting, disconnecting, and reconnecting to WhatsApp's servers, yet the app must accurately show each contact's \"online\" or \"last seen\" status. Your task is to design a presence-management system that tracks this efficiently at scale. Explore how periodic heartbeat signals confirm a user is still connected, how session state is maintained, and how disconnections (including sudden ones, like a phone dying) are detected without excessive delay. Discuss how this data is pushed to relevant contacts in real time without polling constantly. The design should minimize server load while keeping presence information reasonably accurate.",
        max_teams: 2
    },

    // --- 15. Ephemeral Media & TTL Expiry ---
    {
        statement_code: 'PS-15',
        domain: 'Ephemeral Storage & TTL Lifecycle Expiry',
        title: 'Instagram Stories – 24-Hour Disappearing Content',
        description: 'A story posted by a user must automatically become inaccessible exactly 24 hours after posting, even though it may have received millions of views in that window. Your task is to design the underlying expiry mechanism — deciding whether deletion happens via a scheduled job, lazy check-on-access, or TTL-based storage expiry. Address how media (images/videos) is stored and cached efficiently given its temporary nature, and how view counts are tracked accurately under high concurrent viewing. Discuss trade-offs between immediate deletion (compute-heavy) and lazy expiry (storage-heavy). The design should reliably enforce the 24-hour rule at scale.',
        max_teams: 2
    },

    // --- 16. Audio Streaming & Progressive Buffering ---
    {
        statement_code: 'PS-16',
        domain: 'Audio Streaming & Progressive Buffering',
        title: 'Spotify – Why Does the Song Start So Fast?',
        description: 'When a user taps play on a song, audio begins almost instantly, even though the complete audio file may be several megabytes and hasn\'t fully downloaded yet. Your task is to design a simplified streaming system that explains this near-instant playback. Explore how audio is broken into small chunks that are downloaded and buffered progressively, how playback starts once enough of the initial buffer is ready, and how caching (locally or via CDN) speeds up subsequent plays. Address how the system adapts to changing network conditions (adaptive bitrate) to avoid buffering interruptions. The design should demonstrate smooth playback start and continuity despite incomplete downloads.',
        max_teams: 2
    },

    // --- 17. Graph Algorithms & Real-Time Routing ---
    {
        statement_code: 'PS-17',
        domain: 'Graph Routing & Dynamic Pathfinding',
        title: 'Google Maps – Finding the Fastest Route',
        description: "A user requests directions from point A to B, but traffic conditions along possible routes are constantly changing as thousands of other users' location data streams in. Your task is to build a simplified routing system that selects the fastest path using graph-based algorithms (e.g., Dijkstra's or A*) over a road network. Explore how the system incorporates real-time traffic updates to re-weight edges (roads) dynamically, and how caching of frequently-requested routes reduces recomputation. Discuss how the route is recalculated if conditions change mid-journey. The design should balance accuracy of real-time data against computation speed.",
        max_teams: 2
    },

    // --- 18. Search Engines & Distributed Indexing ---
    {
        statement_code: 'PS-18',
        domain: 'Search Engines & Inverted Indexing',
        title: 'Amazon Search – Finding a Product in Milliseconds',
        description: 'A user searches for a product among hundreds of millions of listings, yet relevant results appear within milliseconds. Your task is to build a simplified search system that supports fast keyword matching across a massive catalog. Explore how an inverted index enables quick lookups instead of scanning every product, how filters (price, brand, rating) narrow results efficiently, and how relevance ranking scores and orders matching products. Discuss how the index is kept up to date as new products are added or prices change. The design should demonstrate the trade-off between index freshness and query speed.',
        max_teams: 2
    },

    // --- 19. Feed Ranking & Personalization ---
    {
        statement_code: 'PS-19',
        domain: 'Feed Ranking & Personalized Algorithms',
        title: 'LinkedIn Feed – What Should You See First?',
        description: "Two different users viewing LinkedIn at the same time see completely different sets of posts in a different order, personalized to each of them. Your task is to design a simplified feed-ranking system that decides what content appears and in what order. Explore how factors like post recency, engagement (likes/comments), the user's relationship with the poster, and topical relevance are combined into a ranking score. Discuss how the system balances fresh content against highly engaging older content, and how it avoids showing the same post repeatedly. The design should produce a personalized, coherent feed ordering for each user.",
        max_teams: 2
    },

    // --- 20. High-Throughput Ingestion & Autosave ---
    {
        statement_code: 'PS-20',
        domain: 'High-Throughput Ingestion & Queue Processing',
        title: 'Online Exam Portal – 10,000 Students Submit at 11:59 PM',
        description: "As the deadline approaches, thousands of students rush to submit their answers within the same final minute, putting extreme write pressure on the system. Your task is to design a submission system that reliably handles this concurrent write burst without losing or corrupting any student's data. Explore how autosave reduces last-minute data loss risk, how request queues smooth the submission spike, and how duplicate submissions (e.g., a student clicking submit twice) are prevented. Discuss the consistency guarantees needed to ensure every valid submission before the deadline is recorded, even under load. The design should demonstrate zero data loss under peak concurrent writes.",
        max_teams: 2
    },

    // --- 21. Resumable Uploads & Network Resilience ---
    {
        statement_code: 'PS-21',
        domain: 'Resumable Uploads & Fault Tolerance',
        title: 'Cloud Drive Upload – 1 GB File on a Slow Network',
        description: 'A user tries to upload a large 1 GB file over an unstable or slow network connection, and the upload keeps failing partway through, forcing a frustrating restart from zero. Your task is to design a robust upload system that tolerates such interruptions gracefully. Explore how the file is split into chunks that are uploaded and tracked independently, how checksums verify each chunk\'s integrity, and how a resumable upload mechanism picks up from the last successfully uploaded chunk rather than restarting. Discuss the retry strategy for failed chunks and how upload state is persisted across sessions or app restarts. The design should guarantee the file eventually uploads completely and correctly despite an unreliable network.',
        max_teams: 2
    }
];

export async function GET() {
    try {
        const supabase = await createAdminClient()

        // 1. Ensure Table structure exists
        const { error: testErr } = await supabase.from('problem_statements').select('id').limit(1);

        if (testErr && testErr.message?.includes('does not exist')) {
            return NextResponse.json({
                error: "Table 'problem_statements' does not exist yet. Please run the problem_statements_migration.sql script in your Supabase SQL Editor first."
            }, { status: 400 });
        }

        // 2. Upsert Problem Statements
        let insertedCount = 0;
        const validCodes = PROBLEM_STATEMENTS_DATA.map(p => p.statement_code);

        for (const ps of PROBLEM_STATEMENTS_DATA) {
            const { error } = await supabase
                .from('problem_statements')
                .upsert([ps], { onConflict: 'statement_code' });
            if (!error) insertedCount++;
        }

        // Remove any obsolete statements that have no team selections
        const { data: activeSelections } = await supabase
            .from('problem_selections')
            .select('problem_id');
        const activeProblemIds = activeSelections?.map(s => s.problem_id) || [];

        const { data: allDbStatements } = await supabase
            .from('problem_statements')
            .select('id, statement_code');

        if (allDbStatements) {
            for (const item of allDbStatements) {
                if (!validCodes.includes(item.statement_code) && !activeProblemIds.includes(item.id)) {
                    await supabase.from('problem_statements').delete().eq('id', item.id);
                }
            }
        }

        // 3. Setup Official Rounds
        const now = new Date();
        const round1End = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1); // 1 day
        const round2End = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2); // 2 days
        const round3End = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4); // 4 days

        const round1Data = {
            name: 'Round 1: Problem Definition & System Architecture (PPT)',
            description: 'Formulate your problem understanding, proposed AI/Tech solution, system architecture diagram, tech stack, and implementation roadmap in a presentation.',
            start_time: now.toISOString(),
            end_time: round1End.toISOString(),
            round_number: 1,
            submission_type: ['problem_architecture_ppt'],
            rubric: {
                'Problem Understanding & Clarity': 10,
                'Proposed Solution & Innovation': 10,
                'System Architecture & Technical Feasibility': 15,
                'Presentation & Documentation': 5
            }
        };

        const round2Data = {
            name: 'Round 2: Intermediate Prototype & Core Implementation',
            description: 'Midway development milestone. Submit your GitHub repository, working prototype or API endpoints demo, and progress on core AI modules.',
            start_time: round1End.toISOString(),
            end_time: round2End.toISOString(),
            round_number: 2,
            submission_type: ['product_code_demo'],
            rubric: {
                'Core Module Implementation': 10,
                'Code Quality & Repository Structure': 10,
                'Prototype Progress & Feasibility': 10
            }
        };

        const round3Data = {
            name: 'Round 3: Final Working Product & Code Demonstration',
            description: 'Final working product evaluation. Submit your complete source code repository, live deployed application link, and a walkthrough demo video demonstrating the full working product.',
            start_time: round2End.toISOString(),
            end_time: round3End.toISOString(),
            round_number: 3,
            submission_type: ['product_code_demo'],
            rubric: {
                'Working Product & Core Functionality': 15,
                'Live Deployment & UX': 10,
                'Innovation & Real-World Impact': 5
            }
        };

        // Check and sync Rounds
        const { data: existingRounds } = await supabase.from('rounds').select('*');

        const r1 = existingRounds?.find(r => r.round_number === 1 || r.name?.toLowerCase().includes('round 1'));
        if (r1) {
            await supabase.from('rounds').update(round1Data).eq('id', r1.id);
        } else {
            await supabase.from('rounds').insert([round1Data]);
        }

        const r2 = existingRounds?.find(r => r.round_number === 2 || (r.name?.toLowerCase().includes('round 2') && !r.name?.toLowerCase().includes('round 3')));
        if (r2) {
            await supabase.from('rounds').update(round2Data).eq('id', r2.id);
        } else {
            await supabase.from('rounds').insert([round2Data]);
        }

        const r3 = existingRounds?.find(r => r.round_number === 3 || r.name?.toLowerCase().includes('round 3') || r.name?.toLowerCase().includes('final'));
        if (r3) {
            await supabase.from('rounds').update(round3Data).eq('id', r3.id);
        } else {
            await supabase.from('rounds').insert([round3Data]);
        }

        // Delete any old extraneous rounds if exists
        const extraRounds = existingRounds?.filter(r => r.id !== r1?.id && r.id !== r2?.id && r.id !== r3?.id && (r.round_number > 3 || !r.round_number)) || [];
        for (const er of extraRounds) {
            if (er.name?.includes('Round 4') || er.name?.includes('Round 5') || er.name?.includes('Round 6') || er.name?.includes('Round 7') || er.name?.includes('T-Learn') || er.name?.includes('Worst UI') || er.name?.includes('Debate') || er.name?.includes('Quiz') || er.name?.includes('Data Preprocessing') || er.name?.includes('Shark Tank')) {
                await supabase.from('rounds').delete().eq('id', er.id);
            }
        }

        // Whitelist default organizer email
        await supabase
            .from('organizer_emails')
            .upsert([{ email: '99230040479@klu.ac.in' }], { onConflict: 'email' });
        await supabase
            .from('users')
            .update({ role: 'organizer' })
            .eq('email', '99230040479@klu.ac.in');

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${insertedCount} problem statements, configured competition rounds, and verified organizer access.`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
