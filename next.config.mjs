/** @type {import('next').NextConfig} */
// Base-path deploy (mis. sias.rsupsoeradji.id/soera-ai/): build dengan
//   SOERA_BASE_PATH=/soera-ai npm run build
// Default '' = root (tidak ada perubahan untuk instalasi root).
// Semua link next/link, router, fetch via helper bp() ikut prefix ini.
const basePath = (process.env.SOERA_BASE_PATH || '').replace(/\/+$/, '');
if (basePath && !basePath.startsWith('/')) {
  throw new Error('SOERA_BASE_PATH harus diawali "/" (mis. /soera-ai), bukan: ' + basePath);
}
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // HSTS tanpa includeSubDomains — aman untuk host tunggal.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js memerlukan inline script/style; 'unsafe-eval' hanya untuk dev/runtime tertentu
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  basePath: basePath || undefined,
  // Expose ke client (di-inline saat build) untuk fetch() manual via bp().
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
export default nextConfig;
