'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const UIDCard: React.FC = () => {
  const { user } = useAuth();

  if (!user?.uid) return null;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mx-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#666] text-xs uppercase tracking-widest mb-1">Your OGas ID</p>
          <p className="text-[#ff6b35] text-lg font-bold font-mono tracking-wider">
            {user.uid.startsWith('OG-') ? user.uid : 'Loading...'}
          </p>
        </div>
        <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-lg px-3 py-1">
          <span className="text-[#ff6b35] text-xs font-bold">PROTECTED</span>
        </div>
      </div>
      <p className="text-[#666] text-xs mt-2">
        Use this ID for support & disputes. Keep it safe.
      </p>
    </div>
  );
};
