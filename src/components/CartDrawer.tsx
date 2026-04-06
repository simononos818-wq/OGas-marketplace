"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";
import { Button } from "./ui/Button";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onUpdateQuantity: (vendorId: string, cylinderId: string, type: "purchase" | "refill", quantity: number) => void;
  onRemoveItem: (vendorId: string, cylinderId: string, type: "purchase" | "refill") => void;
}

export function CartDrawer({ isOpen, onClose, items, totalPrice, onUpdateQuantity, onRemoveItem }: CartDrawerProps) {
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-dark-bg border-l border-dark-border shadow-2xl"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Your Cart</h2>
                    <p className="text-sm text-dark-text">{items.length} items</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-dark-card flex items-center justify-center text-dark-text hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-4">
                      <ShoppingBag className="w-10 h-10 text-dark-text" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
                    <p className="text-dark-text mb-6">Add some gas cylinders to get started</p>
                    <Button onClick={onClose} variant="secondary">
                      Browse Vendors
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.vendorId}-${item.cylinder.id}-${item.type}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-dark-card rounded-2xl border border-dark-border"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl bg-dark-lighter flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-brand-500">{item.cylinder.size}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-white truncate">{item.vendorName}</h4>
                                <p className="text-sm text-dark-text">{item.cylinder.weight}kg • {item.type === "refill" ? "Refill" : "New Purchase"}</p>
                              </div>
                              <button
                                onClick={() => onRemoveItem(item.vendorId, item.cylinder.id, item.type)}
                                className="p-2 text-dark-text hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => onUpdateQuantity(item.vendorId, item.cylinder.id, item.type, item.quantity - 1)}
                                  className="w-8 h-8 rounded-lg bg-dark-lighter flex items-center justify-center text-white hover:bg-dark-border transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-white font-medium w-6 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.vendorId, item.cylinder.id, item.type, item.quantity + 1)}
                                  className="w-8 h-8 rounded-lg bg-dark-lighter flex items-center justify-center text-white hover:bg-dark-border transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="font-bold text-white">
                                {formatPrice((item.type === "refill" ? item.cylinder.refillPrice : item.cylinder.price) * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {items.length > 0 && (
                <div className="p-6 border-t border-dark-border space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-dark-text">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-dark-text">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(500)}</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-bold text-white pt-2 border-t border-dark-border">
                      <span>Total</span>
                      <span>{formatPrice(totalPrice + 500)}</span>
                    </div>
                  </div>
                  
                  <Link href="/checkout">
                    <Button size="lg" className="w-full" rightIcon={<ArrowRight className="w-5 h-5" />}>
                      Proceed to Checkout
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
