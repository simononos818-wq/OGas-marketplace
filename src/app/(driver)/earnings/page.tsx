'use client';

import { DollarSign, TrendingUp, Calendar, Download, Wallet } from 'lucide-react';

const earningsData = {
  today: 12500,
  week: 87500,
  month: 324000,
  total: 1568000,
};

const transactions = [
  { id: 'TXN-001', date: '2024-04-05', type: 'Delivery', amount: 2500, status: 'completed' },
  { id: 'TXN-002', date: '2024-04-05', type: 'Delivery', amount: 3000, status: 'completed' },
  { id: 'TXN-003', date: '2024-04-05', type: 'Bonus', amount: 1500, status: 'completed' },
  { id: 'TXN-004', date: '2024-04-04', type: 'Delivery', amount: 2500, status: 'completed' },
];

export default function DriverEarningsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Earnings</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Today's Earnings", value: earningsData.today, icon: DollarSign },
          { label: 'This Week', value: earningsData.week, icon: Calendar },
          { label: 'This Month', value: earningsData.month, icon: TrendingUp },
          { label: 'Total Earnings', value: earningsData.total, icon: Wallet },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">₦{stat.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-slate-700">
          {transactions.map((txn) => (
            <div key={txn.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${txn.type === 'Bonus' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-medium">{txn.type}</p>
                  <p className="text-slate-400 text-sm">{txn.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-semibold">+₦{txn.amount.toLocaleString()}</p>
                <p className="text-slate-500 text-xs capitalize">{txn.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal Button */}
      <button className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-lg transition-colors">
        Withdraw to Bank
      </button>
    </div>
  );
}
