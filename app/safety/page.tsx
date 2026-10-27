import Link from 'next/link'

export const metadata = {
  title: 'Cooking Gas Safety — LPG Safety Tips & Checks | OGas',
  description:
    'Simple LPG safety guide for Nigerian homes and businesses: how to check your gas hose, spot leaks, store cylinders safely, and what to do if you smell gas.',
  alternates: { canonical: '/safety' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What should I do if I smell gas at home?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Do not switch any light or electrical device on or off. Do not use a flame or your phone near the leak. Open doors and windows, turn off the cylinder valve if it is safe to do so, move everyone outside, and call your gas seller or emergency help from a safe distance.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I check my gas cylinder for leaks?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mix soap and water, apply it to the valve, regulator and hose connections, and watch for bubbles. Bubbles mean gas is escaping — turn off the valve and replace the faulty part. Never test for leaks with a flame.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should I change my gas hose?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Inspect your hose monthly for cracks, brittleness or bulges, and replace it at least every 2 years or immediately if damaged. Always use a proper LPG-rated hose and clips, not ordinary rubber tubing.',
      },
    },
  ],
}

const tips = [
  ['🧼', 'Check for leaks with soapy water', 'Apply soapy water to the valve, regulator and hose. Bubbles = leak. Never use a flame to test.'],
  ['🔧', 'Inspect your hose monthly', 'Look for cracks, brittleness or bulges. Replace at least every 2 years — sooner if damaged. Use LPG-rated hose only.'],
  ['🌬️', 'Cook in a ventilated space', 'Keep a window or door open when cooking with gas. Never use LPG in a sealed room.'],
  ['🧯', 'Keep cylinders upright', 'Store and use cylinders standing upright, away from heat, flames and direct sunlight.'],
  ['🚫', 'Smell gas? No switches, no flames', 'Do not touch electrical switches. Open windows, close the cylinder valve, move out, call for help from a safe distance.'],
  ['👶', 'Keep children away', 'Never leave children alone near a connected cylinder or a lit burner.'],
  ['⚖️', 'Buy from verified sellers', 'Verified OGas sellers weigh on a scale and follow safe filling practices. Short-filling and bad cylinders thrive in the informal market.'],
  ['🔥', 'Turn off after cooking', 'Close the burner, then the regulator or cylinder valve — every time.'],
]

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="bg-[#16305e] text-white px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2dd4c2]">Safety hub</p>
          <h1 className="text-2xl font-bold mt-2 leading-snug">Cooking gas safety, in plain language</h1>
          <p className="mt-3 text-[#c9d9e6] text-sm leading-relaxed">
            LPG is clean, cheap and safe — when handled right. These checks take seconds and protect your family,
            your customers and your business.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-3">
        {tips.map(([icon, title, body]) => (
          <section key={title} className="bg-white rounded-2xl shadow-sm p-4 flex gap-3">
            <div className="text-2xl shrink-0">{icon}</div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">{body}</p>
            </div>
          </section>
        ))}

        <section className="bg-[#16305e] text-white rounded-2xl p-5 text-center">
          <p className="font-bold text-lg">Safe gas starts with a verified seller</p>
          <Link href="/" className="inline-block mt-3 bg-white text-[#16305e] font-bold px-6 py-2.5 rounded-xl">
            Find verified sellers
          </Link>
        </section>
      </div>
    </main>
  )
}
