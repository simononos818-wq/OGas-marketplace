"use client";

import Link from "next/link";

const WA_NUMBER = "2349133110237"; // OGas WhatsApp line

type Pack = {
  icon: string;
  name: string;
  price: number;
  oldPrice: number;
  tagline: string;
  items: string[];
  featured?: boolean;
};

const PACKS: Pack[] = [
  {
    icon: "🥉",
    name: "STARTER",
    price: 450000,
    oldPrice: 500000,
    tagline: "Begin your gas business — everything you need in one box.",
    items: [
      "47kg Calor cylinder — FILLED ✅",
      "Digital weighing scale",
      "Hose & regulator",
      "Fire extinguisher, apron & gloves",
      "Branded signboard",
      "FREE training + certificate",
      "6 months featured on OGas",
    ],
  },
  {
    icon: "🥈",
    name: "BUSINESS",
    price: 900000,
    oldPrice: 1000000,
    tagline: "For the serious seller — double capacity, full branding.",
    items: [
      "2× 47kg Calor cylinders — both FILLED ✅",
      "Heavy-duty platform scale",
      "2× hose & regulator sets",
      "Full safety kit + fire bucket",
      "Signboard + price board",
      "FREE training + certificate",
      "12 months featured on OGas",
    ],
    featured: true,
  },
  {
    icon: "🥇",
    name: "MEGA DEALER",
    price: 1350000,
    oldPrice: 1500000,
    tagline: "Own your area — big capacity, certified partner status.",
    items: [
      "3× 47kg Calor cylinders (1 filled + 2 spare)",
      "Industrial scale + backup scale",
      "Full safety kit + 2 extinguishers",
      "Complete shop branding",
      "OGas Certified Partner badge",
      "FREE training for you + 1 worker",
      "24 months featured + delivery support",
    ],
  },
];

const naira = (v: number) => "₦" + v.toLocaleString("en-NG");

function waLink(packName: string, price: number) {
  const msg =
    "Hello OGas! I want to book the " +
    packName +
    " Pack (" +
    naira(price) +
    " promo price). My name is ______ and I am based in ______.";
  return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
}

