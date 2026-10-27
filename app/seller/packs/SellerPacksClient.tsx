"use client";

import Link from "next/link";

const WA_NUMBER = "2349133110237"; // OGas WhatsApp line

type Pack = {
  icon: string;
  name: string;
  price: number;
  tagline: string;
  items: string[];
  featured?: boolean;
};

const PACKS: Pack[] = [
  {
    icon: "🥉",
    name: "STARTER",
    price: 450000,
    tagline: "Begin your gas business with the essential equipment and training.",
    items: [
      "50kg branded C-Smart cylinder — FILLED ✅",
      "Digital weighing scale",
      "Hose & regulator",
      "Fire extinguisher, apron & gloves",
      "Branded signboard",
      "FREE practical training",
      "OGas seller onboarding support",
    ],
  },
  {
    icon: "🥈",
    name: "BUSINESS",
    price: 900000,
    tagline: "For the serious seller — double capacity and full shop branding.",
    items: [
      "2× 50kg branded C-Smart cylinders — both FILLED ✅",
      "Heavy-duty platform scale",
      "2× hose & regulator sets",
      "Full safety kit + fire bucket",
      "Signboard + price board",
      "FREE practical training",
      "OGas seller onboarding support",
    ],
    featured: true,
  },
  {
    icon: "🥇",
    name: "MEGA DEALER",
    price: 1350000,
    tagline: "Build a higher-capacity operation with equipment for your team.",
    items: [
      "3× 50kg branded C-Smart cylinders — all FILLED ✅",
      "Industrial scale + backup scale",
      "Full safety kit + 2 extinguishers",
      "Complete shop branding",
      "OGas seller onboarding support",
      "FREE training for you + 1 worker",
    ],
  },
];

const naira = (v: number) => "₦" + v.toLocaleString("en-NG");

function waLink(packName: string, price: number) {
  const msg =
    "Hello OGas! I want to join the waitlist for the " +
    packName +
    " Pack (" +
    naira(price) +
    "). My name is ______ and I am based in ______. Please confirm supplier availability, the final package details and my delivery quote. I understand that no payment is due today.";
  return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
}

export default function SellerPacksClient() {
  return (
    <main className="packs-root">
      <header className="packs-hero">
        <Link href="/" className="packs-back">← Back to OGas</Link>
        <h1>Start Your Own Gas Business 🏆</h1>
        <p className="packs-lede">
          Start with filled branded cylinders, safety equipment, practical training
          and OGas seller onboarding. Package prices are shown below; delivery is quoted separately.
        </p>
        <div className="promo-strip">
          <strong>WAITLIST OPEN — NO PAYMENT TODAY.</strong> Join on WhatsApp and we will confirm
          supplier availability, final package details and your delivery quote before asking for payment.
        </div>
      </header>

      <section className="includes">
        <h2>EVERY PACK INCLUDES ✅</h2>
        <div className="includes-grid">
          <div>🔥 FREE practical training</div>
          <div>🛒 OGas seller onboarding support</div>
          <div>💚 3 months commission-free trading</div>
          <div>⛽ Filled branded 50kg C-Smart cylinders</div>
        </div>
      </section>

      <section className="packs-grid" aria-label="Gas business packages">
        {PACKS.map((p) => (
          <article
            key={p.name}
            className={"pack-card" + (p.featured ? " featured" : "")}
          >
            {p.featured && <div className="best-badge">MOST POPULAR</div>}
            <div className="pack-icon" aria-hidden="true">{p.icon}</div>
            <h3>{p.name} PACK</h3>
            <p className="pack-tagline">{p.tagline}</p>
            <div className="price-row">
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
              JOIN THE WAITLIST
            </a>
            <p className="deposit-note">
              No deposit on this page. We confirm stock, filled-cylinder availability and delivery quote first.
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
        .packs-back { color: #2dd4c2; font-size: 14px; text-decoration: none; display: inline-block; margin-bottom: 16px; min-height: 44px; }
        .packs-hero h1 { font-size: 28px; margin: 0 0 10px; color: #ffffff; }
        .packs-lede { font-size: 16px; line-height: 1.6; color: #c9d6e8; max-width: 620px; margin: 0 auto 16px; }
        .promo-strip {
          background: #e8a13a; color: #0a2540; font-size: 14px; line-height: 1.55;
          border-radius: 10px; padding: 12px; max-width: 620px; margin: 0 auto;
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
        .pack-tagline { font-size: 14px; line-height: 1.5; color: #c9d6e8; min-height: 42px; }
        .price-row { margin: 10px 0; }
        .price { font-size: 26px; font-weight: 800; color: #2dd4c2; }
        .pack-items { list-style: none; padding: 0; margin: 0 0 18px; text-align: left; }
        .pack-items li { font-size: 14px; line-height: 1.45; padding: 7px 4px; border-bottom: 1px dashed #1f3d75; color: #e6eefb; }
        .pack-cta {
          display: flex; align-items: center; justify-content: center; min-height: 52px;
          background: #0fb5a6; color: #0a2540; font-weight: 800;
          font-size: 15px; padding: 16px; border-radius: 12px; text-decoration: none;
          margin-top: auto; text-align: center; letter-spacing: .3px;
        }
        .pack-cta:active { background: #2dd4c2; }
        .deposit-note { font-size: 12px; line-height: 1.5; color: #aebfd6; margin-top: 10px; }
        .already {
          margin-top: 36px; background: #16305e; border: 1px dashed #2dd4c2;
          border-radius: 16px; padding: 24px; text-align: center;
        }
        .already h2 { font-size: 18px; color: #2dd4c2; margin: 0 0 8px; }
        .already p { color: #c9d6e8; font-size: 14px; line-height: 1.5; margin: 0 0 16px; }
        .already-cta {
          display: inline-flex; align-items: center; justify-content: center; min-height: 48px;
          background: transparent; border: 2px solid #2dd4c2;
          color: #2dd4c2; font-weight: 700; padding: 14px 28px; border-radius: 12px;
          text-decoration: none; font-size: 15px;
        }
        .packs-foot { text-align: center; font-size: 12px; line-height: 1.5; color: #8fa3c0; margin-top: 40px; }
        @media (max-width: 640px) {
          .packs-grid { grid-template-columns: 1fr; }
          .pack-tagline { min-height: 0; }
        }
      `}</style>
    </main>
  );
}
