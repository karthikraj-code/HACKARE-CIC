import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, Lightbulb, Code2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/group-2b.png"
              alt="Google Developer Groups On Campus Kalasalingam Academy Of Research & Education"
              width={260}
              height={44}
              className="h-8 md:h-10 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all"
            >
              <span>Login to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20 text-center">
        <div className="max-w-4xl w-full space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200 shadow-xs">
              <Image
                src="/gdg-logo.png"
                alt="GDG Logo"
                width={20}
                height={20}
                className="h-4 w-auto object-contain"
              />
              <span>GDG-KARE Event Management Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              Welcome to <span className="text-blue-600">GDG-KARE</span> Event Management Platform
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              A competitive arena for the brightest minds at Kalasalingam Academy of Research and Education. Choose from real-world challenge problem statements, build your system architecture, and demonstrate your working product.
            </p>
          </div>

          <div className="flex justify-center items-center w-full max-w-md mx-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              Get Started • Login to Dashboard <ArrowRight size={18} />
            </Link>
          </div>

          {/* Process Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all">
              <Users className="text-blue-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-black">1. Form Your Team</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Team up with up to 4 members. Share your invite code and collaborate seamlessly.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all">
              <Lightbulb className="text-blue-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-black">2. Select Problem</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Browse curated problem statements across smart campus, transit, sustainability, and more.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all">
              <Code2 className="text-blue-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-black">3. Intensive Rounds</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Work on problem statements and submit deliverables for live evaluation.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Single Unified Clean Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <Image
            src="/group-2b.png"
            alt="Google Developer Groups On Campus Kalasalingam Academy Of Research & Education"
            width={280}
            height={48}
            className="h-9 md:h-10 w-auto object-contain"
          />
          <p className="text-xs font-semibold text-gray-500">
            © GDG KARE 2026. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
