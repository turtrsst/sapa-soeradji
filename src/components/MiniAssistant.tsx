'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import Markdown from '@/components/Markdown';
import { bp } from '@/lib/basePath';

interface MiniMsg {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  mode?: string;
}

const STORAGE_KEY = 'soera-mini-convo';
const GREETING =
  'Halo, **Bapak/Ibu** — saya **SOERA AI**, asisten digital RSUP Dr. Soeradji Tirtonegoro. Senang bisa membantu. Ada yang bisa saya bantu hari ini?';
const CHIPS = ['Jadwal dokter', 'Tarif Home Care', 'Cara daftar online', 'Sampaikan keluhan'];

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function Avatar({ size, className = '' }: { size: number; className?: string }) {
  const reduced = useReducedMotion();
  const style = { width: size, height: size };
  return reduced ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={bp('/images/soera-ai-avatar-poster.png')} alt="SOERA AI" style={style} className={`object-contain ${className}`} draggable={false} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={bp('/images/soera-ai-avatar.webp')} alt="SOERA AI — avatar asisten" style={style} className={`object-contain ${className}`} draggable={false} />
  );
}

export default function MiniAssistant() {
  const pathname = usePathname() || '/';
  // usePathname() mengembalikan path TANPA basePath (mis. '/chat', bukan '/soera-ai/chat').
  // Bikin tahan keduanya: strip awalan basePath bila ada, baru bandingkan.
  const prefix = bp('/') === '/' ? '' : bp('/');
  const rel = (prefix && pathname.startsWith(prefix)) ? (pathname.slice(prefix.length) || '/') : pathname;
  // Sembunyikan di admin & halaman chat penuh (sudah ada chatbot; tidak menimpa tombol kirim)
  const hidden = rel.startsWith('/admin') || rel.startsWith('/chat');

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MiniMsg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<{ used: number; max: number; remaining: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // Muat percakapan terakhir (sinkron dengan /chat — owner cookie yang sama)
  useEffect(() => {
    let cancelled = false;
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!saved) return;
      fetch(bp(`/api/conversations/${saved}`))
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          if (cancelled) return;
          const msgs: MiniMsg[] = (d?.messages || [])
            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
            .slice(-30)
            .map((m: any) => {
              const meta = (() => { try { return JSON.parse(m.meta || '{}'); } catch { return {}; } })();
              return { id: m.id, role: m.role, content: m.content, mode: meta?.mode };
            });
          setConversationId(saved);
          setMessages(msgs);
        })
        .catch(() => { try { window.localStorage.removeItem(STORAGE_KEY); } catch {} });
    } catch {}
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, open, scrollToBottom]);

  // Escape menutup panel + fokus ke input saat dibuka
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open]);

  const newConversation = useCallback(() => {
    if (busy) return;
    setConversationId(null);
    setMessages([]);
    setInput('');
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    inputRef.current?.focus();
  }, [busy]);

  const sendMessage = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '', streaming: true }]);
    scrollToBottom();

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(bp('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6).trim());
            if (evt.type === 'meta') {
              setConversationId(evt.conversationId);
              try { window.localStorage.setItem(STORAGE_KEY, String(evt.conversationId)); } catch {}
            } else if (evt.type === 'token') {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') last.content += evt.text;
                return copy;
              });
              scrollToBottom();
            } else if (evt.type === 'done') {
              if (evt.aiQuota) setQuota(evt.aiQuota);
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') { last.streaming = false; last.mode = evt.mode; last.id = evt.messageId; }
                return copy;
              });
            }
          } catch { /* frame tidak valid */ }
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          last.content = err?.name === 'AbortError' ? (last.content || '*Dihentikan.*') : `Mohon maaf, terjadi gangguan: ${err?.message || 'tidak dikenal'}. Silakan coba lagi atau hubungi (0272) 321020.`;
          last.streaming = false;
        }
        return copy;
      });
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }, [busy, conversationId, scrollToBottom]);

  if (hidden) return null;

  return (
    <>
      {/* Floating button — pojok kanan bawah */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka SOERA AI"
          aria-expanded={open}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[60] group flex items-end gap-2 focus:outline-none"
        >
          <span className="mb-2 mr-0.5 hidden sm:block max-w-[180px] rounded-2xl rounded-br-md border border-rst-100 bg-white/95 backdrop-blur px-3 py-1.5 text-[10.5px] leading-snug text-rst-800 shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none">
            Tanya <strong>jadwal, tarif, Home Care</strong>… Saya bantu!
          </span>
          <span className="relative mini-avatar-float">
            <span className="mini-avatar-ring absolute inset-0 rounded-full" aria-hidden="true" />
            <Avatar size={84} className="relative drop-shadow-[0_10px_18px_rgba(10,37,35,0.45)]" />
            <span className="absolute bottom-1 right-1 h-4.5 w-4.5 sm:h-5 sm:w-5 h-[18px] w-[18px] rounded-full bg-emerald-500 border-2 border-white shadow" aria-hidden="true" />
          </span>
        </button>
      )}

      {/* Mini chat panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="SOERA AI — mini chat"
          className="fixed z-[61] bottom-4 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[392px] h-[min(72vh,580px)] min-h-[380px] flex flex-col overflow-hidden rounded-2xl border border-rst-100 bg-white shadow-[0_24px_60px_-12px_rgba(10,37,35,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-rst-100 bg-[#0a2523] px-3.5 py-2.5 text-white">
            <Avatar size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold leading-tight tracking-tight">SOERA AI — Asisten RST</p>
              <p className="text-[9.5px] text-emerald-300/90 font-semibold leading-tight">Asisten digital resmi RSUP Dr. Soeradji Tirtonegoro</p>
            </div>
            <a href="tel:0272321020" title="Contact Center (0272) 321020" aria-label="Telepon Contact Center" className="p-2 rounded-lg text-emerald-200 hover:bg-white/10 transition">
              <Icon name="phone" size={17} />
            </a>
            <a href={bp('/chat')} title="Buka chat penuh" aria-label="Buka chat penuh" className="p-2 rounded-lg text-emerald-200 hover:bg-white/10 transition">
              <Icon name="external" size={16} />
            </a>
            <button type="button" onClick={newConversation} title="Percakapan baru" aria-label="Percakapan baru" className="p-2 rounded-lg text-emerald-200 hover:bg-white/10 transition">
              <Icon name="plus" size={17} />
            </button>
            <button type="button" onClick={() => setOpen(false)} title="Tutup (Esc)" aria-label="Tutup" className="p-2 rounded-lg text-white/80 hover:bg-white/10 transition">
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-rst-50/60 px-3.5 py-3 space-y-2.5 chat-scroll">
            {messages.length === 0 && (
              <>
                <div className="flex items-end gap-2">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-rst-100 bg-white px-3 py-2 text-[12.5px] leading-snug text-rst-900 shadow-sm">
                    <Markdown text={GREETING} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CHIPS.map((c) => (
                    <button key={c} type="button" onClick={() => sendMessage(c === 'Jadwal dokter' ? 'Jadwal dokter hari ini' : c)} className="rounded-full border border-rst-200 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-rst-700 hover:border-rst-500 hover:text-rst-900 transition">
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'items-end gap-2'}`}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[80%] rounded-2xl rounded-br-md bg-rst-700 px-3 py-2 text-[12.5px] leading-snug text-white whitespace-pre-wrap'
                      : 'max-w-[92%] rounded-2xl rounded-bl-md border border-rst-100 bg-white px-3 py-2 text-[12.5px] leading-snug text-rst-900 shadow-sm'
                  }
                >
                  {m.streaming && !m.content.trim() ? (
                    <span className="dot-typing text-rst-400 leading-none"><span>●</span> <span>●</span> <span>●</span></span>
                  ) : (
                    m.role === 'assistant' ? <Markdown text={m.content} /> : m.content
                  )}
                  {m.role === 'assistant' && !m.streaming && m.mode && (
                    <span className="mt-1.5 inline-block text-[8.5px] uppercase tracking-wide text-rst-400">{m.mode === 'llm' ? 'AI Lokal/Online' : 'Offline KB'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Kuota habis */}
          {quota && quota.remaining <= 0 && (
            <div className="border-t border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] leading-snug text-amber-900">
              ⏳ Kuota AI bebas hari ini habis (reset <strong>00.00 WIB</strong>). Pertanyaan layanan tetap bisa dijawab. <a href="tel:0272321020" className="underline font-bold">(0272) 321020</a>
            </div>
          )}

          {/* Composer */}
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="border-t border-rst-100 bg-white p-2.5">
            <div className="flex items-end gap-1.5 rounded-xl border border-rst-200 bg-rst-50/50 focus-within:border-rst-500 focus-within:bg-white transition p-1.5">
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Tanya seputar RST…"
                aria-label="Tulis pertanyaan"
                className="max-h-28 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[13px] text-rst-900 placeholder-rst-400 outline-none"
                disabled={busy}
              />
              {busy ? (
                <button type="button" onClick={() => abortRef.current?.abort()} className="h-9 shrink-0 rounded-lg bg-rst-200 px-3 text-[11px] font-bold text-rst-800 hover:bg-rst-300 transition">Stop</button>
              ) : (
                <button type="submit" disabled={!input.trim()} aria-label="Kirim" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rst-600 text-white transition hover:bg-rst-700 disabled:opacity-35">
                  <Icon name="send" size={16} />
                </button>
              )}
            </div>
            <p className="mt-1 px-0.5 text-center text-[8.5px] leading-tight text-rst-400">SOERA AI dapat keliru — periksa info penting ke <a href="tel:0272321020" className="underline">(0272) 321020</a>.</p>
          </form>
        </div>
      )}
    </>
  );
}
