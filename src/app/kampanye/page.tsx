'use client';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

interface Campaign { id: number; title: string; summary: string; body: string; tag: string; location: string | null; start_date: string | null; end_date: string | null }

const TAG_COLOR: Record<string, string> = {
  'SPELING': 'bg-purple-100 text-purple-800',
  'Bakti Sosial': 'bg-rose-100 text-rose-800',
  'Promosi Kesehatan': 'bg-emerald-100 text-emerald-800',
  'Integritas': 'bg-sky-100 text-sky-800',
};

export default function KampanyePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kampanye').then((r) => r.json()).then((d) => setCampaigns(d.campaigns || [])).finally(() => setLoading(false));
  }, []);

  const shareText = (c: Campaign) => encodeURIComponent(`${c.title} — ${c.summary} Info: RSUP Dr. Soeradji Tirtonegoro Klaten, (0272) 321020 / rsupsoeradji.id`);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <p className="chip bg-rst-100 text-rst-700 mb-2"><Icon name="megaphone" size={12} /> Promosi &amp; Kampanye Kesehatan Daring</p>
      <h1 className="text-3xl font-black text-rst-900 tracking-tight">Kampanye Kesehatan RST</h1>
      <p className="mt-1 text-sm text-rst-600 max-w-3xl">Program promotif-preventif RSUP Dr. Soeradji Tirtonegoro &amp; Kementerian Kesehatan RI. Bagikan ke keluarga — deteksi dini menyelamatkan nyawa.</p>

      {loading && <div className="mt-8 text-center text-rst-400 text-sm">Memuat kampanye…</div>}

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {campaigns.map((c) => (
          <article key={c.id} className="card p-5 flex flex-col hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`chip ${TAG_COLOR[c.tag] ?? 'bg-rst-100 text-rst-700'}`}>{c.tag}</span>
              {c.start_date && <span className="text-[10px] font-bold uppercase tracking-wide text-rst-400">{new Date(c.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-rst-900 leading-snug">{c.title}</h2>
            <p className="mt-1.5 text-sm text-rst-700 leading-relaxed">{c.summary}</p>
            {expanded === c.id && <p className="mt-2 text-[13px] text-rst-600 leading-relaxed border-l-2 border-gold-400 pl-3">{c.body}</p>}
            <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="btn btn-outline !py-2 !px-3 text-xs">{expanded === c.id ? 'Tutup detail' : 'Baca detail'} <Icon name="chevronDown" size={13} className={expanded === c.id ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
              <a href={`https://wa.me/?text=${shareText(c)}`} target="_blank" rel="noreferrer" className="btn !py-2 !px-3 text-xs bg-[#25D366] text-[#064e2b] hover:brightness-105">Bagikan WA</a>
              {c.location && <span className="text-[10px] text-rst-500 font-semibold ml-auto max-w-[45%] text-right leading-tight">{c.location}</span>}
            </div>
          </article>
        ))}
      </div>

      {!loading && campaigns.length === 0 && <div className="card p-10 text-center text-rst-500 text-sm">Belum ada kampanye aktif. Pantau rutin akun Instagram <a className="underline font-bold" href="https://www.instagram.com/rssoeradjitirtonegoro">@rssoeradjitirtonegoro</a>.</div>}

      {/* Ikuti kami */}
      <div className="mt-8 rounded-2xl bg-rst-950 text-white p-6 grid sm:grid-cols-3 gap-5 text-center sm:text-left items-center">
        <div className="sm:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400 font-bold">Ikuti Kanal Resmi RST</p>
          <p className="mt-1 text-lg font-extrabold">Jangan lewatkan jadwal skrining gratis &amp; edukasi kesehatan</p>
          <p className="mt-1 text-xs text-rst-200">Instagram @rssoeradjitirtonegoro · rsupsoeradji.id · Aplikasi E-Yang Soeradji · WhatsApp 0816-9170-00</p>
        </div>
        <a href="https://www.instagram.com/rssoeradjitirtonegoro" target="_blank" rel="noreferrer" className="btn btn-gold justify-center sm:justify-self-end"><Icon name="external" size={17} /> Ke Instagram RST</a>
      </div>
    </div>
  );
}
