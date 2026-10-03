import type { MetadataRoute } from 'next';
import { adminDb } from '../lib/firebase-admin';

const BASE = 'https://ogaslpgmarketplace.com';

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, priority: 1.0, changeFrequency: 'daily' },
  { url: `${BASE}/shops`, priority: 0.9, changeFrequency: 'daily' },
  { url: `${BASE}/seller/register`, priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE}/launch`, priority: 0.6, changeFrequency: 'weekly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let shopPages: MetadataRoute.Sitemap = [];

  try {
    const snap = await adminDb
      .collection('sellers')
      .where('isApproved', '==', true)
      .get();

    shopPages = snap.docs
      .filter((doc) => doc.data().isActive !== false)
      .map((doc) => ({
        url: `${BASE}/shops?seller=${doc.id}`,
        lastModified: doc.data().updatedAt?.toDate?.() ?? new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
  } catch (e) {
    console.error('sitemap: seller fetch failed', e);
  }

  return [...staticPages, ...shopPages];
}
