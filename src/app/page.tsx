import Link from 'next/link';
import { ArrowRight, Trophy, Users, ShieldCheck, Lightbulb, Code2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
      <div className="max-w-4xl w-full space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-200">
            HACKARE • Hackathon Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-blue-600">
            HACKARE
          </h1>
          <p className="text-xl md:text-2xl text-slate-800 max-w-2xl mx-auto leading-relaxed">
            A competitive arena for the brightest minds. Choose from real-world challenge problem statements, build your system architecture, and demonstrate your working product.
          </p>

        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg">
            Login to Dashboard <ArrowRight size={20} />
          </Link>
          <Link href="/register" className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-sm">
            Register Team
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Users className="text-blue-600 w-8 h-8 mb-4" />
            <h3 className="font-bold text-lg mb-2 text-gray-900">1. Form Your Team</h3>
            <p className="text-sm text-gray-600">Team up with up to 4 members. Share your invite code and collaborate seamlessly.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Lightbulb className="text-amber-500 w-8 h-8 mb-4" />
            <h3 className="font-bold text-lg mb-2 text-gray-900">2. Select Problem</h3>
            <p className="text-sm text-gray-600">Browse curated problem statements across smart campus, transit, sustainability, and more. Max 3 teams per statement.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Code2 className="text-emerald-600 w-8 h-8 mb-4" />
            <h3 className="font-bold text-lg mb-2 text-gray-900">3. 2 Intensive Rounds</h3>
            <p className="text-sm text-gray-600">Round 1: System Architecture & PPT (40 pts). Round 2: Final Working Product & Code Demo (60 pts).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
