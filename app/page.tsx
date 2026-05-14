import Link from "next/link";
import { Flame, MapPin, Truck, Phone, Calculator, Package, Users, Star, Navigation, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-zinc-950">
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center px-4 py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-orange-500/15 rounded-full blur-[80px]" />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_40px_rgba(249,115,22,0.3)]">
            <Flame className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              OGas Marketplace
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-lg mx-auto">
              Quality cooking gas delivered fast. Find verified sellers near you, order pickup or delivery anywhere in Nigeria.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-sm mx-auto">
            <Link href="/auth/register" className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/25 text-center text-sm">
              Get Started
            </Link>
            <Link href="/buy" className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-105 border border-zinc-700 text-center text-sm">
              Find Gas Near Me
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto pt-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-400">GPS</div>
              <div className="text-[10px] text-zinc-500">Auto Location</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-400">30m</div>
              <div className="text-[10px] text-zinc-500">Delivery</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-400">100%</div>
              <div className="text-[10px] text-zinc-500">Verified</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-400">24/7</div>
              <div className="text-[10px] text-zinc-500">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-12 px-4 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Navigation, title: "Auto Detect Location", desc: "We find your location and show the closest verified gas sellers near you." },
              { icon: Truck, title: "Pickup or Delivery", desc: "Choose what works. Pick up yourself or get gas delivered to your door." },
              { icon: Flame, title: "Pay & Refill", desc: "Secure Paystack payment. Refill your cylinder or buy a new one in minutes." },
            ].map((item, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center space-y-3">
                <div className="w-12 h-12 bg-orange-500/15 rounded-lg flex items-center justify-center mx-auto">
                  <item.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">What You Get</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { href: "/calculator", icon: Calculator, title: "Smart LPG Calculator", desc: "Know exactly what cylinder size you need for your family." },
              { href: "/buy", icon: Package, title: "Gas Store", desc: "Buy cylinders, regulators, hoses from verified sellers near you." },
              { href: "/business", icon: Users, title: "Business Packages", desc: "Start your own gas business. Starter kits & equipment." },
              { href: "/buy", icon: Phone, title: "Direct Contact", desc: "Call sellers directly. No middleman. Build trust." },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition group">
                <item.icon className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition" />
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL BANNER */}
      <section className="py-12 px-4 bg-gradient-to-b from-zinc-900/30 to-zinc-950 border-y border-zinc-800">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/15 rounded-full text-orange-400 text-xs font-medium">
            <Star className="w-3 h-3" />
            Earn ₦500 per referral
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Invite Friends, Earn Money</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Share your referral link. When someone signs up and buys gas, you earn ₦500 instantly. No limit.
          </p>
          <Link href="/auth/register" className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/25 text-sm">
            Get Your Referral Link →
          </Link>
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Sell Gas on OGas</h2>
          <p className="text-zinc-400 text-sm">List your business, manage stock, get orders, grow nationwide.</p>
          <Link href="/auth/register" className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-105 border border-zinc-700 text-sm">
            Become a Seller
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 px-4 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-sm">OGas</span>
          </div>
          <p className="text-zinc-500 text-xs">© 2026 OGas Ventures. Nigeria.</p>
        </div>
      </footer>
    </main>
  );
}
