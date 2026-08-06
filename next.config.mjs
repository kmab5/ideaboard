/** @type {import('next').NextConfig} */

// Supabase is reached directly from the browser (auth, database, storage), so
// it must be allowed in connect-src and img-src. Vercel Analytics needs its
// own script/connect origins.
const SUPABASE_ORIGINS = 'https://*.supabase.co wss://*.supabase.co';
const VERCEL_ANALYTICS = 'https://va.vercel-scripts.com https://vitals.vercel-insights.com';

// NOTE: 'unsafe-inline'/'unsafe-eval' in script-src are required by Next.js's
// inline bootstrap and dev-time refresh. Tightening this to a nonce-based
// policy is tracked as a hardening follow-up in SECURITY.md.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VERCEL_ANALYTICS}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://*.supabase.co`,
  `font-src 'self' data:`,
  `connect-src 'self' ${SUPABASE_ORIGINS} ${VERCEL_ANALYTICS}`,
  `media-src 'self' blob:`,
  `worker-src 'self' blob:`,
  // Clickjacking protection (modern equivalent of X-Frame-Options).
  `frame-ancestors 'none'`,
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Defense in depth for older browsers that ignore frame-ancestors.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  // Don't advertise the framework version to attackers.
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Block SVG rendering through the image optimizer (SVG can carry script).
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
