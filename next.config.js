const path = require('path');

const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: path.join(__dirname),
  generateBuildId: async () => 'build-' + Date.now(),
};

module.exports = nextConfig;
