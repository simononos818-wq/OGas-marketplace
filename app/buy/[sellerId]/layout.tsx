import type { Metadata } from 'next';
import { getPublicSeller } from '@/lib/public-sellers';
import { getSellerBadge } from '@/lib/seller-badges';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ sellerId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sellerId } = await params;
  try {
    const seller = await getPublicSeller(sellerId);
    if (!seller) {
      return { title: 'LPG seller unavailable', robots: { index: false, follow: false } };
    }
    const title = `${seller.businessName} — LPG Refill in ${seller.area}`;
    const description = `Buy cooking gas from ${seller.businessName}, a verified OGas LPG seller in ${seller.area}. See the current per-kg price, order for pickup or delivery, and receive a weighed receipt.`;
    return {
      title,
      description,
      alternates: { canonical: `/buy/${seller.id}` },
      openGraph: {
        type: 'website',
        url: `/buy/${seller.id}`,
        title,
        description,
        siteName: 'OGas — Online Gas Refill',
        locale: 'en_NG',
      },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return { title: 'Verified LPG Seller', robots: { index: false, follow: true } };
  }
}

export default async function SellerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  let structuredData: Record<string, any> | null = null;
  try {
    const seller = await getPublicSeller(sellerId);
    if (seller) {
      const badge = getSellerBadge({ isApproved: true }, seller.completedOrders);
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        '@id': `https://www.ogaslpgmarketplace.com/buy/${seller.id}#store`,
        name: seller.businessName,
        description: `Verified LPG seller on OGas${badge ? ` — ${badge.tier.toLowerCase()} seller badge` : ''}.`,
        url: `https://www.ogaslpgmarketplace.com/buy/${seller.id}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: seller.city || seller.area,
          addressRegion: seller.state,
          addressCountry: 'NG',
        },
        makesOffer: {
          '@type': 'Offer',
          url: `https://www.ogaslpgmarketplace.com/buy/${seller.id}`,
          priceCurrency: 'NGN',
          price: seller.pricePerKg,
          availability: 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'Service',
            name: 'LPG cooking gas refill per kilogram',
            serviceType: 'Cooking gas refill',
          },
        },
      };
    }
  } catch {
    // The buyer page can still read public seller data client-side if metadata is unavailable.
  }

  return (
    <>
      {children}
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
    </>
  );
}
