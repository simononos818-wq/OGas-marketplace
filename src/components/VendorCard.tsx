"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, BadgeCheck, Plus } from "lucide-react";
import { cn, formatPrice, formatDistance, formatTime } from "@/lib/utils";
import type { Vendor } from "@/types";
import { Badge } from "./ui/Badge";

interface VendorCardProps {
  vendor: Vendor;
  onSelect: (vendor: Vendor) => void;
  index?: number;
}

export function VendorCard({ vendor, onSelect, index = 0 }: VendorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      onClick={() => onSelect(vendor)}
      className={cn(
        "group relative bg-dark-card border border-dark-border rounded-2xl overflow-hidden cursor-pointer",
        "hover:border-brand-500/30 hover:shadow-xl hover:shadow-brand-500/5",
        "transition-all duration-300"
      )}
    >
      <div className="relative h-48 overflow-hidden bg-dark-lighter">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 to-transparent z-10" />
        
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {vendor.verified && (
            <Badge variant="success" className="flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
        
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-dark-bg/80 backdrop-blur-sm">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-white">{vendor.rating}</span>
          <span className="text-xs text-dark-text">({vendor.reviewCount})</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-brand-500">{vendor.cylinders[0]?.size || "12.5"}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-white group-hover:text-brand-500 transition-colors">
            {vendor.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-dark-text mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{formatDistance(vendor.distance)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(vendor.deliveryTime)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-dark-text uppercase tracking-wider">Available Sizes</p>
          <div className="flex flex-wrap gap-2">
            {vendor.cylinders.slice(0, 3).map((cylinder) => (
              <div
                key={cylinder.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-lighter border border-dark-border"
              >
                <span className="text-sm text-white font-medium">{cylinder.size}</span>
                <span className="text-xs text-brand-500">
                  {formatPrice(cylinder.refillPrice)}
                </span>
              </div>
            ))}
            {vendor.cylinders.length > 3 && (
              <div className="flex items-center px-3 py-1.5 rounded-lg bg-dark-lighter border border-dark-border">
                <span className="text-sm text-dark-text">+{vendor.cylinders.length - 3}</span>
              </div>
            )}
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(vendor);
          }}
          className="w-full mt-4 py-2.5 rounded-xl bg-dark-lighter border border-dark-border text-white font-medium flex items-center justify-center gap-2 hover:bg-brand-500 hover:border-brand-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          View Options
        </motion.button>
      </div>
    </motion.div>
  );
}
