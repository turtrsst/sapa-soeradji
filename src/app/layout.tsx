import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CampaignTicker from '@/components/CampaignTicker';

export const metadata: Metadata = {
  title: { default: 'SAPA PASIEN — RSUP Dr. Soeradji Tirtonegoro Klaten', template: '%s | SAPA PASIEN RST' },
  description: 'SAPA PASIEN (Strategi Akses Pemasaran Digital & Pelayanan Terintegrasi): chatbot & layanan digital RSUP Dr. Soeradji Tirtonegoro Klaten. Tanya jadwal dokter, keluhan, Home Care, kampanye kesehatan — online maupun offline.',
  applicationName: 'SAPA PASIEN',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/images/sapa-pasien-logo.png', apple: '/images/sapa-pasien-logo.png' },
  keywords: ['RSUP Dr Soeradji Tirtonegoro', 'SAPA PASIEN', 'rumah sakit Klaten', 'jadwal dokter', 'home care', 'pendaftaran online RST'],
};

export const viewport: Viewport = {
  themeColor: '#0a2523',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col">
        <Header />
        <CampaignTicker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
