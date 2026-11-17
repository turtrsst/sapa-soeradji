import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SOERA_PUBLIC_URL || 'https://sias.rsupsoeradji.id/soera-ai';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/soera-ai/admin', '/soera-ai/api/', '/admin', '/api/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
