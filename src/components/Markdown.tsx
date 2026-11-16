// Renderer markdown aman berbasis react-markdown (github.com/remarkjs/react-markdown)
// + remark-gfm (github.com/remarkjs/remark-gfm) — tanpa HTML mentah (tidak ada rehype-raw),
// sehingga jawaban AI tidak bisa menyuntikkan markup/script.
// Tautan:
//   • path internal /…  → tombol pill (navigasi aplikasi, SPA via next/link)
//   • https?://…        → link eksternal (tab baru, noopener)
//   • tel: / mailto:    → link biasa
//   • skema lain (mis. javascript:) → DIRENDER SEBAGAI TEKS (anti-XSS)
import React from 'react';
import Link from 'next/link';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from './Icon';

function SafeLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  const url = (href ?? '').trim();
  if (url.startsWith('/') && !url.startsWith('//')) {
    return (
      <Link href={url} className="mx-0.5 inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border border-rst-300/70 bg-rst-50 py-0.5 pl-2.5 pr-1.5 align-baseline text-[11px] font-extrabold text-rst-800 transition hover:border-gold-500 hover:bg-gold-400/25 hover:text-rst-950">
        {children}<Icon name="chevronRight" size={12} className="shrink-0" />
      </Link>
    );
  }
  if (/^https?:\/\//i.test(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex items-baseline gap-0.5 font-bold text-rst-900 underline decoration-gold-400 decoration-2 underline-offset-2 hover:text-rst-700">
        {children}<Icon name="external" size={10} className="shrink-0" />
      </a>
    );
  }
  if (/^(tel:|mailto:)/i.test(url)) {
    return <a href={url} className="font-bold text-rst-900 underline decoration-gold-400 decoration-2 underline-offset-2">{children}</a>;
  }
  // Skema berbahaya/tidak dikenal → tampilkan sebagai teks biasa
  return <span className="font-semibold">{children}</span>;
}

const components: Components = {
  a: SafeLink as Components['a'],
};

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="msg-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text || ''}
      </ReactMarkdown>
    </div>
  );
}
