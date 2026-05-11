'use client';

import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Truck, Star, Shield, Camera, FileText, Award } from 'lucide-react';

export default function DriverProfilePage() {
  const auth = useAuth(); const user = auth?.user;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Profile</h1>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.displayName}</h2>
            <p className="text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-medium">4.9</span>
              <span className="text-slate-500">(128 reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Deliveries', value: '156' },
          { label: 'Hours Online', value: '324' },
          { label: 'Acceptance', value: '98%' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="font-semibold text-white mb-4">Vehicle Information</h3>
        <div className="space-y-3">
          {[
            { label: 'Vehicle Type', value: 'Motorcycle', icon: Truck },
            { label: 'Plate Number', value: 'LAG-123-ABC', icon: FileText },
            { label: 'Model', value: 'Honda Wave 125', icon: Truck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 text-slate-300">
                <Icon className="w-5 h-5 text-slate-500" />
                <span className="text-sm">{item.label}:</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="font-semibold text-white mb-4">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-slate-300">
            <Mail className="w-5 h-5 text-slate-500" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Phone className="w-5 h-5 text-slate-500" />
            <span className="text-sm">{user?.phoneNumber || '+234 801 234 5678'}</span>
          </div>
        </div>
      </div>

      {/* Verification Badge */}
      <div className="bg-green-900/30 rounded-xl p-6 border border-green-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-green-400">Verified Driver</h3>
            <p className="text-green-300 text-sm">Your account is fully verified</p>
          </div>
        </div>
      </div>
    </div>
  );
}
