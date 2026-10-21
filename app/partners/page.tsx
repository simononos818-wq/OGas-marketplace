import Link from 'next/link'

export const metadata = {
  title: 'Partner with OGas — Distributors, Gas Plants, Lenders & Investors',
  description:
    'OGas Ventures is digitizing Nigeria\u2019s LPG retail: verified sellers, escrow payments, weigh-on-scale receipts, and sales data that unlocks financing. Partner with us as a distributor, gas plant, lender or investor.',
}

const lanes = [
  {
    icon: '🏭',
    title: 'Gas plants & refineries',
    body: 'Reach a growing network of verified retail sellers with predictable, data-backed demand. We are formalizing wholesale relationships for our Seller Starter Program and seller inventory.',
  },
  {
    icon: '🚚',
    title: 'Distributors & logistics',
    body: 'OGas routes real consumer demand to the last mile. Partner to move LPG efficiently from plant to shop to household across Delta State and beyond.',
  },
  {
    icon: '💳',
    title: 'Lenders & financial partners',
    body: 'Every OGas order creates verified sales data for established independent sellers — the exact data inventory financing needs. We are building the aggregation channel for seller loans.',
  },
  {
    icon: '📈',
    title: 'Investors',
    body: 'Nigeria consumes ~1.4M tonnes of LPG a year (≈₦2 trillion retail) with a federal target of 5M tonnes by 2030 — and the retail layer is 100% fragmented independents with no digital layer. OGas is that layer: marketplace + escrow + weigh-on-scale transparency + financing rails.',
  },
]

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <section className="bg-[#16305e] text-white px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2dd4c2]">Partners &amp; investors</p>
          <h1 className="text-2xl font-bold mt-2 leading-snug">
            The digital layer for Nigeria&apos;s cooking gas market
          </h1>
          <p className="mt-3 text-[#c9d9e6] text-sm leading-relaxed">
            OGas Ventures (CAC BN 9638951) is a registered Nigerian marketplace connecting verified
            independent LPG sellers to buyers — with escrow payments, live per-kg pricing and
            weigh-on-scale receipts that bring trust to a cash-based market.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        {lanes.map((l) => (
          <section key={l.title} className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <span>{l.icon}</span> {l.title}
            </h2>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{l.body}</p>
          </section>
        ))}

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Why now</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
            <li>Federal Decade of Gas policy is pushing millions of households from firewood to LPG</li>
            <li>Retail is fragmented across tens of thousands of independent sellers — no dominant digital player</li>
            <li>Trust failures (short-filling, unsafe cylinders, cash risk) are the market&apos;s biggest pain — and our product</li>
            <li>Verified sales data turns informal sellers into financeable businesses</li>
          </ul>
        </section>

        <section className="bg-[#16305e] text-white rounded-2xl p-5 text-center">
          <p className="font-bold text-lg">Let&apos;s talk</p>
          <p className="text-sm mt-1 text-[#c9d9e6]">Simon Onos — Founder, OGas Ventures</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
            <a href="https://wa.me/2349133110237" className="inline-block bg-white text-[#16305e] font-bold px-6 py-2.5 rounded-xl">
              WhatsApp us
            </a>
            <a href="mailto:support@ogaslpgmarketplace.com" className="inline-block bg-[#12a5b0] text-white font-bold px-6 py-2.5 rounded-xl">
              Email us
            </a>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400">
          Looking to buy or sell gas instead? <Link href="/" className="underline">Open the marketplace</Link>
        </p>
      </div>
    </main>
  )
}
