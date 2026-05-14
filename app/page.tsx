import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_40px_rgba(249,115,22,0.3)]">
          <span className="text-3xl sm:text-4xl">🔥</span>
        </div>
        
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            OGas Marketplace
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-md mx-auto px-4">
            Quality gas cylinders delivered fast. Find verified sellers near you in Oteri, Ughelli & beyond.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full px-4">
          <Link href="/auth/register" className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/25 text-center">
            Get Started
          </Link>
          <Link href="/buy" className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-105 border border-zinc-700 text-center">
            Buy Gas Now
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-105 border border-zinc-700 text-center">
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto mt-6 sm:mt-8 px-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-orange-500">3+</div>
            <div className="text-xs text-zinc-500">Sellers</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-orange-500">30min</div>
            <div className="text-xs text-zinc-500">Delivery</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-orange-500">100%</div>
            <div className="text-xs text-zinc-500">Verified</div>
          </div>
        </div>
      </div>
    </main>
  );
}
