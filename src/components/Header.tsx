'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/chat', label: 'Tanya SAPA PASIEN' },
  { href: '/jadwal', label: 'Jadwal Dokter' },
  { href: '/home-care', label: 'Home Care' },
  { href: '/kampanye', label: 'Kampanye' },
  { href: '/keluhan', label: 'Keluhan' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-rst-100 bg-white/85 backdrop-blur-lg">
      {/* strip darurat */}
      <div className="bg-rst-950 text-white text-[11px] leading-6">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span className="hidden xs:inline">Darurat 24 Jam:</span> <a href="tel:0272321020" className="font-bold hover:underline">(0272) 321020 ext 200</a>
          </span>
          <div className="flex items-center gap-3">
            <a href="https://rsupsoeradji.id" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-1 hover:underline">rsupsoeradji.id <Icon name="external" size={10} /></a>
            <a href="mailto:rsupsoeradji_klaten@yahoo.com" className="hidden md:flex items-center gap-1 hover:underline">rsupsoeradji_klaten@yahoo.com</a>
            <Link href="/admin" className="flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10">Admin</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/images/sapa-pasien-logo.png" alt="Logo SAPA PASIEN" width={44} height={44} className="h-11 w-11 object-contain" priority />
            <span className="leading-tight">
              <span className="block text-[17px] font-extrabold tracking-tight text-rst-900">SAPA PASIEN</span>
              <span className="hidden sm:block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-rst-500 max-w-[240px]">Strategi Akses Pemasaran Digital &amp; Pelayanan Terintegrasi</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-rst-800">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`rounded-lg px-3 py-2 transition ${active ? 'bg-rst-600 text-white shadow-sm' : 'hover:bg-rst-50 hover:text-rst-950'}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button className="lg:hidden rounded-lg p-2 text-rst-800 hover:bg-rst-50" onClick={() => setOpen(!open)} aria-label="Menu">
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-rst-100 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-1.5">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? 'bg-rst-600 text-white' : 'bg-rst-50 text-rst-800'}`}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
