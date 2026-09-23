export const metadata = {
  title: 'Contact OGas Ventures — Support, WhatsApp & Visit Us',
  description:
    'Contact OGas Ventures: WhatsApp 0913 311 0237, support@ogaslpgmarketplace.com. Visit Mega Think Success, 20 Ejumeghere Street, Isodje, Oteri, Ughelli, Delta State, Nigeria.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <section className="bg-[#1a7a3c] text-white px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-200">
            Contact Us
          </p>
          <h1 className="text-2xl font-bold mt-2">Talk to OGas Ventures</h1>
          <p className="mt-3 text-green-50 text-sm leading-relaxed">
            Questions about an order, becoming a seller, or partnering with us? We are one
            message away.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Reach us directly</h2>
          <div className="mt-3 space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">💬 WhatsApp (fastest)</p>
              <a
                href="https://wa.me/2349133110237"
                className="text-[#1a7a3c] font-semibold text-base"
              >
                0913 311 0237
              </a>
              <p className="text-gray-500">Mon–Sat, 8:00 AM – 6:00 PM WAT</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">✉️ Email</p>
              <a
                href="mailto:support@ogaslpgmarketplace.com"
                className="text-[#1a7a3c] font-semibold"
              >
                support@ogaslpgmarketplace.com
              </a>
            </div>
            <div>
              <p className="font-semibold text-gray-900">🛟 Order support</p>
              <a href="/support" className="text-[#1a7a3c] font-semibold">
                Visit our support page →
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Visit us</h2>
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">Trading office / shop</p>
              <p>
                Mega Think Success
                <br />
                20 Ejumeghere Street, Isodje, Oteri,
                <br />
                Ughelli, Delta State, Nigeria
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Registered address</p>
              <p>
                OGas Ventures
                <br />
                Isodje Street Off Oteri, Anglican Junction,
                <br />
                Ughelli, Delta State, Nigeria
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Our products &amp; services</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
            <li>LPG (cooking gas) refill marketplace — order online from verified local gas sellers for pickup or delivery.</li>
            <li>Escrow-protected payments — money is held safely until the buyer confirms the cylinder is in their hands.</li>
            <li>Seller tools — free online storefront with live price and stock, order management, and sales records for gas retailers.</li>
            <li>Same-day gas delivery in Ughelli, Delta State, expanding across Delta.</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Business inquiries</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            For partnerships, seller financing, media, or government/institutional
            collaborations, contact the founder directly at{' '}
            <a href="mailto:support@ogaslpgmarketplace.com" className="text-[#1a7a3c] font-semibold">
              support@ogaslpgmarketplace.com
            </a>{' '}
            with the subject line &ldquo;Partnership&rdquo;.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            OGas Ventures &bull; CAC BN: 9638951 &bull; FIRS TIN: 2621012005709
          </p>
        </section>
      </div>
    </main>
  )
}
