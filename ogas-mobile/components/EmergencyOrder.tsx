"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Flame, MapPin } from "lucide-react";

export default function EmergencyOrder() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleEmergency = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      window.location.href = \`/checkout?emergency=true&lat=\${pos.coords.latitude}&lng=\${pos.coords.longitude}\`;
    });
  };
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 rounded-full shadow-2xl border-2 border-yellow-400"
      >
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 animate-pulse" />
          <span className="font-bold text-sm">SOS GAS</span>
        </div>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-2xl font-bold text-white">Emergency Gas</h2>
              </div>
              <p className="text-gray-400 mb-6">We will find the nearest seller immediately.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-400">Cancel</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleEmergency} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold">GET GAS NOW</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
