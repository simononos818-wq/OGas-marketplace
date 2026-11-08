"use client";
import { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPhoto } from "@/lib/uploadPhoto";

const NAVY = '#16305e', TEAL = '#12a5b0';

export default function ProfilePhotoUploader({ uid, currentPhoto, size = 96 }: { uid: string; currentPhoto?: string | null; size?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    setBusy(true); setErr("");
    try {
      const url = await uploadPhoto({
        path: `users/${uid}/avatar.jpg`,
        file: f,
      });
      await updateDoc(doc(db, "users", uid), { photoURL: url });
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      console.error(e);
      setErr("Network wahala. Tap to retry.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => !busy && inputRef.current?.click()}
        className="relative rounded-full overflow-hidden shrink-0"
        style={{ width: size, height: size, border: `3px solid ${TEAL}`, background: NAVY, cursor: busy ? "wait" : "pointer" }}
        aria-label="Change profile photo"
      >
        {currentPhoto ? (
          <img src={currentPhoto} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className={`text-white font-extrabold flex items-center justify-center w-full h-full ${size >= 80 ? "text-3xl" : "text-2xl"}`}>
            {busy ? "…" : "+"}
          </span>
        )}
        <span className="absolute bottom-0 right-0 text-white text-[8px] font-bold px-1 py-0.5" style={{ background: TEAL }}>
          {busy ? "UP" : "EDIT"}
        </span>
      </button>
      {err && <button onClick={() => setErr("")} className="text-[10px] font-bold text-white px-2 py-1 rounded-lg" style={{ background: "#b91c1c" }}>{err}</button>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={busy} onChange={handlePick} />
    </div>
  );
}
