import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="text-6xl mb-4">🔥</div>
        <h1 className="text-4xl font-black tracking-tight leading-tight">
          Get <span className="text-orange-500">Cooking Gas</span><br />
          Delivered Near You
        </h1>
        <p className="text-gray-400 text-lg mt-4 max-w-sm">
          Nigeria's easiest way to buy LPG. Find verified sellers, order online, pay securely.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm mt-10">
          <Link href="/buy" className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 rounded-2xl text-xl text-center">
            🛒 Buy Gas Now
          </Link>
          <Link href="/orders" className="bg-gray-800 border border-gray-700 text-white font-semibold py-4 rounded-2xl text-center">
            📦 Track My Order
          </Link>
          <Link href="/login" className="text-orange-400 font-semibold py-3 text-center text-sm">
            Sell Gas on OGas →
          </Link>
        </div>
      </div>
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-8 grid grid-cols-3 gap-4 text-center text-sm">
        {[{ emoji: '✅', label: 'Verified Sellers' }, { emoji: '💳', label: 'Secure Payment' }, { emoji: '📦', label: 'Order Tracking' }].map(f => (
          <div key={f.label}><div className="text-2xl">{f.emoji}</div><p className="text-gray-400 mt-1 text-xs">{f.label}</p></div>
        ))}
      </div>
    </div>
  );
}
