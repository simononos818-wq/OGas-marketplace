/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['firebase-admin', 'jose', 'jwks-rsa', '@google-cloud/firestore'],
  async redirects() {
    return [
      {
        source: '/blog',
        destination: 'https://blog.ogaslpgmarketplace.com',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: 'https://blog.ogaslpgmarketplace.com/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}


module.exports = nextConfig
