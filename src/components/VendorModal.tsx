"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingCart, Star, MapPin, Clock, BadgeCheck } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { Vendor, Cylinder } from "@/types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface VendorModalProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (vendor: Vendor, cylinder: Cylinder, quantity: number, type: "purchase" | "refill") => void;
}

export function VendorModal({ vendor, isOpen, onClose, onAddToCart }: VendorModalProps) {
  const [selectedCylinder, setSelectedCylinder] = useState<Cylinder | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<"purchase" | "refill">("refill");

  if (!vendor) return null;

  const handleAddToCart = () => {
    if (selectedCylinder) {
      onAddToCart(vendor, selectedCylinder, quantity, orderType);
      onClose();
      setSelectedCylinder(null);
      setQuantity(1);
    }
  };

  const totalPrice = selectedCylinder
    ? (orderType === "refill" ? selectedCylinder.refillPrice : selectedCylinder.price) * quantity
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-dark-bg border-t border-dark-border rounded-t-3xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
              <div className="w-12 h-1.5 rounded-full bg-dark-border" />
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-20px)]">
              <div className="relative h-48 bg-dark-lighter">
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-dark-card transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    {vendor.verified && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{vendor.name}</h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-dark-text">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-medium">{vendor.rating}</span>
                      <span>({vendor.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{(vendor.distance * 1000).toFixed(0)}m away</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{vendor.deliveryTime} mins delivery</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex gap-2 p-1 bg-dark-card rounded-xl">
                  <button
                    onClick={() => setOrderType("refill")}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                      orderType === "refill"
                        ? "bg-brand-500 text-white shadow-lg"
                        : "text-dark-text hover:text-white"
                    )}
                  >
                    Refill Cylinder
                  </button>
                  <button
                    onClick={() => setOrderType("purchase")}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                      orderType === "purchase"
                        ? "bg-brand-500 text-white shadow-lg"
                        : "text-dark-text hover:text-white"
                    )}
                  >
                    Buy New Cylinder
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Select Size</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {vendor.cylinders.map((cylinder) => {
                      const isSelected = selectedCylinder?.id === cylinder.id;
                      const price = orderType === "refill" ? cylinder.refillPrice : cylinder.price;
                      
                      return (
                        <motion.button
                          key={cylinder.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCylinder(cylinder);
                            setQuantity(1);
                          }}
                          className={cn(
                            "relative p-4 rounded-xl border-2 text-left transition-all",
                            isSelected
                              ? "border-brand-500 bg-brand-500/10"
                              : "border-dark-border bg-dark-card hover:border-dark-text/30"
                          )}
                        >
                          <div className="text-2xl font-bold text-white mb-1">{cylinder.size}</div>
                          <div className="text-sm text-dark-text mb-2">{cylinder.weight}kg</div>
                          <div className={cn("font-semibold", isSelected ? "text-brand-500" : "text-white")}>
                            {formatPrice(price)}
                          </div>
                          {!cylinder.inStock && (
                            <div className="absolute inset-0 bg-dark-bg/80 rounded-xl flex items-center justify-center">
                              <Badge variant="error">Out of Stock</Badge>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                
                {selectedCylinder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center justify-between p-4 bg-dark-card rounded-xl"
                  >
                    <span className="text-white font-medium">Quantity</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-full bg-dark-lighter flex items-center justify-center text-white hover:bg-dark-border transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-xl font-bold text-white w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-full bg-dark-lighter flex items-center justify-center text-white hover:bg-dark-border transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex items-center gap-4 pt-4 border-t border-dark-border">
                  <div className="flex-1">
                    <p className="text-sm text-dark-text">Total Amount</p>
                    <p className="text-2xl font-bold text-white">{formatPrice(totalPrice)}</p>
                  </div>
                  <Button
                    size="lg"
                    disabled={!selectedCylinder}
                    onClick={handleAddToCart}
                    leftIcon={<ShoppingCart className="w-5 h-5" />}
                    className="flex-[2]"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
