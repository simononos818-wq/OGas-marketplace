"use client";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPhoto } from "@/lib/uploadPhoto";

export default function ProveYourShopCard({ uid, photoUrl }: { uid: string; photoUrl?: string }) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    setBusy(true); setErr(""); setPct(0);
    try {
      const url = await uploadPhoto({
        path: `seller-docs/${uid}/shop-${Date.now()}.jpg`,
        file: f,
        onProgress: setPct,
      });
      await updateDoc(doc(db, "sellers", uid), {
        photoUrl: url,
        photosPending: false,
        level: 3,
        verifiedAt: new Date().toISOString(),
      });
    } catch {
      setErr("Network wahala. Tap TRY AGAIN.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", padding: 16, margin: "12px 0" }}>
      <div style={{ fontWeight: 700, fontSize: 18 }}>📷 PROVE YOUR SHOP</div>
      <div style={{ color: "#6b7280", margin: "4px 0 12px" }}>
        {photoUrl ? "✅ VERIFIED badge earned" : "Add 1 shop photo → earn the ✅ VERIFIED badge"}
      </div>
      {err && (
        <button onClick={() => setErr("")} style={{ display: "block", width: "100%", padding: 16, fontSize: 16, fontWeight: 700, borderRadius: 12, border: "none", background: "#b91c1c", color: "#fff", marginBottom: 8 }}>
          {err}
        </button>
      )}
      <label style={{ display: "block", padding: 16, fontSize: 16, fontWeight: 700, textAlign: "center", borderRadius: 12, background: busy ? "#9ca3af" : "#0e7490", color: "#fff", cursor: busy ? "wait" : "pointer" }}>
        {busy ? `Uploading… ${pct}%` : photoUrl ? "CHANGE PHOTO" : "ADD SHOP PHOTO"}
        <input type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={handlePick} />
      </label>
    </div>
  );
}
