"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ClipboardList, User, Store } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function BottomNav() {
  const pathname = usePathname();
  const { user, userRole } = useAuth();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/buy", icon: ShoppingBag, label: "Buy" },
    { href: "/orders", icon: ClipboardList, label: "Orders" },
    ...(userRole === "vendor" || userRole === "admin" 
      ? [{ href: "/seller-dashboard", icon: Store, label: "Dashboard" }]
      : []),
    { href: "/buyer", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                active 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon 
                size={24} 
                strokeWidth={active ? 2.5 : 2}
                className={active ? "animate-pulse" : ""}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
