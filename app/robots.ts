import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/dashboard', '/orders', '/api/'],
    },
    sitemap: 'https://ogaslpgmarketplace.com/sitemap.xml',
  };
}
