"use client";

import { useState, useCallback } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateBreakdown, getDeliveryFee } from '@/lib/gasCalculator';

export type OrderStatus = 
  | 'pending'      // Buyer placed order, waiting for seller
  | 'confirmed'    // Seller accepted
  | 'preparing'    // Seller preparing gas
  | 'out_for_delivery' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled';

export interface OrderItem {
  kg: number;
  litres: number;
  pricePerKg: number;
  quantity: number;
}

export interface Order {
  id?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryFee: number;
  subtotal: number;
  platformFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'paystack' | 'cash_on_delivery' | 'transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paystackRef?: string;
  createdAt: any;
  updatedAt: any;
  buyerLocation: { lat: number; lng: number; address: string };
  sellerLocation: { lat: number; lng: number; address: string };
  notes?: string;
  rating?: number;
  review?: string;
}

export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Create a new order */
  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'>): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const order: Omit<Order, 'id'> = {
        ...orderData,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), order);
      setLoading(false);
      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      setLoading(false);
      return null;
    }
  }, []);

  /** Get real-time orders for a buyer */
  const subscribeToBuyerOrders = useCallback((buyerId: string, callback: (orders: Order[]) => void) => {
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      callback(orders);
    });
  }, []);

  /** Get real-time orders for a seller */
  const subscribeToSellerOrders = useCallback((sellerId: string, callback: (orders: Order[]) => void) => {
    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      callback(orders);
    });
  }, []);

  /** Update order status */
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setLoading(true);
    try {
      const ref = doc(db, 'orders', orderId);
      await updateDoc(ref, {
        status,
        updatedAt: Timestamp.now(),
      });
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, []);

  /** Get single order */
  const getOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Order;
    } catch {
      return null;
    }
  }, []);

  return {
    createOrder,
    subscribeToBuyerOrders,
    subscribeToSellerOrders,
    updateOrderStatus,
    getOrder,
    loading,
    error,
  };
}

export default useOrders;
