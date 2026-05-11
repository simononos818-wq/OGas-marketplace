import React, { createContext, useContext, useState } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../config/firebase';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sellerId?: string;
  sellerName?: string;
  sellerDeliveryAvailable?: boolean;
  sellerDeliveryFee?: number;
}

interface PlaceOrderParams {
  customerAddress: string;
  customerPhone: string;
  deliveryRequested: boolean;
  deliveryFee: number;
}

interface OrderContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  total: number;
  placeOrder: (params: PlaceOrderParams) => Promise<string>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = getCartTotal();

  const placeOrder = async (params: PlaceOrderParams) => {
    const orderData = {
      items: cart,
      total: total + params.deliveryFee,
      subtotal: total,
      deliveryFee: params.deliveryFee,
      deliveryRequested: params.deliveryRequested,
      customerAddress: params.customerAddress,
      customerPhone: params.customerPhone,
      paymentReference: `OGAS_${Date.now()}`,
      paymentStatus: 'pending',
      status: 'pending_payment',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
  };

  return (
    <OrderContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, total, placeOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used within OrderProvider');
  return context;
};
