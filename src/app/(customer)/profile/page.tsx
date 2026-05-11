'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Bell, CreditCard } from 'lucide-react';

export default function ProfilePage() {
  const auth = useAuth(); const user = auth?.user;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-orange-500" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.displayName}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium capitalize">
                {user?.role}
              </span>
              {user?.phoneVerified && (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Personal Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={!isEditing}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                disabled={!isEditing}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <button className="mt-6 w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        )}
      </div>

      {/* Saved Addresses */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Saved Addresses</h3>
          <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
            + Add New
          </button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Home', address: '15 Admiralty Way, Lekki Phase 1, Lagos', default: true },
            { label: 'Office', address: '42 Adeola Odeku Street, Victoria Island, Lagos', default: false },
          ].map((addr) => (
            <div key={addr.label} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{addr.label}</p>
                  {addr.default && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Default</span>}
                </div>
                <p className="text-sm text-gray-500">{addr.address}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 text-sm">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Payment Methods</h3>
          <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
            + Add New
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">PAY</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Paystack</p>
              <p className="text-sm text-gray-500">Default payment method</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
