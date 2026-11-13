'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import Markdown from '@/components/Markdown';

interface ChatMsg {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  meta?: { intent?: string; mode?: string; sources?: { title: string; source: string }[]; latencyMs?: number };
  streaming?: boolean;
}
interface Conv { id: string; title: string; pinned: number; updated_at: number; message_count: number; last_message?: string | null }

const SUGGESTIONS = [
  { icon: 'calendar' as const, text: 'Jadwal dokter poli jantung Senin–Jumat' },
  { icon: 'clipboard' as const, text: 'Cara pendaftaran online RST lewat WhatsApp' },
  { icon: 'home' as const, text: 'Tarif visite dokter spesialis Home Care' },
  { icon: 'alert' as const, text: 'Nomor IGD & keadaan darurat' },
  { icon: 'megaphone' as const, text: 'Kampanye kesehatan terbaru dari RST' },
  { icon: 'inbox' as const, text: 'Saya ingin menyampaikan keluhan pelayanan' },
];

function ChatPageInner() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<string>('');
  const [llmEnabled, setLlmEnabled] = useState<boolean | null>(null);
  const [aiQuota, setAiQuota] = useState<{ used: number; max: number; remaining: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Record<number, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialQuerySent = useRef(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const r = await fetch('/api/conversations');
      const d = await r.json();
      setConversations(d.conversations || []);
    } catch {}
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    try {
      const r = await fetch(`/api/conversations/${id}`);
      const d = await r.json();
      setMessages((d.messages || []).filter((m: any) => m.role !== 'system').map((m: any) => ({
        id: m.id, role: m.role, content: m.content,
        meta: m.meta ? safeParse(m.meta) : undefined,
      })));
      setMode('');
      scrollToBottom();
    } catch {}
  }, [scrollToBottom]);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);
  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);

  const newChat = useCallback(() => {
    if (busy) return;
    setActiveId(null); setMessages([]); setMode(''); setSidebarOpen(false);
  }, [busy]);

  const sendMessage = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    const userMsg: ChatMsg = { role: 'user', content: text };
    const assistantPlaceholder: ChatMsg = { role: 'assistant', content: '', streaming: true, meta: { sources: [] } };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    scrollToBottom();

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, message: text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalMode = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          const line = frame.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.type === 'meta') {
              setActiveId(evt.conversationId);
              setLlmEnabled(Boolean(evt.llmEnabled));
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') last.meta = { ...(last.meta || {}), intent: evt.intent, sources: evt.sources || [] };
                return copy;
              });
            } else if (evt.type === 'token') {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') last.content += evt.text;
                return copy;
              });
              scrollToBottom();
            } else if (evt.type === 'done') {
              finalMode = evt.mode;
              setMode(evt.mode);
              if (evt.aiQuota) setAiQuota(evt.aiQuota);
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') { last.streaming = false; last.id = evt.messageId; last.meta = { ...(last.meta || {}), mode: evt.mode, latencyMs: evt.latencyMs }; }
                return copy;
              });
            }
          } catch { /* frame tidak valid */ }
        }
      }
      if (finalMode === 'offline') setMode('offline');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') { last.content = `Mohon maaf, terjadi gangguan: ${err?.message || 'tidak dikenal'}. Silakan coba lagi atau hubungi (0272) 321020.`; last.streaming = false; }
          return copy;
        });
      } else {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') last.streaming = false;
          return copy;
        });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
      refreshConversations();
      scrollToBottom();
    }
  }, [activeId, busy, refreshConversations, scrollToBottom]);

  // Kirim pertanyaan dari URL (?q=...) sekali saja
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !initialQuerySent.current) {
      initialQuerySent.current = true;
      sendMessage(q);
    }
  }, [searchParams, sendMessage]);

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus percakapan ini?')) return;
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    if (activeId === id) newChat();
    refreshConversations();
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  const sendFeedback = async (idx: number, messageId: number | undefined, rating: number) => {
    setFeedbackSent((f) => ({ ...f, [idx]: rating }));
    fetch('/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeId, messageId, rating }),
    }).catch(() => {});
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-0 sm:px-4 lg:px-6 py-0 sm:py-4">
      <div className="flex h-[calc(100vh-64px-36px)] sm:h-[calc(100vh-64px-36px-2rem)] overflow-hidden sm:rounded-2xl border-0 sm:border border-rst-100 shadow-none sm:shadow-soft bg-white">

        {/* ===== SIDEBAR ===== */}
        <aside className={`${sidebarOpen ? 'absolute z-30 inset-y-0 left-0 w-[85%] max-w-xs' : 'hidden'} md:static md:block md:w-80 shrink-0 bg-rst-950 text-rst-100 flex flex-col h-full`}>
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <button onClick={newChat} className="flex-1 btn btn-gold !py-2.5 text-sm justify-center"><Icon name="plus" size={16} /> Percakapan Baru</button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 rounded-lg hover:bg-white/10" aria-label="Tutup"><Icon name="close" size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto chat-scroll p-2 space-y-1">
            {conversations.length === 0 && <p className="text-xs text-rst-300/70 px-3 py-6 text-center">Belum ada percakapan.<br />Mulai dengan mengetik pertanyaan.</p>}
            {conversations.map((c) => (
              <div key={c.id} onClick={() => loadConversation(c.id)}
                className={`group w-full text-left rounded-xl px-3 py-2.5 cursor-pointer transition flex items-start gap-2 ${activeId === c.id ? 'bg-white/15' : 'hover:bg-white/5'}`}>
                <Icon name="chat" size={15} className="mt-0.5 shrink-0 text-rst-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-rst-50 truncate">{c.title}</span>
                  <span className="block text-[10px] text-rst-300/80 truncate">{new Date(c.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {c.message_count} pesan</span>
                </span>
                <button onClick={(e) => deleteConversation(c.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-rst-300 hover:text-red-300 transition" aria-label="Hapus">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/10 text-[10.5px] text-rst-300/80 leading-relaxed">
            <p className="flex items-center gap-1.5 font-bold text-rst-100"><Icon name="shield" size={12} className="text-gold-400" /> SOERA AI aman &amp; tercatat</p>
            <p className="mt-1">Jawaban disusun dari basis pengetahuan resmi RST + AI. Untuk kondisi darurat tetap ke IGD (0272) 321020 ext 200.</p>
          </div>
        </aside>
        {sidebarOpen && <div className="absolute inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ===== AREA CHAT ===== */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#f7faf9] relative">
          {/* top bar */}
          <div className="flex items-center gap-2 px-3 sm:px-5 h-14 border-b border-rst-100 bg-white/70 backdrop-blur">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-rst-50 text-rst-700" aria-label="Riwayat"><Icon name="menu" size={20} /></button>
            <Image src="/images/soera-ai-logo.png" alt="SOERA AI" width={30} height={30} className="h-7 w-7 object-contain" />
            <div className="leading-tight min-w-0">
              <p className="text-[13px] font-extrabold text-rst-900 truncate">SOERA AI — Asisten RST</p>
              <p className="text-[10px] font-semibold text-rst-500 flex items-center gap-1">
                {mode === 'llm' ? (<><Icon name="wifi" size={10} className="text-emerald-600" /> AI aktif ({llmEnabled ? 'model terhubung' : 'endpoint aktif'})</>)
                  : mode === 'offline' ? (<><Icon name="wifiOff" size={10} className="text-amber-600" /> Mode offline — basis pengetahuan lokal</>)
                  : (<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> Siap membantu</span>)}
              </p>
            </div>
            <a href="tel:0272321020" className="ml-auto btn !px-3 !py-2 text-[11px] bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold whitespace-nowrap"><Icon name="phone" size={13} /> IGD 24 Jam</a>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-3 sm:px-6 py-5">
            {isEmpty ? (
              <div className="max-w-2xl mx-auto text-center pt-6 sm:pt-12">
                <Image src="/images/soera-ai-logo.png" alt="SOERA AI" width={92} height={92} className="mx-auto h-20 w-20 object-contain" />
                <h2 className="mt-4 text-2xl sm:text-3xl font-black text-rst-900 tracking-tight">Halo! Ada yang bisa <span className="text-rst-600">SOERA AI</span> bantu?</h2>
                <p className="mt-2 text-sm text-rst-600">Asisten resmi RSUP Dr. Soeradji Tirtonegoro Klaten — keluhan Anda, jadwal dokter, pendaftaran, tarif layanan, hingga kampanye kesehatan.</p>
                <div className="mt-6 grid sm:grid-cols-2 gap-2 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button key={s.text} onClick={() => sendMessage(s.text)} className="flex items-start gap-2.5 rounded-2xl border border-rst-100 bg-white p-3.5 text-[13px] font-medium text-rst-800 hover:border-rst-400 hover:shadow-soft transition text-left">
                      <Icon name={s.icon} size={17} className="text-rst-500 mt-0.5 shrink-0" />{s.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {m.role === 'assistant'
                      ? <Image src="/images/soera-ai-logo.png" alt="SOERA AI" width={34} height={34} className="h-8 w-8 mt-1 rounded-full object-contain bg-white border border-rst-100 p-0.5 shrink-0" />
                      : <span className="h-8 w-8 mt-1 rounded-full bg-rst-700 text-white text-[11px] font-black flex items-center justify-center shrink-0">ANDA</span>}
                    <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-rst-700 text-white rounded-tr-md' : 'bg-white border border-rst-100 text-rst-900 rounded-tl-md'}`}>
                      {m.role === 'assistant' && !m.content && m.streaming ? (
                        <span className="dot-typing text-rst-400 text-lg leading-none"><span>●</span> <span>●</span> <span>●</span></span>
                      ) : (
                        <Markdown text={m.content} />
                      )}
                      {m.role === 'assistant' && !m.streaming && (
                        <div className="mt-2 pt-2 border-t border-rst-50 flex flex-wrap items-center gap-1">
                          <button onClick={() => copyMessage(m.content, i)} className="p-1.5 rounded-lg text-rst-400 hover:text-rst-800 hover:bg-rst-50 transition" title="Salin"><Icon name={copied === i ? 'check' : 'copy'} size={14} /></button>
                          <button onClick={() => sendFeedback(i, m.id, 1)} className={`p-1.5 rounded-lg transition ${feedbackSent[i] === 1 ? 'text-emerald-600 bg-emerald-50' : 'text-rst-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title="Membantu"><Icon name="thumbUp" size={14} /></button>
                          <button onClick={() => sendFeedback(i, m.id, -1)} className={`p-1.5 rounded-lg transition ${feedbackSent[i] === -1 ? 'text-red-500 bg-red-50' : 'text-rst-400 hover:text-red-500 hover:bg-red-50'}`} title="Kurang membantu"><Icon name="thumbDown" size={14} /></button>
                          {m.meta?.mode && (
                            <span className="chip ml-1 bg-rst-50 text-rst-600">{m.meta.mode === 'llm' ? 'AI Lokal/Online' : 'Offline KB'}{typeof m.meta.latencyMs === 'number' ? ` · ${(m.meta.latencyMs / 1000).toFixed(1)} dtk` : ''}</span>
                          )}
                          {!!m.meta?.sources?.length && (
                            <span className="w-full text-[10.5px] text-rst-500 mt-1 leading-snug">
                              <span className="font-bold uppercase tracking-wide">Sumber: </span>
                              {m.meta.sources.slice(0, 3).map((s) => s.title).join(' · ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* composer */}
          <div className="border-t border-rst-100 bg-white px-3 sm:px-6 py-3">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 rounded-2xl border border-rst-200 bg-rst-50/40 focus-within:border-rst-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-rst-100 transition p-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  rows={1}
                  placeholder="Tulis pertanyaan Anda… (Enter untuk kirim, Shift+Enter baris baru)"
                  className="flex-1 resize-none bg-transparent outline-none text-[15px] px-2 py-2 max-h-40 placeholder-rst-300 text-rst-900"
                  disabled={busy}
                />
                {busy ? (
                  <button type="button" onClick={() => abortRef.current?.abort()} className="shrink-0 h-11 px-4 rounded-xl bg-rst-200 text-rst-800 text-xs font-bold hover:bg-rst-300 transition">Stop</button>
                ) : (
                  <button type="submit" disabled={!input.trim()} className="shrink-0 h-11 w-11 rounded-xl bg-rst-600 text-white flex items-center justify-center hover:bg-rst-700 disabled:opacity-35 disabled:cursor-not-allowed transition" aria-label="Kirim">
                    <Icon name="send" size={18} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-center text-[10px] text-rst-400">SOERA AI dapat keliru — periksa kembali info penting ke <a href="tel:0272321020" className="underline">(0272) 321020</a>. Bukan diagnosis medis.
                {aiQuota && <span className="block mt-0.5 text-rst-500">Kuota AI bebas hari ini: <strong>sisa {aiQuota.remaining}/{aiQuota.max}</strong> · reset 00.00 WIB · pertanyaan layanan (jadwal/tarif/dll.) tetap tersedia</span>}
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return undefined; } }

export default ChatPageInner;
