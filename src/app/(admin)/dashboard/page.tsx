'use client';

import Link from 'next/link';
import { ShoppingBag, Users, Truck, DollarSign, TrendingUp, TrendingDown, MoreHorizontal, MapPin, Clock, AlertCircle } from 'lucide-react';

const stats = [
  { label: 'Total Orders', value: '1,284', change: '+12.5%', trend: 'up', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Active Drivers', value: '48', change: '+3', trend: 'up', icon: Truck, color: 'text-green-600', bg: 'bg-green-100' },
  { label: 'Total Customers', value: '3,642', change: '+8.2%', trend: 'up', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Revenue', value: '₦45.2M', change: '+23.1%', trend: 'up', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-100' },
];

const recentOrders = [
  { id: 'ORD-2301', customer: 'Alice Cooper', items: '12.5kg LPG x 2', total: 37000, status: 'delivered', driver: 'Mike Johnson' },
  { id: 'ORD-2302', customer: 'Bob Smith', items: '25kg LPG', total: 36500, status: 'in_transit', driver: 'Sarah Lee' },
  { id: 'ORD-2303', customer: 'Carol White', items: '5kg LPG', total: 7500, status: 'pending', driver: 'Unassigned' },
  { id: 'ORD-2304', customer: 'David Brown', items: '12.5kg LPG x 3', total: 55500, status: 'assigned', driver: 'Tom Wilson' },
];

const topDrivers = [
  { name: 'Mike Johnson', deliveries: 156, rating: 4.9, earnings: 324000 },
  { name: 'Sarah Lee', deliveries: 142, rating: 4.8, earnings: 289000 },
  { name: 'Tom Wilson', deliveries: 138, rating: 4.9, earnings: 275000 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIcon className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
                    <span className="text-slate-400 text-sm">vs last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.items}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : order.status === 'assigned' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.driver}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">₦{order.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Top Drivers</h2>
            <Link href="/admin/drivers" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">View All</Link>
          </div>
          <div className="p-6 space-y-4">
            {topDrivers.map((driver, index) => (
              <div key={driver.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">{index + 1}</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{driver.name}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{driver.deliveries}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{driver.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">₦{driver.earnings.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">earned</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/orders?status=pending" className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Action Required</p>
              <p className="text-2xl font-bold mt-1">5 Pending Orders</p>
              <p className="text-orange-100 text-sm mt-1">Need driver assignment</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Link>

        <Link href="/admin/drivers?status=pending" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Driver Applications</p>
              <p className="text-2xl font-bold mt-1">3 New</p>
              <p className="text-blue-100 text-sm mt-1">Awaiting verification</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">System Status</h3>
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Operational
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">API Status</span>
              <span className="text-green-600 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Database</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Last Backup</span>
              <span className="text-slate-500">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
