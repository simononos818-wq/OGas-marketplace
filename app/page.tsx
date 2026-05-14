import Link from "next/link";
import { Flame, MapPin, Truck, Phone, Calculator, Package, Users, Star, ArrowRight, Navigation } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-zinc-950">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 shadow-[0_0_60px_rgba(249,115,22,0.4)]">
            <Flame className="w-12 h-12 text-white" />
          </div>
          
          <div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              OGas Marketplace
            </h1>
            <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
              Quality cooking gas delivered fast. <span className="text-orange-400 font-semibold">Find verified sellers near you</span>, order pickup or delivery anywhere in Nigeria.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/25 text-center">
              Get Started
            </Link>
            <Link href="/buy" className="w-full sm:w-auto px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-105 border border-zinc-700 text-center">
              Find Gas Near Me
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-8">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center backdrop-blur">
              <div className="text-2xl font-bold text-orange-400">GPS</div>
              <div className="text-xs text-zinc-500">Auto Location</div>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center backdrop-blur">
              <div className="text-2xl font-bold text-orange-400">30min</div>
              <div className="text-xs text-zinc-500">Avg Delivery</div>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center backdrop-blur">
              <div className="text-2xl font-bold text-orange-400">100%</div>
              <div className="text-xs text-zinc-500">Verified Sellers</div>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center backdrop-blur">
              <div className="text-2xl font-bold text-orange-400">24/7</div>
              <div className="text-xs text-zinc-500">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto">
                <Navigation className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="font-bold text-lg">Auto Detect Location</h3>
              <p className="text-zinc-400 text-sm">We automatically find your location and show the closest verified gas sellers near you.</p>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto">
                <Truck className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="font-bold text-lg">Pickup or Delivery</h3>
              <p className="text-zinc-400 text-sm">Choose what works for you. Pick up yourself or get gas delivered to your door.</p>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto">
                <Flame className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="font-bold text-lg">Pay & Refill</h3>
              <p className="text-zinc-400 text-sm">Secure Paystack payment. Refill your cylinder or buy a new one in minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">What You Get</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/calculator" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800/50 transition group">
              <Calculator className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition" />
              <h3 className="font-bold text-lg mb-2">Smart LPG Calculator</h3>
              <p className="text-zinc-400 text-sm">Know exactly what cylinder size you need based on your family size and cooking habits.</p>
            </Link>
            <Link href="/buy" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800/50 transition group">
              <Package className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition" />
              <h3 className="font-bold text-lg mb-2">Gas Store</h3>
              <p className="text-zinc-400 text-sm">Buy new cylinders, regulators, hoses, and accessories from verified sellers near you.</p>
            </Link>
            <Link href="/business" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800/50 transition group">
              <Users className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition" />
              <h3 className="font-bold text-lg mb-2">Business Packages</h3>
              <p className="text-zinc-400 text-sm">Start your own gas business anywhere in Nigeria. Starter kits, equipment & support.</p>
            </Link>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <Phone className="w-8 h-8 text-orange-400 mb-3" />
              <h3 className="font-bold text-lg mb-2">Direct Seller Contact</h3>
              <p className="text-zinc-400 text-sm">Call sellers directly. No middleman. Build trust with your local gas supplier.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-zinc-900/50 to-zinc-950">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Sell Gas on OGas</h2>
          <p className="text-zinc-400">Are you a gas seller in Nigeria? List your business, manage stock, get orders, and grow your customer base nationwide.</p>
          <Link href="/auth/register" className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/25">
            Become a Seller
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold">OGas</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 OGas Ventures. Nigeria.</p>
        </div>
      </footer>
    </main>
  );
}
