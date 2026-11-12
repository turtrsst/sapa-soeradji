'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

export default function CampaignTicker() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    fetch('/api/kampanye')
      .then((r) => r.json())
      .then((d) => setItems((d.campaigns || []).map((c: any) => c.title).slice(0, 6)))
      .catch(() => setItems([]));
  }, []);
  if (!items.length) return null;
  const text = items.join('   •   ');
  return (
    <div className="border-b border-rst-100 bg-gold-400/90 text-rst-950 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 flex items-center gap-3 h-9">
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest bg-rst-950 text-gold-400 rounded-full px-2.5 py-1 shrink-0">
          <Icon name="megaphone" size={12} /> Kampanye
        </span>
        <div className="relative flex-1 overflow-hidden whitespace-nowrap h-9 flex items-center">
          <div className="ticker-anim text-[12.5px] font-semibold">{text}   •   </div>
        </div>
        <Link href="/kampanye" className="shrink-0 text-[10px] font-extrabold uppercase tracking-widest underline underline-offset-2">Lihat semua</Link>
      </div>
      <style>{`@keyframes tickerMove { from { transform: translateX(0); } to { transform: translateX(-50%); } } .ticker-anim { display: inline-block; padding-left: 100%; animation: tickerMove 40s linear infinite; }`}</style>
    </div>
  );
}
