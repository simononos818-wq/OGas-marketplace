"use client";

import Link from "next/link";

const cards = [
  {
    emoji: "⛽",
    title: "ALREADY SELL GAS?",
    body: "You get cylinder and shop already? Join OGas free — start receiving orders today.",
    cta: "JOIN AS SELLER",
    href: "#seller-form",
    style: "outline" as const,
  },
  {
    emoji: "🎓",
    title: "WANT TO START GAS BUSINESS?",
    body: "No equipment yet? We package everything: cylinder, scale, FREE training + your own online shop. From ₦450,000.",
    cta: "SEE STARTER PACKS",
    href: "/seller/packs",
    style: "solid" as const,
  },
];

export default function SellerEntryCards() {
  return (
    <section style={{ maxWidth: 720, margin: "0 auto 24px", display: "grid", gap: 14 }}>
      {cards.map((c) => (
        <Link
          key={c.title}
          href={c.href}
          style={{
            display: "block",
            textDecoration: "none",
            background: c.style === "solid" ? "#0fb5a6" : "#16305e",
            border: c.style === "solid" ? "2px solid #0fb5a6" : "2px solid #2dd4c2",
            borderRadius: 16,
            padding: "20px 18px",
            color: c.style === "solid" ? "#0a2540" : "#ffffff",
          }}
        >
          <div style={{ fontSize: 34 }}>{c.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 800, margin: "6px 0" }}>{c.title}</div>
          <div style={{ fontSize: 14, opacity: 0.92, marginBottom: 14 }}>{c.body}</div>
          <div
            style={{
              display: "inline-block",
              fontWeight: 800,
              fontSize: 15,
              padding: "13px 22px",
              borderRadius: 12,
              background: c.style === "solid" ? "#0a2540" : "transparent",
              color: "#2dd4c2",
              border: c.style === "solid" ? "none" : "2px solid #2dd4c2",
            }}
          >
            {c.cta} →
          </div>
        </Link>
      ))}
    </section>
  );
}
