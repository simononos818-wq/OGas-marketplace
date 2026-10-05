import type { MetadataRoute } from 'next';

const BASE = 'https://ogaslpgmarketplace.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE}/shops`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/seller/register`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/launch`, priority: 0.6, changeFrequency: 'weekly' },
    { url: `${BASE}/terms`, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${BASE}/privacy`, priority: 0.3, changeFrequency: 'yearly' },
  ];
}