export default function SellerPacksClient() {
  return (
    <main className="packs-root">
      <header className="packs-hero">
        <Link href="/" className="packs-back">← Back to OGas</Link>
        <h1>Start Your Own Gas Business 🏆</h1>
        <p className="packs-lede">
          One refill = <strong>₦15,000 profit</strong>. People cook every day.
          We package the whole business — equipment, training and your own
          online shop.
        </p>
        <div className="promo-strip">
          ⏰ FIRST 10 BUYERS GET <strong>₦50,000 OFF</strong> — promo ends
          31 October
        </div>
      </header>

      <section className="includes">
        <h2>EVERY PACK INCLUDES ✅</h2>
        <div className="includes-grid">
          <div>🔥 FREE one-day training (worth ₦10k)</div>
          <div>🛒 Your shop LIVE on OGas same day</div>
          <div>💚 3 months commission-free</div>
          <div>📍 Featured listing — buyers find you first</div>
        </div>
      </section>

      <section className="packs-grid">
        {PACKS.map((p) => (
          <article
            key={p.name}
            className={"pack-card" + (p.featured ? " featured" : "")}
          >
            {p.featured && <div className="best-badge">MOST POPULAR</div>}
            <div className="pack-icon">{p.icon}</div>
            <h3>{p.name} PACK</h3>
            <p className="pack-tagline">{p.tagline}</p>
            <div className="price-row">
              <span className="old-price">{naira(p.oldPrice)}</span>
              <span className="price">{naira(p.price)}</span>
            </div>
            <ul className="pack-items">
              {p.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
            <a
              className="pack-cta"
              href={waLink(p.name, p.price)}
              target="_blank"
              rel="noopener noreferrer"
            >
              BOOK WITH 50% DEPOSIT
            </a>
            <p className="deposit-note">
              Deposit: {naira(p.price / 2)} to lock your price & training seat
            </p>
          </article>
        ))}
      </section>

      <section className="already">
        <h2>ALREADY SELL GAS? ⛽</h2>
        <p>You get cylinder and shop already? Join OGas free and start receiving orders today.</p>
        <Link href="/seller/register" className="already-cta">JOIN AS SELLER — FREE</Link>
      </section>

      <footer className="packs-foot">
        OGas Ventures • CAC BN 9638951 • WhatsApp 09133110237 •
        ogaslpgmarketplace.com
      </footer>

      <style jsx>{`
        .packs-root {
          min-height: 100vh;
          background: #0a2540;
          color: #ffffff;
          font-family: inherit;
          padding: 16px 16px 48px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .packs-hero { text-align: center; padding: 24px 0 8px; }
        .packs-back { color: #2dd4c2; font-size: 14px; text-decoration: none; display: inline-block; margin-bottom: 16px; }
        .packs-hero h1 { font-size: 28px; margin: 0 0 10px; color: #ffffff; }
        .packs-lede { font-size: 16px; color: #c9d6e8; max-width: 560px; margin: 0 auto 16px; }
        .promo-strip {
          background: #e8a13a; color: #0a2540; font-size: 15px;
          border-radius: 10px; padding: 12px; max-width: 520px; margin: 0 auto;
        }
        .includes { margin: 28px 0; }
        .includes h2 { text-align: center; font-size: 16px; color: #2dd4c2; margin-bottom: 14px; }
        .includes-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }
        .includes-grid div {
          background: #16305e; border: 1px solid #1f3d75; border-radius: 10px;
          padding: 14px; font-size: 14px; text-align: center;
        }
        .packs-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px; align-items: stretch;
        }
        .pack-card {
          position: relative; background: #16305e; border: 2px solid #1f3d75;
          border-radius: 16px; padding: 24px 18px; text-align: center;
          display: flex; flex-direction: column;
        }
        .pack-card.featured { border-color: #0fb5a6; box-shadow: 0 0 0 3px rgba(15,181,166,.25); }
        .best-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #0fb5a6; color: #0a2540; font-size: 11px; font-weight: 700;
          padding: 4px 12px; border-radius: 20px;
        }
        .pack-icon { font-size: 40px; }
        .pack-card h3 { margin: 6px 0 2px; font-size: 20px; }
        .pack-tagline { font-size: 13px; color: #c9d6e8; min-height: 36px; }
        .price-row { margin: 10px 0; }
        .old-price { text-decoration: line-through; color: #8fa3c0; margin-right: 8px; font-size: 15px; }
        .price { font-size: 26px; font-weight: 800; color: #2dd4c2; }
        .pack-items { list-style: none; padding: 0; margin: 0 0 18px; text-align: left; }
        .pack-items li { font-size: 13.5px; padding: 7px 4px; border-bottom: 1px dashed #1f3d75; color: #e6eefb; }
        .pack-cta {
          display: block; background: #0fb5a6; color: #0a2540; font-weight: 800;
          font-size: 15px; padding: 16px; border-radius: 12px; text-decoration: none;
          margin-top: auto; text-align: center; letter-spacing: .3px;
        }
        .pack-cta:active { background: #2dd4c2; }
        .deposit-note { font-size: 12px; color: #8fa3c0; margin-top: 10px; }
        .already {
          margin-top: 36px; background: #16305e; border: 1px dashed #2dd4c2;
          border-radius: 16px; padding: 24px; text-align: center;
        }
        .already h2 { font-size: 18px; color: #2dd4c2; margin: 0 0 8px; }
        .already p { color: #c9d6e8; font-size: 14px; margin: 0 0 16px; }
        .already-cta {
          display: inline-block; background: transparent; border: 2px solid #2dd4c2;
          color: #2dd4c2; font-weight: 700; padding: 14px 28px; border-radius: 12px;
          text-decoration: none; font-size: 15px;
        }
        .packs-foot { text-align: center; font-size: 12px; color: #5a7291; margin-top: 40px; }
      `}</style>
    </main>
  );
}
