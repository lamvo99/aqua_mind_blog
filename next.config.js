const wave1 = require('./lib/wave1-redirects.json')

function isActivatableWave1Group(group) {
  return (
    group.status === 'READY_FOR_ACTIVATION' &&
    group.contentMigrated === true &&
    group.factualApproved === true &&
    group.editorialApproved === true
  )
}

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
      {
        source: '/plants/java-moss',
        destination: '/plants/taxiphyllum-barbieri',
        permanent: true,
      },
      {
        source: '/corals/acan-lords',
        destination: '/corals/acan-lord',
        permanent: true,
      },
      // Wave 1 redirects are data-driven. W1-09 and W1-10 are activated after
      // content migration/link updates; the remaining groups stay disabled until
      // their specialist/editorial gates are cleared.
      ...wave1.groups
        .filter(isActivatableWave1Group)
        .map((group) => ({
          source: group.secondary,
          destination: group.primary,
          statusCode: 301,
        })),
    ];
  },
};
module.exports = nextConfig;
