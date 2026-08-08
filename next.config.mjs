/** @type {import('next').NextConfig} */

// Supabase is reached directly from the browser (auth, database, storage), so
// it must be allowed in connect-src and img-src. Vercel Analytics needs its
// own script/connect origins.
const SUPABASE_ORIGINS = 'https://*.supabase.co wss://*.supabase.co';
const VERCEL_ANALYTICS = 'https://va.vercel-scripts.com https://vitals.vercel-insights.com';

// NOTE on 'unsafe-inline'/'unsafe-eval' in script-src: a nonce-based policy was
// implemented and then reverted, because Next.js can only inject per-request
// nonces into *dynamically rendered* pages. This app statically prerenders its
// public pages, whose script tags would then carry no nonce and be blocked
// outright by 'strict-dynamic'. Adopting a nonce policy requires opting the
// whole app out of static rendering — a real trade-off, documented in
// SECURITY.md rather than made silently.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VERCEL_ANALYTICS}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://*.supabase.co`,
  `font-src 'self' data:`,
  `connect-src 'self' ${SUPABASE_ORIGINS} ${VERCEL_ANALYTICS}`,
  `media-src 'self' blob:`,
  `worker-src 'self' blob:`,
  `frame-ancestors 'none'`,
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Clickjacking protection; frame-ancestors in the CSP covers modern browsers.
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
