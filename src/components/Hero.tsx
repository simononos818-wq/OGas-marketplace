"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Clock, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/Button";

const stats = [
  { value: "2,400+", label: "Verified Vendors", icon: Shield },
  { value: "36", label: "Cities Covered", icon: MapPin },
  { value: "98k+", label: "Orders Delivered", icon: TrendingUp },
  { value: "25min", label: "Avg Delivery", icon: Clock },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-dark-gradient" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-flame/10 rounded-full blur-[100px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-flame animate-pulse" />
              <span className="text-sm text-brand-500 font-medium">Now serving Lagos & Abuja</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display leading-tight mb-6">
              Gas delivered to your{" "}
              <span className="gradient-text">doorstep</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-dark-text mb-8 max-w-xl mx-auto lg:mx-0">
              Connect with verified vendors for instant cooking gas delivery. 
              Safe, reliable, and faster than ever.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link href="/buyer">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Order Gas Now
                </Button>
              </Link>
              <Link href="/seller-signup">
                <Button variant="secondary" size="lg">
                  Become a Vendor
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-flame" />
                    <span className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm text-dark-text">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative bg-dark-card border border-dark-border rounded-3xl p-6 shadow-2xl shadow-brand-500/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-flame to-brand-500 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Delivery in progress</p>
                    <p className="text-sm text-dark-text">12kg cylinder • Total Gas</p>
                  </div>
                  <span className="ml-auto text-flame font-bold">8 mins</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-text">Order confirmed</span>
                    <span className="text-white">Out for delivery</span>
                  </div>
                  <div className="h-2 bg-dark-lighter rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-flame to-brand-500 rounded-full"
                    />
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-dark-lighter rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-dark-border" />
                  <div className="flex-1">
                    <p className="text-white font-medium">Emmanuel O.</p>
                    <p className="text-sm text-dark-text">Your delivery partner</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="w-2 h-2 rounded-full bg-flame" />
                    ))}
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -top-8 -right-8 bg-dark-card border border-dark-border rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Verified</p>
                    <p className="text-xs text-dark-text">Safety checked</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-8 bg-dark-card border border-dark-border rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">+2,400</p>
                    <p className="text-xs text-dark-text">Happy customers</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
