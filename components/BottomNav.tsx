"use client";

import { Home, ShoppingBag, ClipboardList, User, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/buy", icon: ShoppingBag, label: "Buy" },
  { href: "/sell", icon: PlusCircle, label: "Sell" },
  { href: "/orders", icon: ClipboardList, label: "Orders" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur-lg border-t border-[#222] z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive ? "text-[#ff6b35] bg-[#ff6b35]/10" : "text-[#666] hover:text-[#999]"
              }`}>
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
