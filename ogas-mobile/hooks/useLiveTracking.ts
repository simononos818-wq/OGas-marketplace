"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useLiveTracking(orderId: string) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, "tracking", orderId), (snap) => {
      setTracking(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);
  
  return { tracking, loading };
}
