'use client';

import { useState } from 'react';
import { Package, ChevronRight, Star, RotateCcw, MapPin, Phone } from 'lucide-react';

const orders = [
  { id: 'ORD-2301', date: '2024-04-01', items: '12.5kg LPG x 2', total: 37000, status: 'delivered', rating: 5, driver: 'Musa Ibrahim', address: '15 Admiralty Way, Lekki' },
  { id: 'ORD-2298', date: '2024-03-28', items: '25kg LPG', total: 36500, status: 'delivered', rating: 4, driver: 'John Okonkwo', address: '42 Adeola Odeku St, VI' },
  { id: 'ORD-2295', date: '2024-03-25', items: '5kg LPG x 3', total: 22500, status: 'delivered', rating: null, driver: 'Chioma Adeleke', address: '10 Bishop Aboyade Cole, VI' },
  { id: 'ORD-2290', date: '2024-03-20', items: '12.5kg LPG', total: 18500, status: 'cancelled', rating: null, driver: null, address: '25 Ozumba Mbadiwe, VI' },
  { id: 'ORD-2285', date: '2024-03-15', items: '50kg LPG', total: 72000, status: 'delivered', rating: 5, driver: 'Emeka Okafor', address: '1004 Estate, Victoria Island' },
];

export default function HistoryPage() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'delivered', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors whitespace-nowrap ${filter === f ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders
          .filter(o => filter === 'all' || o.status === filter)
          .map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{order.id}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{order.items}</p>
                  <p className="text-xs text-gray-400 mt-1">{order.date}</p>
                  {order.driver && (
                    <p className="text-xs text-gray-500 mt-1">Driver: {order.driver}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {order.address}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">₦{order.total.toLocaleString()}</p>
                {order.status === 'delivered' && (
                  <button className="mt-2 flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700">
                    <RotateCcw className="w-4 h-4" />
                    Reorder
                  </button>
                )}
              </div>
            </div>

            {order.status === 'delivered' && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= (order.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-2">
                    {order.rating ? 'You rated this order' : 'Rate this order'}
                  </span>
                </div>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
