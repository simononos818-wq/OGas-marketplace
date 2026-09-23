'use client';
import { useState, type CSSProperties } from "react";

const NAVY = "#0B2545";
const TEAL = "#0FA3A3";
const TEAL_DARK = "#0B7E7E";

type Props = { shopId: string };

type Payment = "cash" | "transfer";

const KG_PRESETS = [3, 6, 12.5, 25, 50];

export default function WalkInSaleButton({ shopId }: Props) {
  const [open, setOpen] = useState(false);
  const [kg, setKg] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [payment, setPayment] = useState<Payment>("cash");
  const [phone, setPhone] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setKg("");
    setAmount("");
    setPayment("cash");
    setPhone("");
    setDone(null);
    setError(null);
  }

  async function save() {
    if (!navigator.onLine) {
      setError("No network. Try again.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          kg: parseFloat(kg),
          amount: parseFloat(amount),
          paymentType: payment,
          customerPhone: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "save failed");
      setDone({ count: data.walkinsToday });
    } catch {
      setError("Did not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    fontSize: "1.4rem",
    padding: "14px 16px",
    borderRadius: 12,
    border: `2px solid ${NAVY}`,
    marginBottom: 12,
  };

  const labelStyle: CSSProperties = {
    fontSize: "0.85rem",
    color: "#555",
    marginBottom: 4,
    display: "block",
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); reset(); }}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "1.3rem",
          fontWeight: 700,
          borderRadius: 14,
          border: "none",
          background: TEAL,
          color: "#fff",
          marginBottom: 16,
        }}
      >
        + Walk-in sale
      </button>
    );
  }

  if (done) {
    return (
      <div
        style={{
          border: `3px solid ${TEAL}`,
          borderRadius: 14,
          padding: 20,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: "2rem", color: TEAL_DARK, fontWeight: 800 }}>Saved</div>
        <div style={{ fontSize: "1rem", color: "#444", marginTop: 6 }}>
          Today&apos;s walk-ins: {done.count}
        </div>
        <button
          onClick={() => { reset(); }}
          style={{
            marginTop: 14,
            width: "100%",
            padding: "14px",
            fontSize: "1.1rem",
            fontWeight: 700,
            borderRadius: 12,
            border: "none",
            background: NAVY,
            color: "#fff",
          }}
        >
          + Another sale
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        border: `2px solid ${NAVY}`,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <label style={labelStyle}>KG (pick or type)</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {KG_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setKg(String(p))}
            style={{
              padding: "12px 18px",
              fontSize: "1.15rem",
              fontWeight: 700,
              borderRadius: 10,
              border: `2px solid ${NAVY}`,
              background: parseFloat(kg) === p ? NAVY : "#fff",
              color: parseFloat(kg) === p ? "#fff" : NAVY,
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Amount (naira)</label>
      <input
        type="number"
        inputMode="numeric"
        placeholder="e.g. 12500"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Payment</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["cash", "transfer"] as Payment[]).map((p) => (
          <button
            key={p}
            onClick={() => setPayment(p)}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "1.2rem",
              fontWeight: 700,
              borderRadius: 10,
              border: "none",
              background: payment === p ? TEAL : "#E4E9F0",
              color: payment === p ? "#fff" : "#333",
            }}
          >
            {p === "cash" ? "Cash" : "Transfer"}
          </button>
        ))}
      </div>

      <label style={labelStyle}>Customer phone (optional - for SMS discount)</label>
      <input
        type="tel"
        inputMode="tel"
        placeholder="0913 000 0000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
      />

      {error && (
        <div style={{ color: "#C0392B", fontSize: "0.95rem", marginBottom: 10 }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setOpen(false)}
          style={{
            flex: 1,
            padding: "14px",
            fontSize: "1.1rem",
            borderRadius: 12,
            border: `2px solid ${NAVY}`,
            background: "#fff",
            color: NAVY,
          }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving || !(parseFloat(kg) > 0 && parseFloat(amount) > 0)}
          style={{
            flex: 2,
            padding: "14px",
            fontSize: "1.2rem",
            fontWeight: 800,
            borderRadius: 12,
            border: "none",
            background: saving ? "#999" : TEAL,
            color: "#fff",
          }}
        >
          {saving ? "Saving..." : "Save sale"}
        </button>
      </div>
    </div>
  );
}
