// Renderer markdown-lite yang aman (tanpa dangerouslySetInnerHTML).
// Mendukung: heading ###, bold **teks**, italic _teks_, bullet "- ", baris kosong sebagai paragraf,
// dan LINK markdown [label](href):
//   • /path internal  → tombol pill oranye/hijau (navigasi aplikasi, SPA)
//   • https?://…      → link eksternal (tab baru, noopener)
//   • tel: / mailto:  → link biasa
//   • skema lain (mis. javascript:) → TIDAK dirender sebagai link (anti-XSS)
import React from 'react';
import Link from 'next/link';
import Icon from './Icon';

const INLINE_RE = /(\[[^\]]+\]\((?:\/|https?:\/\/|tel:|mailto:)[^)\s]+\)|\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;

function renderLink(label: string, hrefRaw: string, key: string): React.ReactNode {
  const href = hrefRaw.trim();
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link key={key} href={href} className="mx-0.5 inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border border-rst-300/70 bg-rst-50 py-0.5 pl-2.5 pr-1.5 align-baseline text-[11px] font-extrabold text-rst-800 transition hover:border-gold-500 hover:bg-gold-400/25 hover:text-rst-950">
        {label}<Icon name="chevronRight" size={12} className="shrink-0" />
      </Link>
    );
  }
  if (/^https?:\/\//i.test(href)) {
    return (
      <a key={key} href={href} target="_blank" rel="noreferrer noopener" className="inline-flex items-baseline gap-0.5 font-bold text-rst-900 underline decoration-gold-400 decoration-2 underline-offset-2 hover:text-rst-700">
        {label}<Icon name="external" size={10} className="shrink-0" />
      </a>
    );
  }
  return <a key={key} href={href} className="font-bold text-rst-900 underline decoration-gold-400 decoration-2 underline-offset-2">{label}</a>;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(INLINE_RE).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return renderLink(link[1], link[2], key);
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('_') && part.endsWith('_')) return <em key={key}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export default function Markdown({ text }: { text: string }) {
  const lines = (text || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    const items = listBuffer;
    listBuffer = [];
    blocks.push(
      <ul key={`ul-${key++}`}>
        {items.map((item, i) => <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>)}
      </ul>
    );
  };
  const flushPara = () => {
    if (!paraBuffer.length) return;
    const content = paraBuffer.join(' ');
    paraBuffer = [];
    blocks.push(<p key={`p-${key++}`}>{renderInline(content, `p-${key}`)}</p>);
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) { flushList(); flushPara(); continue; }
    const bullet = /^[-•]\s+(.*)/.exec(trimmed);
    if (bullet) { flushPara(); listBuffer.push(bullet[1]); continue; }
    const heading = /^#{1,4}\s+(.*)/.exec(trimmed);
    if (heading) { flushList(); flushPara(); blocks.push(<h4 key={`h-${key++}`}>{renderInline(heading[1], `h-${key}`)}</h4>); continue; }
    flushList();
    paraBuffer.push(trimmed);
  }
  flushList(); flushPara();
  return <div className="msg-md">{blocks}</div>;
}
