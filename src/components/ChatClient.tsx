'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import Markdown from '@/components/Markdown';
import ChatCard from '@/components/ChatCard';
import { bp } from '@/lib/basePath';
import type { CardPayload } from '@/lib/genui';

interface ToolStep { tool: string; state: 'run' | 'done' }
interface ChatMsg {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  meta?: { intent?: string; mode?: string; sources?: { title: string; source: string }[]; latencyMs?: number; cards?: CardPayload[] };
  streaming?: boolean;
  reasoning?: string;
  cards?: CardPayload[];
  toolSteps?: ToolStep[];
}
interface Conv { id: string; title: string; pinned: number; updated_at: number; message_count: number; last_message?: string | null }

const SUGGESTIONS = [
  { icon: 'calendar', title: 'Jadwal Dokter', text: 'Jadwal dokter poli jantung Senin–Jumat' },
  { icon: 'clipboard', title: 'Cara Daftar Online', text: 'Cara pendaftaran online RS Soeradji lewat WhatsApp' },
  { icon: 'home', title: 'Tarif Home Care', text: 'Tarif visite dokter spesialis Home Care' },
  { icon: 'alert', title: 'Darurat / IGD', text: 'Nomor IGD & keadaan darurat' },
  { icon: 'megaphone', title: 'Kampanye RS Soeradji', text: 'Kampanye kesehatan terbaru dari RS Soeradji' },
  { icon: 'inbox', title: 'Keluhan Pelayanan', text: 'Saya ingin menyampaikan keluhan pelayanan' },
] as const;
const QUICK_CHIPS = ['Jadwal jantung Senin', 'Cara daftar online', 'Tarif Home Care', 'Kampanye RS Soeradji'];

const TOOL_META: Record<string, { run: string; done: string }> = {
  cari_jadwal_dokter: { run: 'Mencari jadwal dokter…', done: 'Data jadwal ditemukan' },
  cari_tarif_layanan: { run: 'Mencari tarif layanan…', done: 'Data tarif ditemukan' },
  cari_info_rst: { run: 'Membuka basis pengetahuan…', done: 'Dokumen RS Soeradji ditemukan' },
  daftar_kampanye_aktif: { run: 'Memuat kampanye RS Soeradji…', done: 'Kampanye dimuat' },
};

function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 3 && h < 11) return 'Selamat pagi';
  if (h >= 11 && h < 15) return 'Selamat siang';
  if (h >= 15 && h < 18.5) return 'Selamat sore';
  return 'Selamat malam';
}
const MUSE = bp('/images/soera-ai-avatar.webp');

