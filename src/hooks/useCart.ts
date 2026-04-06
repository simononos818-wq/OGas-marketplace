"use client";

import { useState, useCallback } from "react";
import type { CartItem, Cylinder, Vendor } from "@/types";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((vendor: Vendor, cylinder: Cylinder, type: "purchase" | "refill" = "refill") => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.vendorId === vendor.id && item.cylinder.id === cylinder.id && item.type === type
      );

      if (existingIndex > -1) {
        const updated = [...current];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [
        ...current,
        {
          vendorId: vendor.id,
          vendorName: vendor.name,
          cylinder,
          quantity: 1,
          type,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((vendorId: string, cylinderId: string, type: "purchase" | "refill") => {
    setItems((current) =>
      current.filter(
        (item) => !(item.vendorId === vendorId && item.cylinder.id === cylinderId && item.type === type)
      )
    );
  }, []);

  const updateQuantity = useCallback((vendorId: string, cylinderId: string, type: "purchase" | "refill", quantity: number) => {
    if (quantity <= 0) {
      removeItem(vendorId, cylinderId, type);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.vendorId === vendorId && item.cylinder.id === cylinderId && item.type === type
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = item.type === "refill" ? item.cylinder.refillPrice : item.cylinder.price;
    return sum + price * item.quantity;
  }, 0);

  return {
    items,
    isOpen,
    setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
