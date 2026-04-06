'use client';

import { useState, useEffect } from 'react';
import { MapPin, Truck, Package, CheckCircle, Clock, Phone, Navigation } from 'lucide-react';

const trackingSteps = [
  { status: 'confirmed', label: 'Order Confirmed', time: '10:30 AM', completed: true, location: 'OGas HQ, Lagos' },
  { status: 'assigned', label: 'Driver Assigned', time: '10:35 AM', completed: true, location: 'Driver: Musa Ibrahim' },
  { status: 'picked_up', label: 'Picked Up', time: '11:00 AM', completed: true, location: 'Depot' },
  { status: 'in_transit', label: 'In Transit', time: '11:15 AM', completed: true, location: 'En route to delivery' },
  { status: 'delivered', label: 'Delivered', time: 'Estimated 12:00 PM', completed: false, location: 'Your address' },
];

export default function TrackPage() {
  const [driverLocation, setDriverLocation] = useState({ lat: 6.5244, lng: 3.3792 }); // Lagos coordinates
  const [eta, setEta] = useState('15 minutes');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>

      {/* Order Info Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Order #ORD-2305</p>
            <h2 className="text-lg font-semibold text-gray-900">12.5kg LPG Cylinder x 2</h2>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">In Transit</span>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Musa Ibrahim</p>
            <p className="text-sm text-gray-500">Your delivery partner • +234 801 234 5678</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">ETA: {eta}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="tel:+2348012345678" className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
              <Phone className="w-5 h-5" />
            </a>
            <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100" />
        <div className="relative text-center">
          <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Live tracking map</p>
          <p className="text-sm text-gray-500">Driver is 2.3 km away from you</p>
          <p className="text-xs text-gray-400 mt-1">Lagos, Nigeria</p>
        </div>
        
        {/* Animated driver marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping absolute" />
            <div className="w-4 h-4 bg-blue-600 rounded-full relative border-2 border-white" />
          </div>
        </div>
        
        {/* Destination marker */}
        <div className="absolute bottom-1/4 right-1/4">
          <MapPin className="w-8 h-8 text-red-500" />
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Delivery Progress</h3>
        <div className="space-y-4">
          {trackingSteps.map((step, index) => (
            <div key={step.status} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-green-500 text-white' : index === trackingSteps.findIndex(s => !s.completed) ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
                {step.completed ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="flex-1 pb-4 border-l-2 border-gray-100 ml-4 -translate-x-6 pl-6">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</p>
                  <span className="text-sm text-gray-400">{step.time}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{step.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Card */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900">Having issues with your delivery?</h3>
              <p className="text-sm text-orange-700">Contact our support team immediately</p>
            </div>
          </div>
          <a href="tel:+2348001234567" className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">
            Call Support
          </a>
        </div>
      </div>
    </div>
  );
}
