// Renderer markdown-lite yang aman (tanpa dangerouslySetInnerHTML).
// Mendukung: heading ###, bold **teks**, italic _teks_, bullet "- ", baris kosong sebagai paragraf.
import React from 'react';

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
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
