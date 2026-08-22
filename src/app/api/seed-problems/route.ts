import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const PROBLEM_STATEMENTS_DATA = [
    // --- 1. Campus Intelligence & Knowledge ---
    {
        statement_code: 'PS-01',
        domain: 'Campus Intelligence & Knowledge',
        title: 'The Campus That Forgot',
        description: 'Every year, students at a university build projects, publish research, win competitions, and organize events. But when they graduate, much of that knowledge disappears with them. Important files are scattered across drives, emails, WhatsApp groups, and old folders. A junior working on a similar project may spend weeks searching for information that already exists. The university wants to build an intelligent institutional memory. Imagine a system that can understand the university\'s past and make it useful for the future. Can it automatically organize years of documents and achievements? Can students ask questions about previous projects and instantly find relevant work? Can it identify repeated problems, missing knowledge, or opportunities for new projects? Build a solution that ensures no great idea is forgotten when its creator leaves.',
        max_teams: 3
    },

    // --- 2. Food Sustainability & Supply Chain ---
    {
        statement_code: 'PS-02',
        domain: 'Food Sustainability & Supply Chain',
        title: 'The Market That Wastes Food',
        description: 'Every morning, local markets receive fresh vegetables, fruits, and other perishable goods from different suppliers. By the end of the day, some vendors run out of popular items while others are left with large quantities that nobody wants to buy. The next morning, the cycle starts again. Most vendors make stocking decisions based on experience and intuition. Weather changes, local events, weekends, festivals, and changing customer preferences can completely alter demand. The result is lost income for vendors and thousands of kilograms of perfectly usable food going to waste. Imagine a system that could help vendors understand what tomorrow might look like. Can it predict demand for different products? Can it identify items likely to become surplus? Can it suggest better purchasing or pricing decisions before the waste happens? Build a solution that helps markets sell smarter and waste less.',
        max_teams: 3
    },

    // --- 3. Disaster Management & Emergency Response ---
    {
        statement_code: 'PS-03',
        domain: 'Disaster Management & Emergency Response',
        title: 'When the City Goes Dark',
        description: 'At 8:30 PM, a powerful storm hits a city. Within an hour, several roads are flooded, electricity goes down in multiple neighborhoods, and emergency calls begin increasing. The city\'s response teams have information coming from weather systems, traffic cameras, hospitals, citizens, and field officers — but each source tells only a small part of the story. Meanwhile, emergency teams must decide where to send ambulances, rescue personnel, generators, and other resources first. A delayed decision could leave an entire neighborhood without help. What if all this information could be brought together into one intelligent system? Can it identify areas at greatest risk? Can it prioritize emergency requests based on severity and location? Can it help authorities understand how the situation is changing in real time? Build the intelligence that helps a city respond before chaos takes over.',
        max_teams: 3
    },

    // --- 4. Smart Agriculture & Climate Tech ---
    {
        statement_code: 'PS-04',
        domain: 'Smart Agriculture & Climate Tech',
        title: "The Farmer's Gamble",
        description: 'For a farmer, planting a crop is a decision that can determine the success of an entire season. But today\'s conditions are becoming harder to predict. Rain may arrive early or disappear for weeks. A pest outbreak can spread across fields. Fertilizer prices change, while the market price of a crop may fall just before harvest. Farmers often have access to weather forecasts, soil information, market prices, and agricultural advice — but these sources rarely work together. Imagine bringing all of this information into one place. Can your system identify risks before they seriously affect a crop? Can it recommend suitable crops or planting periods? Can it help farmers make decisions based on both environmental conditions and expected returns? Turn uncertainty into better decisions for the people who grow our food.',
        max_teams: 3
    },

    // --- 5. Healthcare & Emergency Navigation ---
    {
        statement_code: 'PS-05',
        domain: 'Healthcare & Emergency Navigation',
        title: "The Ambulance That Couldn't Wait",
        description: 'An emergency call comes in at 6:15 PM. An ambulance is dispatched, but it\'s rush hour. The usual route is heavily congested, one road has temporary construction, and the nearest hospital is already receiving multiple emergency patients. The ambulance driver has only minutes to make decisions. Traditional navigation can find a route, but it may not understand the entire emergency situation. What if the system could think beyond simply finding the shortest path? Can it identify the fastest route using live traffic and road conditions? Can it recommend a hospital based on emergency type and current capacity? Can it continuously adapt as conditions change? Build a system that helps emergency teams spend less time navigating and more time saving lives.',
        max_teams: 3
    },

    // --- 6. Retail Analytics & Small Business Tech ---
    {
        statement_code: 'PS-06',
        domain: 'Retail Analytics & Small Business Tech',
        title: "The Small Shop's Big Problem",
        description: 'A neighborhood grocery store has been running for fifteen years. The owner knows his regular customers and remembers which products usually sell. But the business is growing, and intuition isn\'t enough anymore. Some products frequently run out. Others remain on shelves until they expire. During festivals, demand suddenly changes, while unexpected weather can completely alter buying patterns. Large retail companies solve these problems using sophisticated analytics, but small businesses rarely have access to such tools. Can you build an affordable system that helps a small store understand its business? Can it predict which products will be needed next week? Can it identify slow-moving or soon-to-expire stock? Can it uncover patterns in customer purchases that the owner might miss? Give a small business the intelligence to compete with the big ones.',
        max_teams: 3
    },

    // --- 7. Smart Buildings & Energy Management ---
    {
        statement_code: 'PS-07',
        domain: 'Smart Buildings & Energy Management',
        title: "The Building That Couldn't Breathe",
        description: 'A large commercial building looks perfectly normal from the outside. Inside, however, energy consumption keeps rising. Air-conditioning runs in empty rooms, lights remain switched on, and some floors are barely occupied while others are crowded. The building already has sensors, electricity meters, and access systems — but nobody is connecting the information. The management wants to reduce energy consumption without making the building uncomfortable for the people inside. Can you build a system that understands how the building is actually being used? Can it predict energy demand throughout the day? Can it detect unusual consumption and identify possible wastage? Can it recommend when systems should be adjusted automatically? Make buildings smarter without making people change how they live.',
        max_teams: 3
    },

    // --- 8. Urban Infrastructure & Maintenance ---
    {
        statement_code: 'PS-08',
        domain: 'Urban Infrastructure & Maintenance',
        title: 'The Road That Slowly Disappears',
        description: 'A city maintains thousands of kilometers of roads. Every day, small cracks, potholes, faded markings, damaged signs, and drainage problems appear across them. Most are reported only after someone notices a serious problem — sometimes after an accident has already happened. Maintenance teams cannot inspect every road every day. The city wants to move from reacting to damage to predicting it. Can you build a system that identifies road problems using images, sensors, citizen reports, or historical maintenance data? Can it determine which problems are most urgent? Can it predict which roads are likely to deteriorate next? Help a city fix its roads before its citizens have to complain.',
        max_teams: 3
    },

    // --- 9. Logistics & Supply Chain Tracking ---
    {
        statement_code: 'PS-09',
        domain: 'Logistics & Supply Chain Tracking',
        title: 'The Package That Went Missing',
        description: 'A delivery company handles thousands of packages every day. Most reach their destination without a problem, but some are delayed, damaged, misrouted, or completely lost somewhere between warehouses. When something goes wrong, employees often have to manually trace the package through dozens of checkpoints. The company already records scans, locations, timestamps, vehicle details, and delivery attempts — but this information is rarely used proactively. Can you build a system that understands the journey of every package? Can it identify shipments likely to be delayed before they actually are? Can it detect unusual movement patterns? Can it help determine where a package is most likely to have gone missing? Don\'t just track packages. Predict when their journey is about to go wrong.',
        max_teams: 3
    },

    // --- 10. Smart Tourism & Travel Tech ---
    {
        statement_code: 'PS-10',
        domain: 'Smart Tourism & Travel Tech',
        title: "The Tourist Who Couldn't Find the Real City",
        description: 'A tourist arrives in a new city with hundreds of places to explore. Search engines show the most popular attractions, but they don\'t understand what the person actually wants. One traveler may love hidden historical places. Another may want local food. Someone else may have only three hours and want to avoid crowded locations. The city already has information about landmarks, restaurants, events, traffic, weather, and visitor patterns — but it exists in disconnected places. Can you build a system that creates experiences rather than simply listing places? Can it understand a traveler\'s interests and constraints? Can it adapt the plan as weather, crowds, or time changes? Can it help visitors discover places they might never have searched for? Don\'t show tourists the city everyone visits. Help them discover their own version of it.',
        max_teams: 3
    },

    // --- 11. Smart Transit & Campus Commute ---
    {
        statement_code: 'PS-11',
        domain: 'Smart Transit & Campus Commute',
        title: 'The Journey Before the Campus',
        description: 'Hi, I’m Meera. I’m a day scholar, and every morning I travel from Madurai to Krishnankoil to reach my college. My first class starts at 9:00 AM, so getting to college on time is something I have to plan for every single day. I depend on public buses for my journey. Usually, I know which bus I need to take and roughly when I should reach the bus stop. But one morning, things didn\'t go as planned. I reached my usual bus stop and waited for my bus. Ten minutes passed. Then twenty minutes passed. More students and passengers started gathering around me. I didn\'t know whether my bus was delayed, had already passed, or whether another bus was coming. When the bus finally arrived, it was already crowded. I somehow managed to get in, but then we got stuck in heavy traffic. I kept looking at the time: 7:15 AM. My first class was getting closer, but I still didn\'t know when I would reach Krishnankoil. I started wondering, Should I continue on this bus? Should I get down and take another one? Is there a faster route? Will another bus even have space? The frustrating part was that I had no reliable way to make that decision. The buses were running. The routes and schedules existed. The drivers and transport operators were doing their jobs. But when something unexpected happened—a delay, traffic, overcrowding or a breakdown—I had very little information about what was actually happening. And I know I\'m not the only one. Every morning, students travel from different parts of the city towards the same campus. A problem on one route can affect dozens of students. A crowded bus can leave people behind. A traffic disruption can make hundreds of students late. We often know there is a problem only after we are already experiencing it. I started wondering what would happen if the transportation system could understand what was happening before I reached the bus stop. What if I could know that my bus was delayed before leaving home? What if the system could predict that a particular route was becoming overcrowded? What if it could suggest another bus or route before I was already late? What if the college could know that hundreds of students were likely to arrive late and prepare for it? I don\'t think we need just another app that shows where a bus is. I want a system that understands my journey. From the moment I leave home in Madurai, through my public-transport journey, to the moment I reach Krishnankoil and walk into my 9:00 AM class. If you were given the chance to redesign the journey for students like me, how would you make public transportation more predictable, connected and responsive? What would you build?',
        max_teams: 3
    },

    // --- 12. Campus Dining & Crowd Management ---
    {
        statement_code: 'PS-12',
        domain: 'Campus Dining & Crowd Management',
        title: 'The Queue That Keeps Growing',
        description: 'Hi, I’m Arjun and I usually have only about 50 minutes for lunch between my classes. One afternoon, I reached the campus canteen at 12:30 PM. The moment I got there, I saw a huge crowd. One counter had a long queue stretching across the hall, while another counter had hardly anyone waiting. I joined the shorter looking queue, but it barely moved. Students kept arriving. Some were checking the time because their next class was about to start. Others were leaving the queue because they couldn\'t afford to wait any longer. Meanwhile, the kitchen staff were trying to serve everyone, but they couldn\'t clearly see where the demand was building up or which items were suddenly becoming popular. What surprised me was that the problem wasn\'t really the number of students. It was that nobody had a clear picture of what was happening across the canteen at that moment. The canteen has counters, staff, menus, payment systems and historical information about daily demand. But when hundreds of students arrive at the same time, the situation changes minute by minute. By the time staff realise that one counter is overloaded, the queue has already become a problem—and for students, a long queue isn\'t just an inconvenience. It can mean skipping lunch, missing a class or spending more money elsewhere. What if the system could understand how many people were arriving, where queues were forming, what counters were busy and how demand was changing? What if it could help students choose better options while helping the canteen adjust before the crowd becomes unmanageable? If you had to redesign the campus dining experience, how would you make the system understand demand and respond before a queue becomes a problem? What would you build?',
        max_teams: 3
    },

    // --- 13. Campus Space & Resource Optimization ---
    {
        statement_code: 'PS-13',
        domain: 'Campus Space & Resource Optimization',
        title: 'The Empty Room',
        description: 'Hi, I’m Karthik and my team has a project submission tomorrow. We need a quiet place to work, so we decide to find an available classroom after our regular classes finish. We checked block. Nothing. We check another. Every room appears to be occupied or reserved. After walking around for almost twenty minutes, we finally find a classroom that looks empty. But there is a notice on the door saying the room has been reserved. So we leave. Later that evening, we discover something frustrating. That room was never actually being used and it wasn\'t the only one. Across campus, classrooms, seminar halls, meeting rooms and laboratories can remain unused for hours while students and faculty struggle to find available space. The campus knows which rooms exist and which rooms are scheduled. But a schedule doesn\'t always represent what is actually happening right now. A room may be booked but unused. Another may suddenly be needed by a student team. A faculty member may finish a session early. An event may be cancelled. The result is a strange situation: There may be empty spaces everywhere, but nobody knows where they are. What if the campus could understand how spaces were actually being used? What if students could find suitable available spaces without revealing unnecessary personal information? What if administrators could identify underused rooms and make better decisions about campus resources? If you had to redesign the way people discover and use campus spaces, how would you make the system understand real time availability and connect the right people with the right space? What would you build?',
        max_teams: 3
    },

    // --- 14. Campus Administration & Service Routing ---
    {
        statement_code: 'PS-14',
        domain: 'Campus Administration & Service Routing',
        title: 'The Appointment That Took All Morning',
        description: 'Hi, I’m Arjun. I had to visit the campus administration office one morning to get a simple document processed. I thought it would take 10 or 15 minutes. I reached the office around 10:00 AM and found a long queue outside. I wasn\'t sure whether I needed to take a token, which counter I should go to, or whether the person handling my request was even available that day. I asked someone nearby, and they pointed me towards one counter. After waiting for some time, I was told that my request had to be handled somewhere else. So I moved to another counter. Another queue… Another wait…!! By the time I reached the right person, almost an hour had passed. What made it frustrating was that the office wasn\'t necessarily overloaded everywhere. One counter had a long queue, while another had very few people. Some students were waiting for services that could have been completed much faster if they had known where to go. The campus already has offices, staff, counters, notice boards and online information. But when a student actually needs a service, the information is often scattered across different places. Students don\'t always know which office handles their request, what documents they need, whether the concerned staff member is available, or how long they might have to wait. And the staff face a different problem. They may not know how many students are coming, which services are creating the largest queues, or where additional support is needed until the crowd has already formed. A simple request can therefore turn into an entire morning of waiting, walking between offices and asking for directions. We need to rethink how students access campus services. What if a student could simply explain what they need and be guided to the right office, counter or staff member? What if the system could show current waiting times, available service slots and required documents before the student arrives? What if appointments and walk-ins could be coordinated based on actual demand, while helping staff understand where queues are building? What if a student could complete simple requests digitally without having to stand in a queue at all? A better system could save students hours while helping campus offices manage their workload more effectively. If you had to redesign the way students access campus services, how would you make the experience simpler, more predictable and less dependent on standing in the wrong queue? What would you build?',
        max_teams: 3
    },

    // --- 15. Campus Peer Logistics & Community Network ---
    {
        statement_code: 'PS-15',
        domain: 'Campus Peer Logistics & Community Network',
        title: 'The Connection Point',
        description: 'Hi, I’m Aman. It was around 10:30 in the morning. I was sitting in the library, going through my presentation one last time. PPT was ready. Notes were ready. Everything was sorted. I had about 40 minutes left. I packed my things, got up, and just before leaving, I checked my bag one more time. And that’s when I realised… The file wasn’t there. I remembered leaving it on my table in the hostel. I looked at the time. Going back, finding it, and coming all the way to the academic block would take almost the entire time I had. So I just stood there thinking… Now what? I opened my phone and started scrolling through my contacts. I could call a friend. But what if they weren\'t in the hostel? I could ask in a group. But what if nobody was coming this side? And then I thought… There are so many students moving around campus right now. Someone must already be coming from the hostel towards the academic block. I just needed to find that one person and that\'s when a simple thought became a bigger question: How do you ask a stranger for help without having to completely trust a stranger? How do you know who is genuine? How do you make sure the right item reaches the right person? And how do you do all of this without sharing more personal information than necessary? That small moment in the library made us look at something that happens every day across a campus. People are constantly moving. Things are constantly being forgotten, needed, picked up and carried. Can we make those two movements meet safely and intelligently….? What would you build?',
        max_teams: 3
    },

    // --- 16. Student Productivity & Academic Life ---
    {
        statement_code: 'PS-16',
        domain: 'Student Productivity & Academic Life',
        title: 'Everything I Know Is Somewhere',
        description: 'Hi, I’m Nikhil. Every morning, before I even leave my room, I have to figure out what my day looks like. My classes are in one place. My assignments are on another platform. Faculty announcements arrive through email or WhatsApp. My project team has its own group. Club activities come through another channel. Workshops and events are usually somewhere else. None of these things are particularly difficult to manage on their own. The problem is that I have to remember all of them at the same time. One Monday morning, I check my timetable and see that my first class starts at 9:00 AM. I remember that I have a project meeting in the evening, but I don\'t remember exactly when. Somewhere in my messages, my teammate had mentioned a change. I also know that an assignment is due soon, but I have to search through the learning portal to find the exact deadline. I leave for class thinking I have everything under control. During the day, things keep changing. A faculty member sends a new announcement. A meeting gets moved. My project team needs something from me. An assignment deadline gets closer. A workshop I registered for is happening that evening. None of these things are impossible to handle. But I am constantly switching between systems, messages, calendars and portals just to understand what I should be doing next. Sometimes I miss something important. Sometimes I remember a deadline only when it becomes urgent. Sometimes I spend ten minutes searching for information that I had already received somewhere and sometimes I don\'t even realise that two things on my schedule are going to conflict until it\'s too late. The college already gives me most of the information I need. The problem isn\'t a lack of information. There is almost too much of it. My timetable knows when I have class. My learning platform knows about assignments. My calendar knows about events. My messages contain conversations. My project team knows what needs to be done. But none of these systems really understand my day as a whole. They tell me what exists. They don\'t necessarily help me understand what matters right now. And every student is different. One student may have three assignments and no club activities. Another may spend the evening working on a project. Someone else may be travelling from home and have limited time on campus. Giving everyone the same notifications and the same information doesn\'t necessarily help everyone equally. What if we rethink how students interact with everything happening around them? What if a student could bring together the information that matters to them and make sense of it in one place? What if the system could understand that an assignment is due tomorrow, a project meeting was moved, and the student has only one free hour available today? What if it could help the student prioritise without making decisions for them? What if it could notice conflicts before they happen, surface important information at the right moment, and adapt to the way each student actually works? But if such a system understands a student\'s schedule, activities, documents, preferences and conversations, how much should it know? What information should stay private? Who should have access to it? Should it simply respond when the student asks, or should it proactively help? And most importantly, how can technology support a student\'s decisions without taking control of them? If you were asked to redesign the way a student manages their academic, personal and campus life, how would you turn scattered information into something genuinely useful, personalised and trustworthy? What would you build?',
        max_teams: 3
    },

    // --- 17. Student Services & University Navigation ---
    {
        statement_code: 'PS-17',
        domain: 'Student Services & University Navigation',
        title: 'The Answer Was Somewhere',
        description: 'Hi, I’m Ananya. Yesterday, I lost my college ID card. I realised it when I was about to enter the library. I checked my bag, went back to the places I had visited, and asked a few friends, but I couldn\'t find it. I knew I had to report it and get a replacement. But I didn\'t know where to start. Should I go to security? Should I inform my department? Do I need to submit a complaint? Is there a form? Do I need to pay for a replacement? Can I get a temporary ID until I receive the new one? I opened the college website and started searching. I found some information about student services, but nothing clearly explained what I needed to do. I found another document, but I wasn\'t sure whether the information was still current. So I asked a friend. They told me to check with the security office. Security asked me to contact the administration office. The administration office told me I needed to submit a form. I didn\'t have the form. I had to go searching again. The process itself probably wasn\'t complicated. Finding the process was—and losing an ID card is only one situation. A student might lose an important document, need a certificate, report a hostel issue, request permission for an event, find a particular office, ask about a campus service, report a maintenance problem, or simply need to know who can help with something. In most cases, the university already has the information. It may exist in a website, PDF, circular, handbook, student portal, notice board, department office or with a particular staff member. But from a student\'s point of view, these feel like different doors to the same university. The student has to know which door to open first and sometimes, even after finding the right information, there are more questions. Which form do I need? What documents should I carry? Where do I submit it? Is there a deadline? Do I need approval from someone else? What happens after I submit it? The problem becomes even harder when information changes or depends on the student\'s situation. A process for a hostel resident may be different from that of a day scholar. A first year student may follow a different procedure from a final year student. Some information may be public, while other information should only be available to authorised students or staff. The university may have all the answers, but the student shouldn\'t have to understand how the entire university is organised just to find one. We need to rethink how students navigate information, processes and services across a campus. What if a student could simply explain what happened and what they are trying to accomplish, instead of first figuring out which department handles it? What if they could be guided through the correct process, understand the required documents, find the right office or person, and know what happens next? What if information from different campus systems could come together in a way that is clear, current and relevant to that particular student? and when the information isn\'t clear, what if the system could recognise that instead of giving a confident but incorrect answer and connect the student to the right person? If you had to redesign the way a student finds help and navigates university processes, how would you make it easier to go from “I have a problem” to “I know exactly what to do next”? What would you build?',
        max_teams: 3
    },

    // --- 18. Talent Discovery & Peer Collaboration ---
    {
        statement_code: 'PS-18',
        domain: 'Talent Discovery & Peer Collaboration',
        title: 'The Missing Piece',
        description: 'Hi, I’m Arjun. A few weeks ago, my friends and I came up with an idea for our semester project. We were excited about it because we thought it could solve a problem we had seen on campus. We divided the initial work between us and started building. For the first few days, everything went well. Then we reached a part of the project that none of us had worked with before. We tried learning it ourselves. We watched tutorials. We searched documentation. We asked a few friends. We made some progress, but it was taking much longer than expected. We knew there were students on campus who had already worked with the technology we needed. We had seen their projects during hackathons, workshops and exhibitions. But we didn\'t know who they were or how to reach them. We started asking around. One person gave us a name. Another suggested someone from a different department. Someone else mentioned a senior who had done something similar last year. We contacted a few people, but some were busy, some weren\'t interested, and some had completely different areas of experience. Meanwhile, our project deadline was getting closer. What frustrated us most was that the campus wasn\'t lacking people who could help. The knowledge, experience and skills we needed were probably already somewhere around us. We simply couldn\'t discover them at the moment we needed them. And we realised this wasn\'t only happening to us. Students looking for project members often depend on friends they already know. Students searching for someone with a particular skill may post in a group and hope the right person sees it. Someone willing to help may never know that another student is looking for exactly that kind of experience. Even when two people do find each other, there are other questions. Do they actually have the experience they claim? Are they available? Are they interested in the same kind of work? Are they looking for a teammate, a mentor, or simply someone who can answer one question? The campus had the people. The connections just weren\'t obvious. We started wondering what would happen if students could discover opportunities and people beyond the circles they already knew. What if the right connection could happen because of a shared interest, experience, project or goal rather than simply because two students happened to know the same person? What if the experience could remain useful without turning every student\'s personal information into something publicly searchable? And what if there were a way to build trust around experience without relying entirely on what someone claims about themselves? There may be thousands of students on a campus, each carrying different skills, experiences, interests and ideas. The challenge is understanding how those pieces could come together when they are needed. If you were asked to rethink how students discover and connect with the opportunities, knowledge and people already around them, what would you change? What would you build?',
        max_teams: 3
    },

    // --- 19. Indoor Wayfinding & Campus Navigation ---
    {
        statement_code: 'PS-19',
        domain: 'Indoor Wayfinding & Campus Navigation',
        title: 'The Wrong Turn',
        description: 'Hi, I’m Meera. It was my first week on campus, and I had an important induction programme at 10:00 AM. The hall was in a building I had never visited before. I checked the timetable. It gave me the building name and room number, so I thought finding it would be easy. I started walking. I reached one building that looked similar to the location shown on the map, but I wasn\'t sure if I was in the right place. I asked a student nearby, and they pointed me towards another block. I followed the direction. After a few minutes, I realised I had taken the wrong turn. I checked the map again. It showed where I was, but it didn\'t really help me understand which entrance I should use, which floor I needed, or whether I was actually heading towards the correct room. I asked another person. They gave me a different direction. By the time I finally reached the hall, I was already worried about being late. Later, I realised that the problem wasn\'t simply that I couldn\'t find the building. The campus had maps, signboards and people who knew the way. I just didn\'t have the right information at the right moment. A campus can change throughout the day. A building may have multiple entrances. A particular pathway may be closed. A room may be temporarily shifted. A new student may not know the difference between two similar looking blocks. A visitor may not understand campus abbreviations or building names that regular students use every day. Even a normal map may tell someone where a place is, without helping them understand how to actually get there from where they are standing. And not everyone navigates in the same way. Someone carrying equipment may need a different route. Someone in a hurry may prefer the shortest path. Someone unfamiliar with the campus may need clearer landmarks rather than just a line on a map. We need to rethink what campus navigation means. What if a student could simply say where they need to go and receive directions based on their current situation? What if the system could understand entrances, floors, landmarks, temporary closures and changing campus conditions? What if it could recognise when someone has taken a wrong turn and help them recover instead of making them start the journey again? What if the same system could work for students, faculty, visitors and emergency responders while avoiding unnecessary collection or sharing of a person\'s location? If you had to redesign the way people find their way around a large and constantly changing campus, how would you make navigation understand not just where a place is, but what the person actually needs to reach it? What would you build?',
        max_teams: 3
    },

    // --- 20. Campus Services & On-Demand Printing ---
    {
        statement_code: 'PS-20',
        domain: 'Campus Services & On-Demand Printing',
        title: 'Everything Was Ready',
        description: 'Hi, I’m Varshitha. Our project review was the next morning and my team had finally finished the report after working on it for almost a week. We had the PPT ready, the report was completed and our project files were on my laptop. The only thing left was to get the report printed and submit the required copies… I thought, This will take just five minutes…!! I went to the Xerox centre around 4:30 PM. There were already quite a few students waiting. Some were printing assignments, some were taking photocopies, and others were getting documents scanned. When my turn came, I sent my report to the operator. Then I realised that our guide had asked us to print a few pages in colour and the remaining pages in black and white. The colour printer was already busy. I waited. After some time, the operator asked me to resend the file because the previous file wasn\'t opening properly. I sent it again. Meanwhile, more students joined the queue. I kept checking the time because the submission counter would close at 5:00 PM. Everything I needed was already ready. My report was ready. My team was ready. I was ready. But getting those final copies took much longer than I expected. I finally got the documents and rushed to submit them. On my way back, I started thinking about how often this happens on campus. Students regularly need to print project reports, assignments, records, certificates, application forms and other documents. During project reviews, examinations and submission days, the demand suddenly becomes much higher. The campus may have multiple Xerox and printing centres but I usually don\'t know which one has the shortest queue, which one has colour printing available, whether the printer is working or how long my request will take. The operators have another problem. They may receive many files from different students through different channels, while also handling printing options, payments and requests. At the same time, students are sharing academic and personal documents just to get something printed. The technology to print a document already exists. The difficult part is everything around it. So the question is: How could we rethink this everyday experience so that a student doesn\'t have to waste valuable time just to complete the final step of getting something printed? How could the process become faster, more predictable and secure for students while also making things easier for the people running these centres? What would you build?',
        max_teams: 3
    },

    // --- 21. Assistive Tech & Inclusive Communication ---
    {
        statement_code: 'PS-21',
        domain: 'Assistive Tech & Inclusive Communication',
        title: 'The Message Between Us',
        description: 'Hi, I’m Navya. A few days ago, I was working on a project with a few friends. One of our teammates wanted to explain an idea to me, so she started communicating with me using signs. I understood some of it, but not everything. I asked her to show me what she meant. She took out her phone, typed something and showed it to me. I replied by typing on my phone and showing it back. We both smiled and continued our discussion. A few minutes later, we needed to clarify something again. This time, instead of continuing the discussion, we went back to typing and showing our phones. It worked but it didn\'t feel like the natural conversation we were trying to have. I started thinking about what would happen if the same situation happened outside our friend group. What if she needed to quickly ask something from a faculty member? What if she had to communicate with someone at an office? What if she was speaking with someone she had never met before? What if there was something important that needed to be understood immediately? In those situations, finding another way to communicate may not always be as simple as taking out a phone and typing. At the same time, expecting every person on campus to already know how to communicate in the same way isn\'t realistic either. Both people may know exactly what they want to say. The difficulty is making that moment of understanding happen naturally. Today, we already carry devices that can see, hear, process information and respond almost instantly. So the question is: How could we make moments like this easier in everyday university life? How could two people understand each other more naturally when they communicate differently? How could it work during a classroom discussion, project meeting, casual conversation or an important interaction at a campus service? And how could it remain simple enough that the technology doesn\'t become another obstacle? If you were given the opportunity to improve this everyday experience, what would you build?',
        max_teams: 3
    },

    // --- 22. Health, Nutrition & Wellness ---
    {
        statement_code: 'PS-22',
        domain: 'Health, Nutrition & Wellness',
        title: 'Between One Meal and Another',
        description: 'Hi, I\'m Ananya. Some days I have breakfast before leaving home. Some days I don\'t. Sometimes I eat lunch on time, and sometimes I realise at 4 PM that I haven\'t eaten anything since morning. I never really thought much about it because each missed meal seemed like a small thing. Then I started wondering what happens when these small changes become a routine. Most of us don\'t actually keep track of our everyday eating habits. We remember what we ate today, but we don\'t necessarily notice that we\'ve been skipping breakfast several times a week, eating at unusual times or replacing proper meals with quick snacks. People also have different needs and preferences. Some avoid particular foods, some follow a specific diet, and some have been advised by a professional to follow certain eating patterns but the person usually has to figure out all of this themselves. What if a person could simply record their meals when convenient, and over time the system could help them understand patterns they might not notice on their own? What if it could gently point out that something has changed for example, that they have been skipping meals more frequently than usual and encourage them to pay attention? What if their own dietary preferences or requirements could be considered when giving suggestions, instead of giving the same advice to everyone? And what if all of this could happen without requiring the person to manually analyse their own data every day? The goal isn\'t to tell people what to eat. It\'s to help them become more aware of their own routine and make better-informed choices. If you were asked to design a simple way for people to understand their everyday eating patterns and receive personalised, responsible support, what would you build?',
        max_teams: 3
    }
];

export async function GET() {
    try {
        const supabase = await createClient()

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
