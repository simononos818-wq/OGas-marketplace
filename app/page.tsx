import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-black text-orange-500">OGas</h1>
        <p className="text-xl text-gray-300">Order Cooking Gas Online</p>
        <p className="text-sm text-gray-500">Fast delivery in Oteri Ughelli</p>
        
        <Link 
          href="/buy/" 
          className="inline-block bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 px-12 rounded-2xl text-xl"
        >
          Order Gas Now →
        </Link>
        
        <div className="pt-8">
          <p className="text-xs text-gray-600">Are you a seller?</p>
          <Link href="/seller/dashboard/" className="text-sm text-orange-400 hover:underline">
            Go to Seller Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
