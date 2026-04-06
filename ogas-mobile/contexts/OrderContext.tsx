import React, { createContext, useContext, useState, useCallback } from "react";
import { collection, addDoc, Timestamp, GeoPoint } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CartItem {
  size: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

interface OrderContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  cartTotal: number;
  createOrder: (deliveryAddress: string, location: { lat: number; lng: number }) => Promise<string>;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => [...prev, item]);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const createOrder = async (deliveryAddress: string, location: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      const sellerId = cart[0]?.sellerId;
      const orderData = {
        buyerId: "current_user_id",
        sellerId,
        items: cart,
        total: cartTotal,
        status: "pending",
        deliveryAddress,
        location: new GeoPoint(location.lat, location.lng),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const orderRef = await addDoc(collection(db, "orders"), orderData);
      clearCart();
      return orderRef.id;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrderContext.Provider value={{
      cart, addToCart, removeFromCart, clearCart, cartTotal, createOrder, loading
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within OrderProvider");
  return context;
};