function ChatPageInner() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [convoQuery, setConvoQuery] = useState('');
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
      const r = await fetch(bp('/api/conversations'));
      const d = await r.json();
      setConversations(d.conversations || []);
    } catch {}
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    try {
      const r = await fetch(bp(`/api/conversations/${id}`));
      const d = await r.json();
      setMessages((d.messages || []).filter((m: any) => m.role !== 'system').map((m: any) => ({
        id: m.id, role: m.role, content: m.content,
        meta: m.meta ? safeParse(m.meta) : undefined,
        cards: m.meta ? (safeParse(m.meta)?.cards as CardPayload[] | undefined) : undefined,
      })));
      setMode('');
      scrollToBottom();
    } catch {}
  }, [scrollToBottom]);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);
  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);

  const filteredConvos = useMemo(() => {
    const q = convoQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, convoQuery]);

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
    const assistantPlaceholder: ChatMsg = { role: 'assistant', content: '', streaming: true, meta: { sources: [] }, toolSteps: [] };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    scrollToBottom();

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(bp('/api/chat'), {
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
            } else if (evt.type === 'reasoning') {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') last.reasoning = ((last.reasoning || '') + evt.text).slice(-6000);
                return copy;
              });
            } else if (evt.type === 'tool' && evt.tool) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role !== 'assistant') return copy;
                const steps = [...(last.toolSteps || [])];
                if (evt.phase === 'start') {
                  if (!steps.some((s) => s.tool === evt.tool && s.state === 'run')) steps.push({ tool: evt.tool, state: 'run' });
                } else {
                  let i = -1;
                  for (let j = steps.length - 1; j >= 0; j--) { if (steps[j].tool === evt.tool && steps[j].state === 'run') { i = j; break; } }
                  if (i >= 0) steps[i] = { tool: evt.tool, state: 'done' }; else steps.push({ tool: evt.tool, state: 'done' });
                }
                last.toolSteps = steps.slice(-8);
                return copy;
              });
              scrollToBottom();
            } else if (evt.type === 'card' && evt.card) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') last.cards = [...(last.cards || []), evt.card as CardPayload];
                return copy;
              });
              scrollToBottom();
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
                if (last?.role === 'assistant') { last.streaming = false; last.id = evt.messageId; last.meta = { ...(last.meta || {}), mode: evt.mode, latencyMs: evt.latencyMs }; last.toolSteps = last.toolSteps?.map((s) => ({ ...s, state: 'done' as const })); }
                return copy;
              });
            }
          } catch { /* frame tidak valid */ }
        }
      }
      if (finalMode === 'offline') setMode('offline');
    } catch (err: any) {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role !== 'assistant') return copy;
        if (err?.name !== 'AbortError') {
          last.content = `Mohon maaf, terjadi gangguan: ${err?.message || 'tidak dikenal'}. Silakan coba lagi atau hubungi (0272) 321020.`;
        }
        last.streaming = false;
        return copy;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
      refreshConversations();
      scrollToBottom();
    }
  }, [activeId, busy, refreshConversations, scrollToBottom]);

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
    await fetch(bp(`/api/conversations/${id}`), { method: 'DELETE' });
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
    fetch(bp('/api/feedback'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeId, messageId, rating }),
    }).catch(() => {});
  };

  const isEmpty = messages.length === 0;
  const greeting = timeGreeting();

  return (
    <div className="chat-full w-full overflow-hidden bg-[#04100f] text-rst-100">
      <div className="flex h-full w-full overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <aside className={`${sidebarOpen ? 'absolute z-30 inset-y-0 left-0 w-[85%] max-w-xs' : 'hidden'} md:static md:block md:w-80 shrink-0 bg-gradient-to-b from-[#08211f] via-rst-950 to-[#04100f] text-rst-100 flex flex-col h-full`}>
          {/* brand */}
          <div className="px-5 pt-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rst-900 ring-1 ring-gold-400/50 overflow-hidden">
                <Image src={MUSE} alt="SOERA AI" width={48} height={48} className="h-12 w-12 object-cover object-top" priority />
              </span>
              <span className="leading-tight">
                <span className="block text-[15px] font-black tracking-tight text-rst-50">SOERA AI</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gold-400/90">Asisten Resmi RS Soeradji Klaten</span>
              </span>
            </div>
            <button onClick={newChat} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-400 py-2.5 text-[13px] font-extrabold text-rst-950 shadow-[0_6px_24px_-8px_rgba(242,193,78,0.6)] transition hover:bg-gold-300 active:scale-[0.98]"><Icon name="plus" size={16} /> Percakapan Baru</button>
            {/* cari riwayat */}
            <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-gold-400/50">
              <Icon name="search" size={14} className="shrink-0 text-rst-300" />
              <input value={convoQuery} onChange={(e) => setConvoQuery(e.target.value)} placeholder="Cari percakapan…" className="w-full bg-transparent text-[12px] text-rst-50 placeholder-rst-400 outline-none" aria-label="Cari percakapan" />
            </label>
          </div>
          {/* daftar percakapan */}
          <p className="px-5 pt-3 text-[9px] font-extrabold uppercase tracking-[0.22em] text-rst-400">Riwayat · {conversations.length}</p>
          <div className="flex-1 overflow-y-auto chat-scroll px-3 pb-2 pt-1 space-y-1">
            {filteredConvos.length === 0 && <p className="text-xs text-rst-300/70 px-3 py-6 text-center">{convoQuery.trim() ? 'Tidak ada percakapan yang cocok.' : <>Belum ada percakapan.<br />Mulai dengan mengetik pertanyaan.</>}</p>}
            {filteredConvos.map((c) => (
              <div key={c.id} onClick={() => loadConversation(c.id)}
                className={`group relative w-full text-left rounded-2xl px-3 py-2.5 cursor-pointer transition flex items-start gap-2.5 border ${activeId === c.id ? 'border-gold-400/40 bg-white/10' : 'border-transparent hover:bg-white/5'}`}>
                {activeId === c.id && <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400" aria-hidden />}
                <Icon name="chat" size={14} className={`mt-0.5 shrink-0 ${activeId === c.id ? 'text-gold-400' : 'text-rst-300'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold text-rst-50 truncate">{c.title}</span>
                  <span className="block text-[9.5px] text-rst-300/75 truncate">{new Date(c.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {c.message_count} pesan</span>
                </span>
                <button onClick={(e) => deleteConversation(c.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-rst-300 hover:text-red-300 transition" aria-label="Hapus">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
          {/* footer */}
          <div className="p-4 border-t border-white/10 text-[10px] text-rst-300/85 leading-relaxed">
            <p className="flex items-center gap-1.5 font-bold text-rst-100"><Icon name="shield" size={12} className="text-gold-400" /> SOERA AI aman &amp; tercatat</p>
            <p className="mt-1">Jawaban disusun dari basis pengetahuan resmi RS Soeradji + AI. Darurat? Tetap ke IGD (0272) 321020 ext 200.</p>
          </div>
        </aside>
        {sidebarOpen && <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ===== AREA CHAT ===== */}
        <section className="flex-1 flex flex-col min-w-0 relative bg-[#f6faf9] [background-image:radial-gradient(900px_380px_at_50%_-120px,rgba(31,127,120,0.10),transparent)]">
          {/* top bar */}
          <div className="flex items-center gap-2.5 px-3 sm:px-5 h-14 border-b border-rst-100 bg-white/80 backdrop-blur">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-rst-50 text-rst-700" aria-label="Riwayat"><Icon name="menu" size={20} /></button>
            <Link href="/" className="p-2 rounded-xl text-rst-700 hover:bg-rst-50 transition" aria-label="Kembali ke Beranda" title="Beranda"><Icon name="home" size={19} /></Link>
            <Image src={MUSE} alt="SOERA AI" width={34} height={34} className="h-8 w-8 rounded-xl object-cover object-top bg-rst-900 border border-gold-400/60" />
            <div className="leading-tight min-w-0">
              <p className="text-[13px] font-extrabold text-rst-900 truncate">SOERA AI <span className="font-semibold text-rst-400">· Asisten RS Soeradji</span></p>
              <p className="text-[9.5px] font-semibold text-rst-500 flex items-center gap-1.5">
                {mode === 'llm' ? (<><span className="relative inline-flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span> AI sedang menjawab ({llmEnabled ? 'model terhubung' : 'endpoint aktif'})</>)
                  : mode === 'offline' ? (<><Icon name="wifiOff" size={10} className="text-amber-600" /> Mode offline — basis pengetahuan lokal</>)
                  : (<><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Siap membantu Anda</>)}
              </p>
            </div>
            <a href="tel:0272321020" className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-[11px] font-bold text-white whitespace-nowrap hover:bg-red-700 transition"><Icon name="phone" size={13} /> IGD 24 Jam</a>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-3 sm:px-6 py-5">
            {isEmpty ? (
              <div className="mx-auto max-w-2xl text-center pt-2 sm:pt-6">
                {/* Muse hero */}
                <div className="relative mx-auto h-40 w-40 sm:h-44 sm:w-44">
                  <div className="absolute inset-0 muse-aura rounded-full" aria-hidden />
                  <Image src={MUSE} alt="SOERA AI" width={176} height={176} priority className="mini-avatar-float relative h-40 w-40 sm:h-44 sm:w-44 rounded-full object-cover object-top muse-hero-ring" />
                </div>
                <h2 className="mt-5 text-2xl sm:text-[2rem] leading-tight font-black text-rst-900 tracking-tight">{greeting}, <span className="text-rst-600">Bapak/Ibu</span> 👋</h2>
                <p className="mt-2 text-[13px] sm:text-sm text-rst-600 max-w-md mx-auto">Ada yang bisa <strong>SOERA AI</strong> bantu hari ini? Jadwal dokter, pendaftaran, tarif, Home Care, kampanye — langsung jawab.</p>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button key={s.text} onClick={() => sendMessage(s.text)} className="group rounded-2xl border border-rst-100 bg-white p-3 sm:p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rst-400 hover:shadow-lg">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rst-700 text-gold-400 transition group-hover:bg-rst-800"><Icon name={s.icon as any} size={16} /></span>
                      <span className="mt-2 block text-[11.5px] sm:text-[12px] font-extrabold leading-snug text-rst-900">{s.title}</span>
                      <span className="mt-0.5 block text-[9.5px] leading-snug text-rst-500">{s.text}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-[10px] text-rst-400">Dijawab instan dari basis pengetahuan resmi RS Soeradji · pertanyaan bebas dijawab AI (maks <strong>10/hari</strong> per pengguna)</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((m, i) => (
                  <div key={i} className={`msg-in flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {m.role === 'assistant'
                      ? <Image src={MUSE} alt="SOERA AI" width={36} height={36} className={`h-9 w-9 mt-1 rounded-2xl object-cover object-top bg-rst-900 border border-gold-400/50 shrink-0 ${m.streaming ? 'muse-live' : ''}`} />
                      : <span className="h-9 w-9 mt-1 rounded-2xl bg-rst-700 text-[9px] font-black tracking-wide text-white flex items-center justify-center shrink-0 border border-rst-600">ANDA</span>}
                    <div className={`max-w-[85%] sm:max-w-[78%] rounded-3xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-gradient-to-br from-rst-700 to-rst-800 text-white rounded-tr-md' : 'bg-white border border-rst-100 text-rst-900 rounded-tl-md'}`}>
                      {/* chip eksekusi tool */}
                      {m.role === 'assistant' && !!m.toolSteps?.length && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {m.toolSteps.map((s, ti) => {
                            const meta = TOOL_META[s.tool];
                            const label = (s.state === 'run' ? meta?.run : meta?.done) ?? (s.state === 'run' ? 'Menjalankan agen…' : 'Selesai');
                            return (
                              <span key={ti} className={`tool-step ${s.state === 'run' ? 'run' : 'done'}`}>
                                {s.state === 'run' ? <span className="tool-spinner" aria-hidden /> : <Icon name="check" size={11} />}
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {/* panel berpikir */}
                      {m.role === 'assistant' && (!!m.reasoning?.trim() || m.streaming) && (
                        <details className="thinking-panel" open={!!m.streaming}>
                          <summary>
                            <Icon name="sparkle" size={12} />
                            <span className={m.streaming ? 'shimmer-text' : ''}>{m.streaming ? 'Sedang berpikir…' : 'Proses berpikir'}</span>
                            <span className="ml-auto text-[8.5px] font-bold normal-case tracking-normal text-rst-400">
                              {m.reasoning ? `~${Math.ceil(m.reasoning.length / 4)} token` : 'menunggu sinyal…'} · {m.streaming ? 'live' : 'klik: buka/tutup'}
                            </span>
                          </summary>
                          <div className="mt-1.5 max-h-44 overflow-y-auto pr-1">
                            {m.reasoning ? (
                              <p className="whitespace-pre-wrap text-[11px] italic leading-snug text-rst-500">{m.reasoning}</p>
                            ) : (
                              <div className="space-y-1.5 py-1.5" aria-hidden>
                                <div className="skeleton-line w-11/12" /><div className="skeleton-line w-4/5" /><div className="skeleton-line w-2/3" />
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                      {/* kartu generative */}
                      {m.role === 'assistant' && !!m.cards?.length && (
                        <div className="genui-cards">{m.cards.map((c, ci) => <ChatCard key={ci} card={c} />)}</div>
                      )}
                      {/* isi jawaban */}
                      {m.role === 'assistant' && !m.content && m.streaming ? (
                        <span className="dot-typing text-rst-400 text-lg leading-none"><span>●</span> <span>●</span> <span>●</span></span>
                      ) : (
                        <Markdown text={m.content} />
                      )}
                      {m.role === 'assistant' && m.streaming && m.content && <span className="stream-caret" aria-hidden />}
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

          {/* composer dock */}
          <div className="border-t border-rst-100 bg-white/85 backdrop-blur px-3 sm:px-6 py-3">
            {aiQuota && aiQuota.remaining <= 0 && (
              <div role="alert" className="max-w-3xl mx-auto mb-2 rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[11px] leading-snug text-amber-900 flex items-start gap-2">
                <span aria-hidden className="text-base leading-none mt-0.5">⏳</span>
                <span>
                  <strong>Kuota pertanyaan AI di luar layanan Soeradji hari ini sudah habis</strong> (sisa 0/{aiQuota.max} — reset pukul <strong>00.00 WIB</strong>).<br />
                  Pertanyaan <strong>layanan</strong> (jadwal dokter, tarif, pendaftaran, Home Care, kampanye, keluhan, kontak) <strong>tetap bisa dijawab tanpa kuota</strong>. Bantuan langsung: <a href="tel:0272321020" className="underline font-bold">(0272) 321020</a> / WhatsApp <a href="https://wa.me/62816917000" className="underline font-bold">0816-9170-00</a>.
                </span>
              </div>
            )}
            {!busy && !isEmpty && (
              <div className="max-w-3xl mx-auto mb-2 flex gap-2 overflow-x-auto nice-scroll pb-0.5" aria-label="Pertanyaan cepat">
                {QUICK_CHIPS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} className="whitespace-nowrap rounded-full border border-rst-100 bg-rst-50 px-3.5 py-1.5 text-[10.5px] font-semibold text-rst-700 transition hover:border-rst-400 hover:bg-white hover:text-rst-900">{q}</button>
                ))}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 rounded-3xl border border-rst-200 bg-white pl-4 pr-1.5 py-1.5 ring-1 ring-rst-100 shadow-[0_14px_44px_-16px_rgba(7,31,29,0.45)] transition focus-within:border-rst-500 focus-within:ring-2 focus-within:ring-rst-100">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  rows={1}
                  placeholder="Tulis pertanyaan Anda… (Enter kirim · Shift+Enter baris baru)"
                  className="flex-1 resize-none bg-transparent outline-none text-[15px] px-1 py-2.5 max-h-40 placeholder-rst-300 text-rst-900"
                  disabled={busy}
                  aria-label="Tulis pertanyaan"
                />
                {busy ? (
                  <button type="button" onClick={() => abortRef.current?.abort()} className="shrink-0 h-11 px-4 rounded-2xl bg-rst-200 text-rst-800 text-xs font-bold hover:bg-rst-300 transition">Stop</button>
                ) : (
                  <button type="submit" disabled={!input.trim()} className="shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 text-rst-950 flex items-center justify-center shadow-[0_6px_18px_-6px_rgba(242,193,78,0.7)] transition hover:brightness-105 active:scale-95 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed" aria-label="Kirim">
                    <Icon name="send" size={18} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-center text-[9.5px] text-rst-400">SOERA AI dapat keliru — periksa info penting ke <a href="tel:0272321020" className="underline">(0272) 321020</a>. Bukan diagnosis medis.
                {aiQuota && (<span className={`block mt-0.5 ${aiQuota.remaining <= 0 ? 'text-amber-700 font-semibold' : 'text-rst-500'}`}>Kuota AI bebas hari ini: <strong>sisa {aiQuota.remaining}/{aiQuota.max}</strong> · reset 00.00 WIB · pertanyaan layanan tetap tersedia</span>)}
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
