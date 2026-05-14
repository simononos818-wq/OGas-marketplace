import Link from "next/link";
import { Flame, MapPin, Truck, Phone, Calculator, Package, Users, Star, Navigation, ArrowRight, Menu, X, Shield, Clock, Zap } from "lucide-react";

// PROFESSIONAL OGas LOGO — Animated gradient flame
function OGasLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { container: "w-7 h-7", icon: "w-4 h-4", text: "text-base" },
    md: { container: "w-9 h-9", icon: "w-5 h-5", text: "text-lg" },
    lg: { container: "w-14 h-14", icon: "w-8 h-8", text: "text-2xl" },
  };
  const s = sizes[size];
  
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.container} relative flex-shrink-0`}>
        {/* Animated glow behind logo */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl blur-sm opacity-60 animate-pulse" />
        {/* Main logo shape */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Flame className={`${s.icon} text-white`} />
        </div>
      </div>
      <span className={`${s.text} font-bold tracking-tight text-white`}>
        O<span className="text-orange-400">Gas</span>
      </span>
    </div>
  );
}

// Stat badge component
function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-lg font-bold text-orange-400">{value}</span>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// Feature card
function FeatureCard({ href, icon: Icon, title, desc }: { href: string; icon: any; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-orange-500/30 transition-all duration-300">
      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/20 transition">
        <Icon className="w-5 h-5 text-orange-400" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-white mb-1 group-hover:text-orange-400 transition">{title}</h3>
        <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

// Step card
function StepCard({ number, icon: Icon, title, desc }: { number: string; icon: any; title: string; desc: string }) {
  return (
    <div className="relative flex flex-col items-center text-center p-5">
      <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-3 border border-orange-500/20">
        <Icon className="w-5 h-5 text-orange-400" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {number}
      </div>
      <h3 className="font-semibold text-sm text-white mb-2">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-zinc-950">
      {/* STICKY NAVIGATION — Glass effect */}
      <header className="sticky top-0 z-50 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <OGasLogo size="sm" />
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/buy" className="text-sm text-zinc-400 hover:text-white transition">Buy Gas</Link>
            <Link href="/business" className="text-sm text-zinc-400 hover:text-white transition">Business</Link>
            <Link href="/calculator" className="text-sm text-zinc-400 hover:text-white transition">Calculator</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden sm:block px-4 py-2 text-sm text-zinc-300 hover:text-white transition">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition shadow-lg shadow-orange-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 pt-12 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px]" />
        
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Now serving all of Nigeria
          </div>

          {/* Logo + Title */}
          <div className="mb-6">
            <OGasLogo size="lg" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] mb-4">
            Cooking Gas{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </h1>
          
          <p className="text-zinc-400 text-base max-w-md mx-auto mb-8 leading-relaxed">
            Find verified gas sellers near you. Order refill or delivery in minutes. Pay securely with Paystack.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-xl shadow-orange-500/20 text-sm">
              Get Started — Free
            </Link>
            <Link href="/buy" className="w-full sm:w-auto px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all hover:scale-105 border border-zinc-700 text-sm flex items-center gap-2 justify-center">
              <MapPin className="w-4 h-4" /> Find Gas Near Me
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 py-6 border-y border-zinc-800/50 max-w-sm mx-auto">
            <StatBadge value="GPS" label="Auto Locate" />
            <div className="w-px h-8 bg-zinc-800" />
            <StatBadge value="30m" label="Delivery" />
            <div className="w-px h-8 bg-zinc-800" />
            <StatBadge value="100%" label="Verified" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-14 bg-zinc-900/20 border-y border-zinc-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold mb-2">How It Works</h2>
            <p className="text-zinc-500 text-sm">Three simple steps to get your gas</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            
            <StepCard number="1" icon={Navigation} title="Find Sellers" desc="We detect your location and show verified sellers within 20km." />
            <StepCard number="2" icon={Truck} title="Place Order" desc="Choose pickup or delivery. Select cylinder size and quantity." />
            <StepCard number="3" icon={Flame} title="Pay & Receive" desc="Secure Paystack payment. Track your order in real-time." />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold mb-2">Everything You Need</h2>
            <p className="text-zinc-500 text-sm">Tools for buyers and sellers</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <FeatureCard href="/calculator" icon={Calculator} title="Smart LPG Calculator" desc="Find the perfect cylinder size for your household and cooking habits." />
            <FeatureCard href="/buy" icon={Package} title="Gas Store" desc="Buy new cylinders, regulators, hoses from verified local sellers." />
            <FeatureCard href="/business" icon={Users} title="Business Packages" desc="Start your own gas business with starter kits and equipment." />
            <FeatureCard href="/buy" icon={Phone} title="Direct Contact" desc="Call sellers directly. No middleman fees. Build lasting trust." />
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="px-4 py-10 bg-zinc-900/20 border-y border-zinc-800/50">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10">
          {[
            { icon: Shield, label: "Secure Payments" },
            { icon: Clock, label: "Fast Delivery" },
            { icon: Zap, label: "Instant Orders" },
            { icon: Star, label: "Verified Sellers" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-zinc-500">
              <item.icon className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* REFERRAL */}
      <section className="px-4 py-14">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-medium mb-4">
            <Star className="w-3 h-3" /> Earn ₦500 per referral
          </div>
          <h2 className="text-xl font-bold mb-3">Invite Friends, Earn Cash</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Share your referral link. When someone signs up and buys gas, you earn ₦500 instantly. No earning limit.
          </p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/20 text-sm">
            Get Your Referral Link <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="px-4 py-14 bg-gradient-to-b from-zinc-900/20 to-zinc-950 border-t border-zinc-800/50">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-bold mb-3">Sell Gas on OGas</h2>
          <p className="text-zinc-400 text-sm mb-6">List your business, manage inventory, receive orders, and grow your customer base across Nigeria.</p>
          <Link href="/auth/register" className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition border border-zinc-700 text-sm">
            Become a Seller — Free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-8 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <OGasLogo size="sm" />
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <span>© 2026 OGas Ventures</span>
            <Link href="/buy" className="hover:text-zinc-400 transition">Buy Gas</Link>
            <Link href="/business" className="hover:text-zinc-400 transition">Business</Link>
            <Link href="/calculator" className="hover:text-zinc-400 transition">Calculator</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
