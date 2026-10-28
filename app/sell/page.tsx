import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ClipboardList,
  MapPin,
  MessageCircle,
  Package,
  Store,
  WalletCards,
} from 'lucide-react';
import { whatsappLink } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Sell Cooking Gas Online in Nigeria — List Your LPG Shop',
  description: 'Reach cooking gas buyers on OGas. Register your LPG shop, add your prices, stock and delivery options, then submit your real business details for review.',
  alternates: { canonical: '/sell' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Sell Cooking Gas Online with OGas',
    description: 'Give local buyers a clear way to find your LPG shop, see your price per kg and order on OGas.',
    url: '/sell',
    type: 'website',
    locale: 'en_NG',
  },
};

const steps = [
  {
    title: 'Sign in and enter your business details',
    text: 'Use the seller desk, then add your business name, seller type, phone number, landmark and address.',
  },
  {
    title: 'Confirm your real shop location',
    text: 'Capture and confirm your GPS location. If GPS does not work, place the manual map pin at your shop.',
  },
  {
    title: 'Show buyers what you sell',
    text: 'Add front-of-shop and stock photos, available stock, prices, opening hours and delivery availability.',
  },
  {
    title: 'Submit your shop for review',
    text: 'Check your information and submit. Approval is not automatic; OGas reviews the business before the shop can go live.',
  },
];

const features = [
  {
    icon: Store,
    title: 'Your online LPG storefront',
    text: 'Give buyers a dedicated shop page with your real location, current price per kg and delivery options.',
  },
  {
    icon: Package,
    title: 'Price, stock and availability controls',
    text: 'Use your seller dashboard to update inventory and switch your store open or closed.',
  },
  {
    icon: ClipboardList,
    title: 'Digital orders and clear records',
    text: 'Manage marketplace orders and keep a clear record of each refill, including the weight entered from the scale.',
  },
  {
    icon: WalletCards,
    title: 'Earnings and payout tools',
    text: 'Review your seller earnings and complete the payout-account steps requested in your seller area.',
  },
];

const faqs = [
  {
    question: 'How do I become an OGas seller?',
    answer: 'Open seller registration, sign in, complete your business details, confirm your shop location, add the required photos and trading information, then submit for review.',
  },
  {
    question: 'Do I need a real gas shop or plant?',
    answer: 'Yes. OGas is for genuine LPG businesses. Registration requires a confirmed shop location and front-of-shop and stock photos so buyers can find a real seller.',
  },
  {
    question: 'Is seller approval automatic?',
    answer: 'No. OGas reviews each registration before the shop can go live. Submitting the form does not mean your shop is already approved.',
  },
  {
    question: 'What if my phone GPS fails?',
    answer: 'You can use the manual map pin during registration. Place it at your actual shop location before continuing.',
  },
  {
    question: 'Can I change my gas price and stock later?',
    answer: 'Yes. Sign in to your seller dashboard, update MY INVENTORY and tap SAVE CHANGES. You can also switch your store open or closed.',
  },
];

const supportLink = whatsappLink('Hello OGas, I need help registering my LPG shop as a seller.');

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Sell cooking gas online with OGas',
      url: 'https://www.ogaslpgmarketplace.com/sell',
      description: 'Seller registration information for independent LPG shops and gas plants joining the OGas marketplace.',
      inLanguage: 'en-NG',
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
};

export default function SellPage() {
  return (
    <div className="min-h-dvh bg-[#f4f6f8] pb-10 text-[#16305e]">
      <header className="px-5 pb-8 pt-6" style={{ background: 'linear-gradient(135deg, #16305e, #1e4078)' }}>
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="inline-flex min-h-[44px] items-center text-[13px] font-bold text-[#2dd4c2]">← OGas marketplace</Link>
          <div className="mt-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#2dd4c2]">
            <Store size={17} /> For cooking gas sellers
          </div>
          <h1 className="mt-2 max-w-xl text-[32px] font-black leading-[1.12] text-white">Sell cooking gas to more local customers</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#c9d6e8]">List your LPG shop on OGas and give buyers a clear way to find you, see your current price per kg and order for pickup or delivery where available.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link href="/seller/register" className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#12a5b0] px-4 text-[14px] font-extrabold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Start seller registration <ArrowRight size={16} />
            </Link>
            <Link href="/seller/login" className="flex min-h-[50px] items-center justify-center rounded-xl border border-[#6f88b3] px-4 text-[14px] font-extrabold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Seller sign in
            </Link>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[#9fb4d8]">Self-service registration · A real shop and review are required before going live</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <section aria-labelledby="seller-tools" className="rounded-2xl bg-white p-5" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#0a7f88]">Your business, easier to find</p>
          <h2 id="seller-tools" className="mt-1 text-[22px] font-black">What you can manage on OGas</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title}>
                  <Icon size={22} color="#12a5b0" />
                  <h3 className="mt-2 text-[15px] font-extrabold">{feature.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5b616b]">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="registration-steps" className="mt-5">
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#0a7f88]">Register without waiting for a call</p>
          <h2 id="registration-steps" className="mt-1 text-[22px] font-black">How to list your cooking gas shop</h2>
          <ol className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3 rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f7f8] text-[14px] font-black text-[#0a7f88]">{index + 1}</span>
                <div>
                  <h3 className="text-[15px] font-extrabold">{step.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5b616b]">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] leading-relaxed text-[#5b616b]">Your registration draft and uploaded photos are saved on your phone so you can continue if the page reloads.</p>
        </section>

        <section aria-labelledby="prepare" className="mt-5 rounded-2xl bg-[#e6f7f8] p-5">
          <div className="flex items-center gap-2">
            <BadgeCheck size={22} color="#0a7f88" />
            <h2 id="prepare" className="text-[19px] font-black">Prepare these before you start</h2>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              'Business name and seller type',
              'Phone number, landmark and address',
              'Access to your real shop location',
              'Front-of-shop and stock photos',
              'Current stock and prices',
              'Opening hours and delivery availability',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#33465f]">
                <Check size={16} className="mt-0.5 shrink-0" color="#0a7f88" /> {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-[#33465f]"><Camera size={17} className="mt-0.5 shrink-0" /> Use clear, genuine photos of your own business. Never send your password, PIN or OTP to anyone helping you register.</p>
        </section>

        <section aria-labelledby="seller-faq" className="mt-6">
          <h2 id="seller-faq" className="text-[22px] font-black">Seller registration questions</h2>
          <div className="mt-3 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                <summary className="min-h-[32px] cursor-pointer text-[14px] font-extrabold leading-relaxed">{faq.question}</summary>
                <p className="mt-2 text-[13px] leading-relaxed text-[#5b616b]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-[#16305e] p-5 text-center text-white">
          <MapPin size={25} className="mx-auto" color="#2dd4c2" />
          <h2 className="mt-2 text-[21px] font-black">Ready to put your LPG shop on the map?</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#c9d6e8]">Complete the real registration steps and submit your business for OGas review.</p>
          <Link href="/seller/register" className="mt-4 flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#12a5b0] px-4 text-[14px] font-extrabold text-white">
            Register my gas shop <ArrowRight size={16} />
          </Link>
          <a href={supportLink} target="_blank" rel="noreferrer" className="mx-auto mt-2 inline-flex min-h-[44px] items-center justify-center gap-2 px-3 text-[13px] font-bold text-[#2dd4c2] underline underline-offset-4">
            <MessageCircle size={16} /> Need a person? WhatsApp OGas
          </a>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  );
}
