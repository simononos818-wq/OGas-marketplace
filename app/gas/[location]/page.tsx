import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BadgeCheck, Flame, MapPin, ShieldCheck } from 'lucide-react';
import { listPublicSellers } from '@/lib/public-sellers';
import { getGasLocation, sellersForLocation, GAS_LOCATIONS } from '@/lib/gas-locations';
import { getSellerBadge } from '@/lib/seller-badges';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ location: string }> };

const sellersForSlug = cache(async (slug: string) => {
  const location = getGasLocation(slug);
  if (!location) return { location: null, sellers: [] };
  try {
    const sellers = sellersForLocation(await listPublicSellers(100), location);
    return { location, sellers };
  } catch {
    return { location, sellers: [] };
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { location: slug } = await params;
  const { location, sellers } = await sellersForSlug(slug);
  if (!location) return { title: 'LPG location not found', robots: { index: false, follow: false } };
  const title = `Cooking Gas Refill in ${location.name} — Verified LPG Sellers`;
  const description = `Find verified cooking gas sellers in ${location.name}, ${location.region}. Compare live LPG prices per kg on OGas and order with a weighed receipt.`;
  return {
    title,
    description,
    alternates: { canonical: `/gas/${location.slug}` },
    robots: { index: sellers.length > 0, follow: true },
    openGraph: { title, description, url: `/gas/${location.slug}`, type: 'website', locale: 'en_NG' },
  };
}

export default async function GasLocationPage({ params }: Props) {
  const { location: slug } = await params;
  const { location, sellers } = await sellersForSlug(slug);
  if (!location) notFound();

  const itemList = sellers.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Verified LPG sellers in ${location.name}`,
    numberOfItems: sellers.length,
    itemListElement: sellers.map((seller, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://www.ogaslpgmarketplace.com/buy/${seller.id}`,
      name: seller.businessName,
    })),
  } : null;

  return (
    <div className="min-h-dvh bg-[#f4f6f8] pb-10 text-[#16305e]" style={{ maxWidth: 480, margin: '0 auto' }}>
      <header className="px-5 pb-7 pt-6" style={{ background: 'linear-gradient(135deg, #16305e, #1e4078)' }}>
        <Link href="/shops" className="inline-flex min-h-[44px] items-center text-[13px] font-bold text-[#2dd4c2]">← All LPG shops</Link>
        <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#2dd4c2]">
          <MapPin size={16} /> {location.name}, {location.region}
        </div>
        <h1 className="mt-2 max-w-[380px] text-[30px] font-black leading-[1.12] text-white">Cooking gas refill in {location.name}</h1>
        <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-[#c9d6e8]">{location.introduction}</p>
      </header>

      <main className="px-4 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-extrabold">Verified sellers with live prices</h2>
          <span className="text-[12px] font-bold text-[#5b616b]">{sellers.length} {sellers.length === 1 ? 'shop' : 'shops'}</span>
        </div>

        {sellers.length > 0 ? (
          <div className="space-y-3">
            {sellers.map((seller) => {
              const badge = getSellerBadge({ isApproved: true }, seller.completedOrders);
              return (
                <article key={seller.id} className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck size={17} color="#0fa958" />
                        <h3 className="truncate text-[16px] font-extrabold">{seller.businessName}</h3>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#5b616b]">{seller.area}</p>
                      {badge && <p className="mt-1 text-[11px] font-extrabold text-[#0a7a42]">{badge.tier} SELLER</p>}
                    </div>
                    <p className="shrink-0 text-right text-[18px] font-black">₦{seller.pricePerKg.toLocaleString()}<span className="block text-[11px] font-semibold text-[#5b616b]">per kg</span></p>
                  </div>
                  <Link href={`/buy/${seller.id}`} className="mt-4 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#12a5b0] px-4 text-[13px] font-extrabold text-white">
                    View shop and order <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="rounded-2xl border border-dashed border-[#9fb4d8] bg-white p-5">
            <Flame size={26} color="#12a5b0" />
            <h2 className="mt-3 text-[17px] font-extrabold">No listed seller matched this area just yet</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5b616b]">You can browse every verified OGas shop or register your own LPG business. We do not invent shop listings or prices for locations we have not verified.</p>
            <div className="mt-4 grid gap-2">
              <Link href="/shops" className="flex min-h-[46px] items-center justify-center rounded-xl bg-[#16305e] px-4 text-[13px] font-extrabold text-white">Browse all verified shops</Link>
              <Link href="/sell" className="flex min-h-[46px] items-center justify-center rounded-xl border border-[#12a5b0] px-4 text-[13px] font-extrabold text-[#0a7f88]">Sell cooking gas with OGas</Link>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl bg-[#e6f7f8] p-4">
          <div className="flex items-center gap-2"><ShieldCheck size={19} color="#0a7f88" /><h2 className="text-[15px] font-extrabold">A clearer refill, every time</h2></div>
          <p className="mt-2 text-[14px] leading-relaxed text-[#33465f]">OGas sellers list their price per kilogram. Your order records the kg entered from the scale, and eligible online payments stay in escrow until you confirm with your Door Code.</p>
          <Link href="/how-escrow-works" className="mt-2 inline-flex min-h-[44px] items-center text-[13px] font-extrabold text-[#0a7f88] underline">How OGas escrow works</Link>
        </section>

        <section className="mt-5 rounded-2xl bg-white p-5" style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
          <h2 className="text-[18px] font-black">Buying cooking gas in {location.name}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5b616b]">Compare the verified sellers listed above by their current price per kilogram and shop area. Open a seller page to confirm the latest price, delivery fee, stock and available fulfilment options before placing your order.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5b616b]">Where delivery is offered, provide accurate contact and delivery details. Your OGas order keeps a digital record of the refill and the weight entered from the scale.</p>
        </section>

        <section className="mt-5 rounded-2xl bg-[#16305e] p-5 text-white">
          <h2 className="text-[18px] font-black">Sell cooking gas in {location.name}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#c9d6e8]">Run a genuine LPG shop or gas plant? Register your business, confirm your real shop location and submit it for review so local buyers can discover you on OGas.</p>
          <Link href="/sell" className="mt-3 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#12a5b0] px-4 text-[13px] font-extrabold text-white">See how to become a seller <ArrowRight size={15} /></Link>
        </section>

        <nav aria-label="Other LPG locations" className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-bold">
          {GAS_LOCATIONS.filter((item) => item.slug !== location.slug).map((item) => (
            <Link key={item.slug} href={`/gas/${item.slug}`} className="inline-flex min-h-[44px] items-center text-[#0a7f88]">LPG in {item.name} →</Link>
          ))}
          <Link href="/assistant" className="inline-flex min-h-[44px] items-center text-[#0a7f88]">Ask OGas AI →</Link>
        </nav>
      </main>
      {itemList && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />}
    </div>
  );
}
