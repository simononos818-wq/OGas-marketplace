import type { MetadataRoute } from 'next';
import { listPublicSellers } from '@/lib/public-sellers';
import { GAS_LOCATIONS, sellersForLocation } from '@/lib/gas-locations';

const SITE_URL = 'https://www.ogaslpgmarketplace.com';
export const revalidate = 3600;

const publicPages: Array<{
  path: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}> = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/shops', changeFrequency: 'daily', priority: 0.9 },
  { path: '/calculator', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/assistant', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/sell', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/seller/packs', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/how-escrow-works', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/safety', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/partners', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let sellers: Awaited<ReturnType<typeof listPublicSellers>> = [];
  try {
    sellers = await listPublicSellers(100);
  } catch {
    // Keep the main public URLs available if seller data is temporarily unavailable.
  }

  const pages: MetadataRoute.Sitemap = publicPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  for (const location of GAS_LOCATIONS) {
    if (sellersForLocation(sellers, location).length === 0) continue;
    pages.push({
      url: `${SITE_URL}/gas/${location.slug}`,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  for (const seller of sellers) {
    pages.push({
      url: `${SITE_URL}/buy/${seller.id}`,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  return pages;
}
