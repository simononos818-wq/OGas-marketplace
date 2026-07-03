"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocation } from '@/hooks/useLocation';
import { NIGERIAN_CITIES } from '@/lib/gasCalculator';
import { User, MapPin, ChevronRight, Flame, HelpCircle, Shield, FileText, MessageCircle, Mail, Phone } from 'lucide-react';

export default function ProfilePage() {
  const { city, state, setManualLocation } = useLocation();
  const [buyerInfo, setBuyerInfo] = useState({ name: '', phone: '', address: '' });
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('ogas_buyer_info');
    if (saved) {
      try {
        setBuyerInfo(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleCitySelect = (cityName: string) => {
    setManualLocation(cityName);
    setShowCityPicker(false);
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-900/20 to-black px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white mb-4">Profile</h1>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/10 flex items-center justify-center">
            <User className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <p className="text-white font-semibold">{buyerInfo.name || 'Guest User'}</p>
            <p className="text-gray-500 text-xs">{buyerInfo.phone || 'No phone set'}</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="px-4 mb-4">
        <button 
          onClick={() => setShowCityPicker(!showCityPicker)}
          className="w-full flex items-center gap-3 bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 text-left"
        >
          <MapPin className="w-5 h-5 text-orange-500" />
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{city}</p>
            <p className="text-gray-500 text-xs">{state || 'Tap to change'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>

        {showCityPicker && (
          <div className="mt-2 bg-[#12121A] border border-[#2A2A3A] rounded-xl max-h-64 overflow-y-auto">
            <div className="p-2">
              <p className="text-gray-500 text-xs px-2 py-1">Select your city</p>
              {NIGERIAN_CITIES.map((c: any) => (
                <button
                  key={c.name}
                  onClick={() => handleCitySelect(c.name)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-500/10 transition-colors"
                >
                  <p className="text-white text-sm">{c.name}</p>
                  <p className="text-gray-500 text-xs">{c.state}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-2">
        <Link href="/orders" className="flex items-center gap-3 bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
          <PackageIcon />
          <div className="flex-1">
            <p className="text-white text-sm font-medium">My Orders</p>
            <p className="text-gray-500 text-xs">{ordersCount} orders</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </Link>

        <Link href="/seller/register" className="flex items-center gap-3 bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Become a Seller</p>
            <p className="text-gray-500 text-xs">Start selling gas</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </Link>

        <Link href="/seller/dashboard" className="flex items-center gap-3 bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
          <StoreIcon />
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Seller Dashboard</p>
            <p className="text-gray-500 text-xs">Manage your business</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </Link>

        {/* Support Section */}
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 mt-4">
          <p className="text-white text-sm font-medium mb-3">Need Help?</p>
          <div className="space-y-2">
            <a href="https://t.me/ogaslpg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] hover:bg-orange-500/10 transition-colors">
              <MessageCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-white text-sm">Telegram Support</p>
                <p className="text-gray-500 text-xs">@ogaslpg</p>
              </div>
            </a>
            <a href="https://wa.me/234XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] hover:bg-orange-500/10 transition-colors">
              <Phone className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white text-sm">WhatsApp</p>
                <p className="text-gray-500 text-xs">Chat with us</p>
              </div>
            </a>
            <a href="mailto:support@ogaslpgmarketplace.com" className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] hover:bg-orange-500/10 transition-colors">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-white text-sm">Email Support</p>
                <p className="text-gray-500 text-xs">support@ogaslpgmarketplace.com</p>
              </div>
            </a>
          </div>
          <p className="text-gray-600 text-xs text-center mt-3">We typically respond within 2 hours</p>
        </div>

        {/* Legal Section */}
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 mt-4">
          <p className="text-white text-sm font-medium mb-3">Legal</p>
          <div className="space-y-2">
            <Link href="/terms" className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] hover:bg-orange-500/10 transition-colors">
              <FileText className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <p className="text-white text-sm">Terms of Service</p>
                <p className="text-gray-500 text-xs">Read our terms and conditions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Link>
            <Link href="/privacy" className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] hover:bg-orange-500/10 transition-colors">
              <Shield className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-white text-sm">Privacy Policy</p>
                <p className="text-gray-500 text-xs">How we handle your data</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* App Info & Legal Footer */}
      <div className="px-4 mt-8 text-center">
        <p className="text-gray-600 text-xs">OGas Marketplace v1.0</p>
        <p className="text-gray-700 text-xs">Built for Nigeria</p>
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Link href="/terms" className="text-orange-500 text-xs hover:underline">Terms of Service</Link>
            <span className="text-gray-700">•</span>
            <Link href="/privacy" className="text-orange-500 text-xs hover:underline">Privacy Policy</Link>
          </div>
          <p className="text-gray-600 text-xs">© 2026 OGas LPG Marketplace. All rights reserved.</p>
          <p className="text-gray-700 text-xs mt-1">Operated by Simon Onos</p>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-400 hover:text-orange-400">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/buy" className="flex flex-col items-center p-2 text-gray-400 hover:text-orange-400">
            <span className="text-xl">🔥</span>
            <span className="text-xs font-medium">Buy</span>
          </Link>
          <Link href="/orders" className="flex flex-col items-center p-2 text-gray-400 hover:text-orange-400">
            <span className="text-xl">📦</span>
            <span className="text-xs font-medium">Orders</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-orange-500">
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PackageIcon() {
  return (
    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}
