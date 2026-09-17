import Link from 'next/link'

export const metadata = {
  title: 'About OGas Ventures — Registered LPG Marketplace in Nigeria',
  description:
    'OGas Ventures (CAC BN 9638951) is a registered Nigerian digital marketplace connecting LPG buyers with verified independent sellers. Transparent prices, secure escrow, seller financing.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <section className="bg-[#1a7a3c] text-white px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-200">
            About OGas Ventures
          </p>
          <h1 className="text-2xl font-bold mt-2 leading-snug">
            The digital marketplace for Nigeria's cooking gas trade
          </h1>
          <p className="mt-3 text-green-50 text-sm leading-relaxed">
            OGas Ventures is a registered Nigerian digital marketplace (internet services
            business) that connects buyers of Liquefied Petroleum Gas (LPG) with independent,
            verified sellers — from neighbourhood shops to licensed gas plants.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">What we do</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            Nigeria's LPG trade is still largely informal. Buyers struggle to find
            trustworthy sellers, compare prices, or know they are getting the correct weight.
            OGas is building a structured marketplace that onboards independent sellers and
            gas plants, distinguishes them by verification level, and gives buyers a simpler,
            safer way to find and buy cooking gas.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
            <li>Verified seller profiles with live, per-kg pricing</li>
            <li>Secure escrow payments — money is held safely until you confirm your gas</li>
            <li>Order by weight (kg) or by cylinder, for pickup or delivery</li>
            <li>Private in-app chat with number protection between buyers and sellers</li>
            <li>Seller tools for inventory, orders, and payments — plus access to inventory financing through lending partners</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">How it works</h2>
          <ol className="mt-3 space-y-3 text-sm text-gray-700">
            <li>
              <span className="font-semibold text-[#1a7a3c]">1. Find a seller.</span> Open the
              marketplace to see verified sellers near you, their live prices, and delivery
              options.
            </li>
            <li>
              <span className="font-semibold text-[#1a7a3c]">2. Order &amp; pay securely.</span>{' '}
              Pay with Paystack. Your money is held in escrow — the seller only receives it
              when you confirm delivery with your Door Code.
            </li>
            <li>
              <span className="font-semibold text-[#1a7a3c]">3. Collect your gas.</span> Meet
              the seller, confirm your order, and release your payment with your private code.
            </li>
          </ol>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Trust &amp; safety</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            Every seller on OGas passes through a tiered verification process. Independent
            sellers provide their real shop location (verified by GPS) and identity details.
            Gas plants — the highest tier — additionally provide NIN, DPR/NMDPRA licensing, and
            certifications. Escrow protects every payment, and chats are screened so personal
            contact details stay private until both sides agree.
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Company &amp; regulatory details</h2>
          <dl className="mt-3 space-y-2 text-sm text-gray-700">
            <div>
              <dt className="font-semibold">Registered name</dt>
              <dd>OGas Ventures (trading as OGas LPG Marketplace / Mega Think Success)</dd>
            </div>
            <div>
              <dt className="font-semibold">Registration</dt>
              <dd>
                Business Name, CAC BN: 9638951 — incorporated 26 June 2026 under the Companies
                and Allied Matters Act 2020. Nature of business: internet services (digital
                marketplace).
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Tax identification</dt>
              <dd>FIRS TIN: 2621012005709</dd>
            </div>
            <div>
              <dt className="font-semibold">Registered address</dt>
              <dd>Isodje Street Off Oteri, Anglican Junction, Ughelli, Delta State, Nigeria</dd>
            </div>
            <div>
              <dt className="font-semibold">Trading address</dt>
              <dd>Mega Think Success, 20 Ejumeghere Street, Isodje, Oteri, Ughelli, Delta State, Nigeria</dd>
            </div>
            <div>
              <dt className="font-semibold">Contact</dt>
              <dd>
                WhatsApp:{' '}
                <a href="https://wa.me/2349133110237" className="text-[#1a7a3c] font-semibold">
                  0913 311 0237
                </a>{' '}
                &bull; Email:{' '}
                <a href="mailto:support@ogaslpgmarketplace.com" className="text-[#1a7a3c] font-semibold">
                  support@ogaslpgmarketplace.com
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-[#1a7a3c] text-white rounded-2xl p-5 text-center">
          <p className="font-bold text-lg">Ready to buy or sell gas the smart way?</p>
          <Link
            href="/"
            className="inline-block mt-3 bg-white text-[#1a7a3c] font-bold px-6 py-2.5 rounded-xl"
          >
            Open the marketplace
          </Link>
        </section>
      </div>
    </main>
  )
}
