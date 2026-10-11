import Link from 'next/link'

export const metadata = {
  title: 'How Escrow Works — Safe Gas Payments on OGas',
  description:
    'OGas protects every gas purchase with escrow: your payment is held safely by Paystack and only released to the seller when you confirm your gas with your private Door Code.',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does OGas escrow protect my gas payment?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you pay on OGas, your money is held securely by Paystack — it does not go to the seller yet. The seller prepares or delivers your gas, you check it, and only then do you release payment by sharing your private Door Code. If anything goes wrong before confirmation, your money is still protected.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the OGas Door Code?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Door Code is a private code shown on your order. Only share it with the seller after you have received and checked your gas. Sharing the code releases your escrow payment to the seller. Never share it before you have your gas.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if there is a problem with my order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Do not share your Door Code. Contact OGas support immediately via WhatsApp (0913 311 0237) or email support@ogaslpgmarketplace.com. Because your payment is still in escrow, we can investigate and resolve the dispute before any money moves.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know I received the full weight of gas I paid for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'OGas sellers weigh your cylinder on a scale as part of the Weigh & Fill process, and your receipt shows the exact kg delivered. Nobody short-fills you twice after you have seen the scale receipt.',
      },
    },
  ],
}

export default function HowEscrowWorksPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="bg-[#16305e] text-white px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2dd4c2]">Safe payments</p>
          <h1 className="text-2xl font-bold mt-2 leading-snug">How escrow protects every naira you spend on gas</h1>
          <p className="mt-3 text-[#c9d9e6] text-sm leading-relaxed">
            In a cash market, once you pay, your money is gone — even if the gas never comes.
            OGas changes that. Every payment is held in escrow and released only when you confirm your gas.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">The 4 steps</h2>
          <ol className="mt-3 space-y-3 text-sm text-gray-700">
            <li><span className="font-semibold text-[#16305e]">1. Order &amp; pay.</span> Choose a verified seller, order by kg or cylinder, and pay securely with Paystack.</li>
            <li><span className="font-semibold text-[#16305e]">2. Money is held — not sent.</span> Your payment sits in escrow. The seller can see it, but cannot touch it yet.</li>
            <li><span className="font-semibold text-[#16305e]">3. Receive &amp; check your gas.</span> Your cylinder is weighed on a scale — your receipt shows the exact kg delivered.</li>
            <li><span className="font-semibold text-[#16305e]">4. Release with your Door Code.</span> Happy with your gas? Share your private Door Code. Only then is the seller paid.</li>
          </ol>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">Your Door Code is your power</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            The Door Code is a private code on your order. <strong>Never share it before you have your gas.</strong>{' '}
            No code, no payment — it is that simple. If a seller asks for the code before delivering, refuse and contact support.
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-lg">If something goes wrong</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            Keep your Door Code private and reach us immediately — because your money is still in escrow, we can
            investigate and resolve disputes before any money moves.
          </p>
          <p className="mt-3 text-sm text-gray-700">
            WhatsApp:{' '}
            <a href="https://wa.me/2349133110237" className="text-[#16305e] font-semibold">0913 311 0237</a>
            {' '}· Email:{' '}
            <a href="mailto:support@ogaslpgmarketplace.com" className="text-[#16305e] font-semibold">support@ogaslpgmarketplace.com</a>
          </p>
        </section>

        <section className="bg-[#16305e] text-white rounded-2xl p-5 text-center">
          <p className="font-bold text-lg">Buy gas with confidence</p>
          <Link href="/" className="inline-block mt-3 bg-white text-[#16305e] font-bold px-6 py-2.5 rounded-xl">
            Find sellers near you
          </Link>
        </section>
      </div>
    </main>
  )
}
