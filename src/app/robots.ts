import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SOERA_PUBLIC_URL || 'https://soera.rsupsoeradji.id';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/admin/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
