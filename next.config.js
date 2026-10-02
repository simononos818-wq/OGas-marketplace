/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/sell',
        destination: '/seller/register',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
