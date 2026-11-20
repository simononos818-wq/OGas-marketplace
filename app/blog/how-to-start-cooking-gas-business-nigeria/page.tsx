import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Start a Cooking Gas Business in Nigeria (2026 Guide)",
  description:
    "A complete step-by-step guide to starting a cooking gas business in Nigeria: registration, licensing, suppliers, safety, pricing and getting customers.",
  alternates: { canonical: "https://www.ogaslpgmarketplace.com/blog/how-to-start-cooking-gas-business-nigeria" },
  openGraph: {
    title: "How to Start a Cooking Gas Business in Nigeria (2026 Guide)",
    description: "Step-by-step: registration, licensing, suppliers, safety, pricing and getting customers.",
    url: "https://www.ogaslpgmarketplace.com/blog/how-to-start-cooking-gas-business-nigeria",
    siteName: "OGas",
    type: "article",
  },
};

const TEAL = "#12a5b0";
const NAVY = "#16305e";
const LINK = { color: TEAL, fontWeight: 700 } as const;

export default function StartGuidePage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 64px", fontFamily: "inherit", color: "#1a2332", lineHeight: 1.7 }}>
      <p style={{ marginBottom: 8 }}>
        <a href="/" style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}>Back to OGas</a>
      </p>

      <article>
        <h1 style={{ color: NAVY, fontSize: 30, lineHeight: 1.25 }}>How to Start a Cooking Gas Business in Nigeria: The Complete 2026 Step-by-Step Guide</h1>

        <p>Cooking gas is one of the few products in Nigeria where demand never falls. Every home cooks, every day, and millions of households are switching to LPG faster every year.</p>
        <p>Dependable doesn't mean automatic. The sellers who last follow a process. This is that process.</p>

        <h2 style={{ color: NAVY }}>Step 1: Learn the business before you spend anything</h2>
        <p>Spend one week watching how gas retail actually works. Visit plants, talk to sellers, observe a busy shop. Learn how per-kg pricing works, where plants are and their delivery minimums, and which cylinder sizes your neighborhood actually uses. See <a href="/blog/cost-to-start-cooking-gas-business-nigeria" style={LINK}>what it actually costs in 2026</a></p>

        <h2 style={{ color: NAVY }}>Step 2: Register with CAC</h2>
        <p>A registered business name takes days online. Plants and banks prefer registered businesses, and gas retail regulation is tightening. Licensed, registered outlets are the direction of policy; unregistered ones are its target.</p>

        <h2 style={{ color: NAVY }}>Step 3: Choose location deliberately</h2>
        <p>The best positions share three traits: <strong>visibility</strong> (junction, market edge, estate gate), <strong>access</strong> (delivery can reach customers, suppliers trucks can reach you), and <strong>safety clearance</strong> (away from open flames and fuel stations). Pay monthly until the location proves itself.</p>

        <h2 style={{ color: NAVY }}>Step 4: Get licensed and compliant</h2>
        <p>Budget for CAC registration, state and local permits, and fire safety requirements. Compliance is positioning: enforcement against unsafe, unlicensed retail has already begun in several states, and compliant sellers will inherit the customers of those who weren't.</p>

        <h2 style={{ color: NAVY }}>Step 5: Source cylinders and equipment</h2>
        <p>Start with the cylinder sizes your customers actually use. Non-negotiables: a certified digital platform scale, fire extinguisher and safety signage, hoses, regulators, and leak-detection spray.</p>

        <h2 style={{ color: NAVY }}>Step 6: Find your supplier</h2>
        <p>Your nearest licensed plant is usually best, short distance means lower delivery cost. Build the relationship. <em>Want organized supply pricing from day one? Message us on WhatsApp, current rates, no guesswork: 0913 311 0237.</em></p>

        <h2 style={{ color: NAVY }}>Step 7: Set your price, then protect it with trust</h2>
        <p>Price to the market, not below it. Win on things price can't buy: weigh in front of the customer, deliver fast, keep cylinders clean, give honest change and honest kg.</p>

        <h2 style={{ color: NAVY }}>Step 8: Get found where customers already are</h2>
        <ol>
          <li><strong>Google Maps</strong> cooking gas near me is searched constantly. A free Google Business Profile puts you in those results.</li>
          <li><strong>A verified marketplace</strong> OGas connects you to customers searching for gas online, with every order recorded. Register in minutes: <a href="/seller/register" style={LINK}>ogaslpgmarketplace.com/seller/register</a></li>
          <li><strong>WhatsApp like a shop</strong> status updates on prices and delivery days. Your contacts are your first customers.</li>
        </ol>

        <h2 style={{ color: NAVY }}>Step 9: Keep records from day one</h2>
        <p>Notebook, spreadsheet, app, doesn't matter. Every sale written down. Records show your real margin, prove your business to a bank, and become compliance evidence as regulation arrives.</p>

        <h2 style={{ color: NAVY }}>Your first 30 days, the checklist</h2>
        <ul>
          <li>Study the business one week</li>
          <li>Register with CAC</li>
          <li>Secure location (monthly rent, safety clearance)</li>
          <li>Obtain permits</li>
          <li>Buy cylinders plus certified scale plus safety kit</li>
          <li>Negotiate supplier terms</li>
          <li>Open business account, keep records</li>
          <li>Create Google Business Profile</li>
          <li>Register as an OGas seller: <a href="/seller/register" style={LINK}>ogaslpgmarketplace.com/seller/register</a></li>
          <li>Month-one review: what sold, what didn't</li>
        </ul>

        <h2 style={{ color: NAVY }}>The one thing that decides everything</h2>
        <p>The sellers who win aren't the ones with the most capital, they're the ones customers <em>trust</em>. Trust is built one honest refill at a time, and in 2026 trust is increasingly <em>verifiable</em>: records, registration, reviews, a digital footprint. Build that from day one and you're not starting a shop, you're building a business.</p>
        <p><em>OGas Ventures, Nigeria's verified LPG marketplace. Safe Gas. Bigger Opportunities. WhatsApp 0913 311 0237, support@ogaslpgmarketplace.com</em></p>
      </article>
    </main>
  );
}
