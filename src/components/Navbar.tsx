"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, MapPin, Flame } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
}

const navLinks = [
  { href: "/buyer", label: "Marketplace" },
  { href: "/tracking", label: "Track Order" },
  { href: "/seller-dashboard", label: "For Vendors" },
];

export function Navbar({ cartCount = 0, onCartClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      setScrolled(window.scrollY > 20);
    });
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "glass-strong" : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-flame to-brand-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-shadow">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold font-display">
                <span className="text-white">O</span>
                <span className="gradient-text">Gas</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-dark-text hover:text-white transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={onCartClick}
                className="relative p-2 text-dark-text hover:text-white transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-flame text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>
              
              <Link
                href="/auth"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-card border border-dark-border text-white hover:border-brand-500/50 transition-all"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            </div>

            <div className="flex lg:hidden items-center gap-4">
              <button
                onClick={onCartClick}
                className="relative p-2 text-dark-text hover:text-white"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-flame text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-dark-text hover:text-white"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-80 bg-dark-bg border-l border-dark-border p-6 pt-20"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 rounded-xl bg-dark-card text-white hover:bg-dark-lighter transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-dark-border my-2" />
                <Link
                  href="/auth"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-flame to-brand-500 text-white"
                >
                  <User className="w-5 h-5" />
                  Sign In / Register
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
