import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Much Does It Cost to Start a Cooking Gas Business in Nigeria?",
  description:
    "Real 2026 costs for starting a cooking gas business in Nigeria: cylinders, scale, rent, licensing and the hidden costs beginners miss.",
  alternates: { canonical: "https://www.ogaslpgmarketplace.com/blog/cost-to-start-cooking-gas-business-nigeria" },
  openGraph: {
    title: "How Much Does It Cost to Start a Cooking Gas Business in Nigeria?",
    description: "Real 2026 costs: cylinders, scale, rent, licensing and the hidden costs beginners miss.",
    url: "https://www.ogaslpgmarketplace.com/blog/cost-to-start-cooking-gas-business-nigeria",
    siteName: "OGas",
    type: "article",
  },
};

const TEAL = "#12a5b0";
const NAVY = "#16305e";
const LINK = { color: TEAL, fontWeight: 700 } as const;

export default function CostGuidePage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 64px", fontFamily: "inherit", color: "#1a2332", lineHeight: 1.7 }}>
      <p style={{ marginBottom: 8 }}>
        <a href="/" style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}>Back to OGas</a>
      </p>

      <article>
        <h1 style={{ color: NAVY, fontSize: 30, lineHeight: 1.25 }}>How Much Does It Really Cost to Start a Cooking Gas Business in Nigeria? (2026 Honest Guide)</h1>

        <p>Every week, someone asks the same question in gas seller groups across Nigeria: <em>How much do I need to start selling cooking gas?</em> Most answers they get are either outdated, optimistic, or come from people trying to sell them something.</p>
        <p>This guide is different. We run an LPG retail shop in Ughelli, Delta State, and we build technology for gas sellers across Nigeria. We will show you what your money actually buys and where beginners waste it.</p>

        <h2 style={{ color: NAVY }}>The honest answer</h2>
        <p>It depends on your location, cylinder mix, and stock level, and any article quoting you one fixed number is guessing. For today's actual figures, current cylinder prices, per-kg gas rates, and what a complete setup costs right now, <strong>message us on WhatsApp (0913 311 0237) or email support@ogaslpgmarketplace.com. Real numbers, not estimates.</strong></p>

        <h2 style={{ color: NAVY }}>What your money actually buys</h2>
        <p><strong>1. Gas cylinders, your core assets.</strong> Your cylinders are your shop; customers judge you by them. New cylinder prices change with the market, get today's quotation free on WhatsApp or by email. <em>Tip: quality used cylinders cost less, but verify the valve, recertification date, and test for leaks before buying.</em></p>
        <p><strong>2. An honest scale.</strong> Your scale is your reputation. It is the single most important tool in your business, one under-filled cylinder can end your name in an entire neighborhood.</p>
        <p><strong>3. Rent and location.</strong> Location decides whether you thrive or starve. Pay monthly where possible; do not sink capital into long leases before cash flow proves the location.</p>
        <p><strong>4. Gas stock.</strong> Per-kg rates move weekly, always confirm current rates with your local plant or with us before budgeting.</p>
        <p><strong>5. Licensing and registration.</strong> Register with CAC and budget for your state permits. Regulation in Nigeria's gas retail sector is tightening, the sellers who comply early will benefit most when enforcement fully arrives.</p>
        <p><strong>6. The costs beginners forget.</strong> Fire safety equipment, cylinder transportation, hoses and regulators, and a small cash float. Most failed budgets miss this category entirely.</p>

        <h2 style={{ color: NAVY }}>The packaged route: the OGas Seller Starter Program</h2>
        <p>Instead of sourcing everything alone, start with a complete, organized setup, every pack includes filled branded cylinders, safety equipment, free practical training, seller onboarding, and 3 months commission-free trading:</p>
        <ul>
          <li><strong>OGas Greenlight Pack, ₦450,000</strong> Get the Greenlight.</li>
          <li><strong>OGas Evergreen Pack, ₦900,000</strong> Stay Evergreen.</li>
          <li><strong>OGas Emerald Pack, ₦1,350,000</strong> Everything included.</li>
          <li><strong>Training-only, ₦10,000.</strong></li>
        </ul>
        <p>One seller spent ₦1.5 million on four empty cylinders, no gas, no training, no support. The Emerald Pack is the entire business, delivered.</p>

        <div style={{ background: "#eef7f8", borderLeft: "4px solid " + TEAL, padding: "16px 20px", borderRadius: 8, margin: "24px 0" }}>
          <p style={{ margin: 0 }}><strong>Full details:</strong> <a href="/seller/packs" style={LINK}>ogaslpgmarketplace.com/seller/packs</a><br />
          <strong>Join the waitlist:</strong> <a href="/seller/register" style={LINK}>ogaslpgmarketplace.com/seller/register</a><br />
          <strong>Talk to us first:</strong> WhatsApp 0913 311 0237, support@ogaslpgmarketplace.com</p>
        </div>

        <h2 style={{ color: NAVY }}>Three mistakes that kill new gas businesses</h2>
        <ol>
          <li>Competing on price instead of trust, the cheapest seller in the street is rarely the one customers return to.</li>
          <li>Skipping the scale and the records, in 2026 unrecorded retail is becoming a liability, not a habit.</li>
          <li>Buying everything new at retail, organized supply pricing changes the math entirely.</li>
        </ol>

        <h2 style={{ color: NAVY }}>The bottom line</h2>
        <p>A cooking gas business in Nigeria is one of the most dependable retail ventures available, demand is daily, products don't expire, margins are stable. The winners won't be the ones with the most capital. They'll be the ones who start honest, start compliant, and build trust from day one.</p>
        <p><em>OGas Ventures, Nigeria's verified LPG marketplace, from Ughelli, Delta State. Safe Gas. Bigger Opportunities.</em></p>
      </article>
    </main>
  );
}
