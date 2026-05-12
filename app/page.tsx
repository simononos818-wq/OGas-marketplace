import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8">
        <div className="inline-block">
          <Logo variant="icon" size="xl" animated className="drop-shadow-[0_0_30px_rgba(0,212,170,0.3)]" />
        </div>
        
        <div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            OGas Marketplace
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Connect with verified gas suppliers. Real-time pricing, secure delivery.
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/register" className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all hover:scale-105">
            Get Started
          </Link>
          <Link href="/buy" className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all hover:scale-105">
            Browse Gas
          </Link>
          <Link href="/auth/login" className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all hover:scale-105">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
// build trigger
