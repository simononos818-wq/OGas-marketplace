"use client";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPhoto } from "@/lib/uploadPhoto";

const NAVY = '#16305e', TEAL = '#12a5b0';

export default function ProveYourShopCard({ uid, photoUrl }: { uid: string; photoUrl?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(!!photoUrl);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    setBusy(true); setErr(""); setPct(0);
    try {
      const url = await uploadPhoto({
        path: `sellers/${uid}/proof-${Date.now()}.jpg`,
        file: f,
        onProgress: setPct,
      });
      await updateDoc(doc(db, "sellers", uid), {
        shopPhotoUrl: url,
        photosPending: false,
        verifiedAt: new Date().toISOString(),
      });
      setDone(true);
    } catch (e: any) {
      console.error("shop photo upload failed:", e);
      setErr("Failed: " + (e?.code || e?.message || "network") + " - tap retry");
    } finally {
      setBusy(false);
    }
  }

  const earned = done || !!photoUrl;
  return (
    <div style={{ borderRadius: 16, border: "1.5px dashed #c9d6e8", padding: 16, margin: "12px 0", background: "#fff" }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: NAVY }}>📷 PROVE YOUR SHOP</div>
      <div style={{ color: "#5b616b", margin: "4px 0 12px", fontSize: 13, fontWeight: 600 }}>
        {earned ? "✅ Photo saved — you can be approved for the VERIFIED badge." : "Add 1 shop photo to qualify for the ✅ VERIFIED badge."}
      </div>
      {err && (
        <button onClick={() => setErr("")} style={{ display: "block", width: "100%", padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 12, border: "none", background: "#b91c1c", color: "#fff", marginBottom: 8 }}>
          {err}
        </button>
      )}
      <label style={{ display: "block", padding: 15, fontSize: 15, fontWeight: 700, textAlign: "center", borderRadius: 12, background: busy ? "#9ca3af" : TEAL, color: "#fff", cursor: busy ? "wait" : "pointer" }}>
        {busy ? `Uploading… ${pct}%` : earned ? "CHANGE PHOTO" : "ADD SHOP PHOTO"}
        <input type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={handlePick} />
      </label>
    </div>
  );
}
