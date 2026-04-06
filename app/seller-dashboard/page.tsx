'use client';
import { motion } from 'framer-motion';
import { TrendingUp, Package, Users, Star, DollarSign } from 'lucide-react';

const stats = [
  { label: 'Revenue', value: '₦245K', change: '+12%', icon: DollarSign },
  { label: 'Orders', value: '48', change: '+8%', icon: Package },
  { label: 'Customers', value: '156', change: '+24', icon: Users },
  { label: 'Rating', value: '4.8', change: '+0.2', icon: Star },
];

const orders = [
  { id: '001', customer: 'John D.', total: 24500, status: 'pending', time: '2 mins ago' },
  { id: '002', customer: 'Sarah M.', total: 21250, status: 'preparing', time: '15 mins ago' },
  { id: '003', customer: 'Mike O.', total: 7650, status: 'ready', time: '32 mins ago' },
];

export default function SellerDashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-8">Welcome back, GasLink Nigeria</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
                <div className="text-xs text-green-400 mt-2">{stat.change}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-white">#{order.id} - {order.customer}</p>
                  <p className="text-sm text-zinc-500">{order.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">₦{order.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
