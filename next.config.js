/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: false,
  },
  reactStrictMode: true,
}

module.exports = nextConfig
