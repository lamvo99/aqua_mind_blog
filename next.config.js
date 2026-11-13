/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow tooling (E2E tests, CI) to build/serve into an isolated directory so the
  // normal `.next` build output is never replaced. Defaults to `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/tools/setup-planner',
        destination: '/setup-planner',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
