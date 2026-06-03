import React from 'react';
import { Seller } from '@/types';
import { MapPin, Star, ShieldCheck, Bike } from 'lucide-react';

interface SellerCardProps {
  seller: Seller;
  onPress: (seller: Seller) => void;
  index?: number;
}

export default function SellerCard({ seller, onPress, index = 0 }: SellerCardProps) {
  const formatPrice = (price: number) => {
    if (price <= 0) return 'Contact for price';
    return `₦${price.toLocaleString()}/kg`;
  };

  return (
    <div
      onClick={() => onPress(seller)}
      className={`bg-[#12121A] rounded-2xl overflow-hidden border border-[#2A2A3A] cursor-pointer hover:border-orange-500/50 transition-colors ${index > 0 ? 'mt-3' : ''}`}
    >
      <div className="h-36 relative">
        <img
          src={seller.imageUrl || 'https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=400'}
          alt={seller.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          {seller.isOpen ? (
            <span className="flex items-center gap-1 bg-green-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              Open
            </span>
          ) : (
            <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
              Closed
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-white font-bold text-base truncate flex-1 mr-2">{seller.businessName}</h3>
          {seller.isVerified && (
            <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
              <ShieldCheck size={14} />
              Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mb-2.5">
          <MapPin size={14} className="text-gray-500" />
          <p className="text-gray-500 text-sm truncate">{seller.address}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-white text-sm font-semibold">{seller.rating}</span>
            <span className="text-gray-500 text-xs">({seller.reviewCount})</span>
          </div>
          <span className={`font-bold text-base ${seller.pricePerKg <= 0 ? 'text-gray-500 text-sm' : 'text-orange-500'}`}>
            {formatPrice(seller.pricePerKg)}
          </span>
        </div>

        {seller.deliveryFee > 0 && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#2A2A3A]">
            <Bike size={12} className="text-gray-500" />
            <span className="text-gray-500 text-xs">Delivery ₦{seller.deliveryFee}</span>
          </div>
        )}
      </div>
    </div>
  );
}
