'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Package, MapPin, Clock, ChevronRight, Flame, TrendingUp, Shield, Phone, Zap } from 'lucide-react';

const quickActions = [
  { title: 'Order Gas', description: 'Get gas delivered to your doorstep', icon: Flame, href: '/order', color: 'bg-orange-500' },
  { title: 'Track Order', description: 'Track your delivery in real-time', icon: MapPin, href: '/track', color: 'bg-blue-500' },
  { title: 'Order History', description: 'View your past orders', icon: Package, href: '/history', color: 'bg-green-500' },
];

const recentOrders = [
  { id: 'ORD-001', status: 'delivered', items: '12.5kg LPG Cylinder', date: '2024-04-01', total: 12500, driver: 'Musa Ibrahim' },
  { id: 'ORD-002', status: 'in_transit', items: '25kg LPG Cylinder', date: '2024-04-03', total: 24500, driver: 'John Okonkwo' },
];

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">🇳🇬 Nigeria's #1 Gas App</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-green-100">Fast gas delivery at your doorstep</p>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm text-green-100">Total Orders</p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm text-green-100">Active Orders</p>
              <p className="text-2xl font-bold">1</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm text-green-100">Saved Addresses</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href} className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </Link>
            );
n          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <Link href="/history" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {recentOrders.map((order, index) => (
            <div key={order.id} className={`p-4 flex items-center justify-between ${index !== recentOrders.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {order.status === 'delivered' ? <Shield className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.items}</p>
                  <p className="text-xs text-gray-400">Driver: {order.driver}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₦{order.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{order.date}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">Gas Safety Tip</h3>
            <p className="text-sm text-orange-700">
              Always check for leaks before using your gas cylinder. Apply soapy water to the valve - 
              if bubbles form, there's a leak. Call us immediately at <a href="tel:+2348001234567" className="font-bold underline">0800-123-4567</a>
            </p>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Need Help?</h3>
              <p className="text-sm text-blue-700">Our support team is available 24/7</p>
            </div>
          </div>
          <a href="tel:+2348001234567" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
}
