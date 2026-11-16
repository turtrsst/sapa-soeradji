import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SOERA_PUBLIC_URL || 'https://soera.rsupsoeradji.id').replace(/\/$/, '');
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/chat`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/jadwal`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/home-care`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/kampanye`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/keluhan`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
