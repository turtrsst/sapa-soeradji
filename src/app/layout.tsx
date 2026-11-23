import type { Metadata, Viewport } from 'next';
import './globals.css';
import { bp } from '@/lib/basePath';

export const metadata: Metadata = {
  title: { default: 'SOERA AI — RSUP Dr. Soeradji Tirtonegoro Klaten', template: '%s | SOERA AI RS Soeradji' },
  description: 'SOERA AI (Soeradji Assistant Intelligent): chatbot & layanan digital RSUP Dr. Soeradji Tirtonegoro Klaten. Tanya jadwal dokter, keluhan, Home Care, kampanye kesehatan — online maupun offline.',
  applicationName: 'SOERA AI',
  metadataBase: new URL(process.env.SOERA_PUBLIC_URL || 'https://sias.rsupsoeradji.id/soera-ai'),
  manifest: bp('/manifest.webmanifest'),
  icons: { icon: bp('/images/soera-ai-logo.png'), apple: bp('/images/soera-ai-logo.png') },
  keywords: ['RSUP Dr Soeradji Tirtonegoro', 'SOERA AI', 'rumah sakit Klaten', 'jadwal dokter', 'home care', 'pendaftaran online RS Soeradji'],
};

export const viewport: Viewport = {
  themeColor: '#0a2523',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#f4f8f7] text-[#12312e]">{children}</body>
    </html>
  );
}
