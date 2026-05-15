'use client';

import { MapPin, Star, Phone, Package } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  size: string;
  price: number;
  stock: number;
  brand: string;
}

interface Seller {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  hasDelivery: boolean;
  deliveryFee?: number;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  products: Product[];
}

export default function SellerCard({ seller }: { seller: Seller }) {
  const cheapestProduct = seller.products.reduce((min, p) => p.price < min.price ? p : min, seller.products[0]);
  
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/50">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">{seller.businessName}</h3>
              {seller.isOnline && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-zinc-400 text-xs">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{seller.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold">{seller.rating}</span>
            <span className="text-zinc-500 text-[10px]">({seller.reviewCount})</span>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {seller.hasDelivery && (
            <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-1 rounded-md font-medium">
              Delivery
            </span>
          )}
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md font-medium">
            {seller.products.length} products
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {seller.products.slice(0, 3).map((product) => (
          <div key={product.id} className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{product.size}kg {product.brand}</p>
                <p className="text-xs text-zinc-500">{product.stock} in stock</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-orange-400 font-bold text-sm">₦{product.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <a href={`tel:${seller.phone}`}
          className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl text-sm font-medium transition-colors">
          <Phone className="w-4 h-4" />
          Call
        </a>
        <Link href={`/buyer/checkout?seller=${seller.id}`}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl text-sm font-bold transition-all active:scale-95">
          <Package className="w-4 h-4" />
          Order Now
        </Link>
      </div>
    </div>
  );
}
