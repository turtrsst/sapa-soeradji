'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { TARIF_META } from '@/lib/tarif';
import { JADWAL_UPDATE } from '@/lib/jadwal';

type Tab = 'ringkasan' | 'keluhan' | 'homecare' | 'kampanye' | 'ai';

const PROVIDER_PRESETS: { name: string; baseUrl: string; model: string; note: string }[] = [
  { name: 'PrivateLM API Server (Offline — perangkat ini/LAN)', baseUrl: 'http://localhost:8080/v1', model: 'model-lokal-privatelm', note: 'Jalankan PrivateLM (cross-platform-llm-client) di HP/PC, muat model GGUF, aktifkan API Server + Allow network + API key. SAPA PASIEN server menghubungi endpoint ini — tanpa internet.' },
  { name: 'PrivateLM di perangkat lain (LAN/WiFi)', baseUrl: 'http://192.168.1.10:8080/v1', model: 'model-lokal-privatelm', note: 'Ganti 192.168.1.10 dengan IP perangkat menjalankan PrivateLM (terlihat di layar server PrivateLM). Wajib Allow network + API key.' },
  { name: 'Ollama (lokal)', baseUrl: 'http://localhost:11434/v1', model: 'llama3.2', note: 'ollama serve — endpoint OpenAI-compatible bawaan Ollama.' },
  { name: 'llama.cpp llama-server (lokal)', baseUrl: 'http://localhost:8080/v1', model: 'gguf-model', note: 'llama-server -m model.gguf --port 8080 --api-key <key>' },
  { name: 'LM Studio (lokal)', baseUrl: 'http://localhost:1234/v1', model: 'local-model', note: 'Aktifkan "Local Server" di LM Studio.' },
  { name: 'OpenAI (cloud)', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', note: 'Butuh API key OpenAI & koneksi internet.' },
  { name: 'Kimi/Moonshot (cloud)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', note: 'Butuh API key Moonshot & koneksi internet.' },
  { name: 'OpenRouter (cloud)', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', note: 'Butuh API key OpenRouter & koneksi internet.' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('ringkasan');
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [ticketResponse, setTicketResponse] = useState<Record<string, string>>({});
  const [ticketStatus, setTicketStatus] = useState<Record<string, string>>({});
  const [homecare, setHomecare] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignForm, setCampaignForm] = useState({ title: '', summary: '', body: '', tag: 'Promosi Kesehatan', location: '', start_date: '', end_date: '' });
  const [campaignMsg, setCampaignMsg] = useState('');
  const [llm, setLlm] = useState<any>(null);
  const [llmSaved, setLlmSaved] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const loadStats = useCallback(() => fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => {}), []);
  const loadTickets = useCallback((status = 'all') => fetch(`/api/admin/tickets?status=${status}`).then((r) => r.json()).then((d) => setTickets(d.tickets || [])).catch(() => {}), []);
  const loadHomecare = useCallback(() => fetch('/api/admin/homecare').then((r) => r.json()).then((d) => setHomecare(d.requests || [])).catch(() => {}), []);
  const loadCampaigns = useCallback(() => fetch('/api/admin/kampanye').then((r) => r.json()).then((d) => setCampaigns(d.campaigns || [])).catch(() => {}), []);
  const loadSettings = useCallback(() => fetch('/api/admin/settings').then((r) => r.json()).then((d) => setLlm(d.config)).catch(() => {}), []);

  useEffect(() => { loadStats(); loadTickets(); loadHomecare(); loadCampaigns(); loadSettings(); }, [loadStats, loadTickets, loadHomecare, loadCampaigns, loadSettings]);
  useEffect(() => { loadTickets(ticketFilter); }, [ticketFilter, loadTickets]);

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); router.refresh(); };

  const saveTicket = async (idOrNumber: string) => {
    const status = ticketStatus[idOrNumber];
    const response = ticketResponse[idOrNumber];
    await fetch(`/api/admin/tickets/${encodeURIComponent(idOrNumber)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(status ? { status } : {}), ...(response !== undefined ? { response } : {}) }),
    });
    loadTickets(ticketFilter); loadStats();
  };

  const setHomecareStatus = async (id: string, status: string) => {
    await fetch('/api/admin/homecare', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    loadHomecare(); loadStats();
  };

  const toggleCampaign = async (id: number, active: boolean) => {
    await fetch(`/api/admin/kampanye/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
    loadCampaigns();
  };
  const deleteCampaign = async (id: number) => {
    if (!confirm('Hapus kampanye ini?')) return;
    await fetch(`/api/admin/kampanye/${id}`, { method: 'DELETE' });
    loadCampaigns();
  };
  const addCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignMsg('');
    const res = await fetch('/api/admin/kampanye', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campaignForm) });
    if (res.ok) {
      setCampaignForm({ title: '', summary: '', body: '', tag: 'Promosi Kesehatan', location: '', start_date: '', end_date: '' });
      setCampaignMsg('Kampanye tersimpan & langsung tampil di menu Kampanye.');
      loadCampaigns(); loadStats();
    } else {
      const d = await res.json().catch(() => ({}));
      setCampaignMsg(d?.error || 'Gagal menyimpan.');
    }
  };

  const saveLlm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLlmSaved(''); setTestResult(null);
    const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(llm) });
    if (res.ok) { const d = await res.json(); setLlm(d.config); setLlmSaved('Pengaturan tersimpan.'); loadStats(); }
    else setLlmSaved('Gagal menyimpan.');
  };
  const testLlm = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/admin/settings/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseUrl: llm?.baseUrl, apiKey: llm?.apiKey && !llm.apiKey.startsWith('••••') ? llm.apiKey : undefined }) });
      setTestResult(await res.json());
    } catch { setTestResult({ reachable: false, detail: 'Gagal memanggil endpoint uji.' }); } finally { setTesting(false); }
  };

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'ringkasan', label: 'Ringkasan', icon: 'activity' },
    { id: 'keluhan', label: 'Keluhan', icon: 'inbox' },
    { id: 'homecare', label: 'Home Care', icon: 'home' },
    { id: 'kampanye', label: 'Kampanye', icon: 'megaphone' },
    { id: 'ai', label: 'Pengaturan AI (Offline)', icon: 'settings' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rst-800 text-gold-400"><Icon name="building" size={22} /></span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-rst-900 tracking-tight">Panel Admin SAPA PASIEN</h1>
            <p className="text-[11px] text-rst-500 font-semibold">RSUP Dr. Soeradji Tirtonegoro Klaten · Jadwal {JADWAL_UPDATE} · Tarif SK {TARIF_META.nomor}</p>
          </div>
        </div>
        <button onClick={logout} className="btn btn-outline !py-2 text-xs"><Icon name="logout" size={15} /> Keluar</button>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1.5 overflow-x-auto nice-scroll border-b border-rst-100 pb-px">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[12.5px] font-bold border-b-2 -mb-px transition ${tab === t.id ? 'border-rst-600 text-rst-900' : 'border-transparent text-rst-400 hover:text-rst-700'}`}><Icon name={t.icon} size={15} />{t.label}</button>
        ))}
      </div>

      {/* ============ RINGKASAN ============ */}
      {tab === 'ringkasan' && stats && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ['Percakapan', stats.totals.conversations],
              ['Pesan', stats.totals.messages],
              ['Chat Hari Ini', stats.totals.chatsToday],
              ['Tiket Keluhan', stats.totals.tickets],
              ['Permintaan HC', stats.totals.homecareRequests],
              ['Kampanye Aktif', stats.totals.campaigns],
            ].map(([label, n]) => (
              <div key={label as string} className="card p-4 text-center">
                <p className="text-2xl sm:text-3xl font-black text-rst-800">{n as number}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-rst-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="font-extrabold text-rst-900 text-sm uppercase tracking-wide">Volume pertanyaan 14 hari terakhir</p>
              <div className="mt-4 flex items-end gap-1.5 h-40">
                {(stats.logsPerDay as any[]).slice().reverse().map((d) => {
                  const max = Math.max(...stats.logsPerDay.map((x: any) => x.n), 1);
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.n} chat`}>
                      <div className="w-full rounded-t bg-gradient-to-t from-rst-600 to-rst-400" style={{ height: `${(d.n / max) * 100}%`, minHeight: 4 }} />
                      <span className="text-[8.5px] text-rst-400 font-semibold">{String(d.day).slice(5)}</span>
                    </div>
                  );
                })}
                {stats.logsPerDay.length === 0 && <p className="text-xs text-rst-400 m-auto">Belum ada data — tanyakan sesuatu di menu chat.</p>}
              </div>
            </div>
            <div className="card p-5">
              <p className="font-extrabold text-rst-900 text-sm uppercase tracking-wide">Topik terbanyak</p>
              <ul className="mt-3 space-y-1.5 text-xs">
                {(stats.intentStats as any[]).map((i) => {
                  const max = Math.max(...stats.intentStats.map((x: any) => x.n), 1);
                  return (
                    <li key={i.intent} className="flex items-center gap-2">
                      <span className="w-24 sm:w-28 truncate font-bold text-rst-800">{i.intent}</span>
                      <div className="flex-1 h-3 rounded-full bg-rst-50 overflow-hidden"><div className="h-full bg-gold-400" style={{ width: `${(i.n / max) * 100}%` }} /></div>
                      <span className="w-8 text-right font-bold text-rst-600">{i.n}</span>
                    </li>
                  );
                })}
                {stats.intentStats.length === 0 && <p className="text-xs text-rst-400">Belum ada data.</p>}
              </ul>
              <p className="mt-4 font-extrabold text-rst-900 text-sm uppercase tracking-wide">Mode jawaban</p>
              <div className="mt-2 flex gap-2">
                {(stats.modeStats as any[]).map((m) => (
                  <span key={m.mode} className={`chip ${m.mode === 'llm' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{m.mode === 'llm' ? 'AI Lokal/Cloud' : 'Offline KB'}: {m.n}</span>
                ))}
              </div>
              <p className="mt-4 font-extrabold text-rst-900 text-sm uppercase tracking-wide">Tiket keluar terbaru</p>
              <ul className="mt-2 text-xs space-y-1">
                {(stats.recentTickets as any[]).map((t) => (
                  <li key={t.ticket_number} className="flex items-center gap-2"><span className="font-mono font-bold">{t.ticket_number}</span><span className="truncate flex-1 text-rst-600">{t.subject}</span><span className="chip bg-rst-50 text-rst-600">{t.status}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============ KELUHAN ============ */}
      {tab === 'keluhan' && (
        <div className="mt-5">
          <div className="flex items-center gap-2 overflow-x-auto nice-scroll">
            {['all', 'baru', 'diproses', 'selesai', 'ditolak'].map((s) => (
              <button key={s} onClick={() => setTicketFilter(s)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold capitalize transition ${ticketFilter === s ? 'bg-rst-700 text-white' : 'bg-rst-50 text-rst-600 hover:bg-rst-100'}`}>{s === 'all' ? 'Semua' : s}</button>
            ))}
            <span className="text-xs text-rst-400 ml-auto">{tickets.length} tiket</span>
          </div>
          <div className="mt-3 space-y-3">
            {tickets.map((t) => {
              const isOpen = openTicket === t.id;
              return (
                <div key={t.id} className="card overflow-hidden">
                  <button className="w-full text-left px-4 sm:px-5 py-4 flex flex-wrap items-center gap-3" onClick={() => setOpenTicket(isOpen ? null : t.id)}>
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${t.status === 'baru' ? 'bg-sky-500' : t.status === 'diproses' ? 'bg-amber-500' : t.status === 'selesai' ? 'bg-emerald-500' : 'bg-rst-300'}`} />
                    <span className="font-mono text-xs font-bold text-rst-800">{t.ticket_number}</span>
                    <span className="text-sm font-bold text-rst-900 truncate flex-1 min-w-[140px]">{t.subject}</span>
                    <span className="chip bg-rst-50 text-rst-600 hidden sm:inline-flex">{t.category}</span>
                    {t.priority === 'tinggi' && <span className="chip bg-red-100 text-red-700">MENDESAK</span>}
                    <Icon name="chevronDown" size={16} className={`text-rst-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-rst-100 px-4 sm:px-5 py-4 grid lg:grid-cols-2 gap-4">
                      <div className="text-xs text-rst-700 space-y-1.5">
                        <p><span className="label !mb-0.5 inline">Pelapor:</span> {t.name} · {t.phone}</p>
                        <p><span className="label !mb-0.5 inline">Diterima:</span> {new Date(t.created_at).toLocaleString('id-ID')}</p>
                        <p><span className="label !mb-0.5 inline">Kategori:</span> {t.category} · Prioritas: {t.priority}</p>
                        <div className="rounded-xl bg-rst-50 p-3 mt-2 whitespace-pre-wrap leading-relaxed">{t.description}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="label">Tanggapan petugas</label>
                        <textarea className="input" rows={3} value={ticketResponse[t.id] ?? t.response ?? ''} onChange={(e) => setTicketResponse({ ...ticketResponse, [t.id]: e.target.value })} placeholder="Tuliskan tanggapan / tindak lanjut…" />
                        <div className="flex gap-2">
                          <select className="input flex-1" value={ticketStatus[t.id] ?? t.status} onChange={(e) => setTicketStatus({ ...ticketStatus, [t.id]: e.target.value })}>
                            {['baru', 'diproses', 'selesai', 'ditolak'].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => saveTicket(t.id)} className="btn btn-primary !py-2.5 text-xs"><Icon name="check" size={15} /> Simpan</button>
                        </div>
                        <a className="btn btn-outline !py-2 text-[11px]" href={`https://wa.me/${String(t.phone).replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${t.name}, terkait tiket ${t.ticket_number} "${t.subject}" di RSUP Dr. Soeradji Tirtonegoro: `)}`} target="_blank" rel="noreferrer"><Icon name="send" size={13} /> Balas via WhatsApp</a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {tickets.length === 0 && <div className="card p-10 text-center text-sm text-rst-500">Tidak ada tiket pada filter ini.</div>}
          </div>
        </div>
      )}

      {/* ============ HOME CARE ============ */}
      {tab === 'homecare' && (
        <div className="mt-5 space-y-3">
          {homecare.map((r) => (
            <div key={r.id} className="card px-4 sm:px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-rst-900">{r.name} <span className="font-semibold text-rst-400 text-xs">· {r.phone}</span></p>
                <p className="text-xs text-rst-600 mt-0.5"><span className="font-bold">{r.service}</span>{r.schedule ? ` · rencana: ${r.schedule}` : ''}</p>
                <p className="text-[11px] text-rst-500 truncate">{r.address}</p>
                {r.notes && <p className="text-[11px] text-rst-400 italic truncate">Catatan: {r.notes}</p>}
              </div>
              <span className="text-[10px] text-rst-400 whitespace-nowrap">{new Date(r.created_at).toLocaleString('id-ID')}</span>
              <div className="flex items-center gap-1.5">
                {['baru', 'dijadwalkan', 'selesai', 'batal'].map((s) => (
                  <button key={s} onClick={() => setHomecareStatus(r.id, s)} className={`rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition ${r.status === s ? 'bg-rst-700 text-white' : 'bg-rst-50 text-rst-500 hover:bg-rst-100'}`}>{s}</button>
                ))}
                <a href={`https://wa.me/${String(r.phone).replace(/[^0-9]/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-[#25D366]/20 text-[#0f6b3a] hover:bg-[#25D366]/30" title="Hubungi via WA"><Icon name="send" size={14} /></a>
              </div>
            </div>
          ))}
          {homecare.length === 0 && <div className="card p-10 text-center text-sm text-rst-500">Belum ada permintaan Home Care.</div>}
        </div>
      )}

      {/* ============ KAMPANYE ============ */}
      {tab === 'kampanye' && (
        <div className="mt-5 grid lg:grid-cols-12 gap-5">
          <form onSubmit={addCampaign} className="card p-5 lg:col-span-5 space-y-3 h-fit">
            <p className="font-extrabold text-rst-900">Tambah Kampanye Baru</p>
            <div><label className="label">Judul *</label><input className="input" required value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} placeholder="mis. Pekan Skrining Hipertensi Gratis" /></div>
            <div><label className="label">Ringkasan *</label><input className="input" required value={campaignForm.summary} onChange={(e) => setCampaignForm({ ...campaignForm, summary: e.target.value })} placeholder="Satu kalimat untuk kartu & ticker" /></div>
            <div><label className="label">Isi lengkap *</label><textarea className="input" required rows={4} value={campaignForm.body} onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })} placeholder="Detail kegiatan, sasaran, cara ikut serta, kontak…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tag</label><input className="input" value={campaignForm.tag} onChange={(e) => setCampaignForm({ ...campaignForm, tag: e.target.value })} /></div>
              <div><label className="label">Lokasi</label><input className="input" value={campaignForm.location} onChange={(e) => setCampaignForm({ ...campaignForm, location: e.target.value })} /></div>
              <div><label className="label">Mulai</label><input type="date" className="input" value={campaignForm.start_date} onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })} /></div>
              <div><label className="label">Berakhir</label><input type="date" className="input" value={campaignForm.end_date} onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })} /></div>
            </div>
            <button className="btn btn-primary w-full justify-center" type="submit"><Icon name="plus" size={16} /> Terbitkan Kampanye</button>
            {campaignMsg && <p className="text-xs font-semibold text-rst-700 bg-rst-50 rounded-xl px-3 py-2">{campaignMsg}</p>}
          </form>
          <div className="lg:col-span-7 space-y-2.5">
            {campaigns.map((c) => (
              <div key={c.id} className={`card px-4 py-3.5 flex items-center gap-3 ${!c.active ? 'opacity-55' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-rst-900 truncate">{c.title}</p>
                  <p className="text-[11px] text-rst-500 truncate">{c.summary}</p>
                  <span className="chip bg-rst-50 text-rst-600 mt-1">{c.tag}</span>
                </div>
                <button onClick={() => toggleCampaign(c.id, !c.active)} className={`rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase ${c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rst-100 text-rst-500'}`}>{c.active ? 'Aktif' : 'Nonaktif'}</button>
                <button onClick={() => deleteCampaign(c.id)} className="p-2.5 rounded-lg text-rst-400 hover:text-red-600 hover:bg-red-50" aria-label="Hapus"><Icon name="trash" size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ PENGATURAN AI ============ */}
      {tab === 'ai' && llm && (
        <div className="mt-5 grid lg:grid-cols-12 gap-5">
          <form onSubmit={saveLlm} className="card p-5 sm:p-6 lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-rst-900">Mesin Jawaban AI</p>
                <p className="text-[11px] text-rst-500">Nonaktifkan = 100% offline (basis pengetahuan lokal, tanpa model). Aktifkan untuk jalur AI generatif.</p>
              </div>
              <button type="button" onClick={() => setLlm({ ...llm, enabled: !llm.enabled })} className={`relative h-8 w-14 rounded-full transition ${llm.enabled ? 'bg-emerald-500' : 'bg-rst-200'}`} aria-pressed={llm.enabled} aria-label="Aktif/nonaktif AI">
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${llm.enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <label className="label">Preset penyedia (klik untuk isi otomatis)</label>
              <select className="input" value="" onChange={(e) => { const p = PROVIDER_PRESETS.find((x) => x.name === e.target.value); if (p) setLlm({ ...llm, provider: p.name, baseUrl: p.baseUrl, model: p.model }); }}>
                <option value="">— pilih preset —</option>
                {PROVIDER_PRESETS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div><label className="label">Nama penyedia</label><input className="input" value={llm.provider} onChange={(e) => setLlm({ ...llm, provider: e.target.value })} /></div>
            <div className="grid sm:grid-cols-5 gap-3">
              <div className="sm:col-span-3"><label className="label">Base URL (OpenAI-compatible /v1)</label><input className="input font-mono text-xs" value={llm.baseUrl} onChange={(e) => setLlm({ ...llm, baseUrl: e.target.value })} placeholder="http://localhost:8080/v1" /></div>
              <div className="sm:col-span-2"><label className="label">Model</label><input className="input font-mono text-xs" value={llm.model} onChange={(e) => setLlm({ ...llm, model: e.target.value })} placeholder="model-lokal-privatelm" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">API Key {llm.hasApiKey && <span className="text-emerald-600 normal-case">(tersimpan: {llm.apiKey})</span>}</label><input className="input font-mono text-xs" type="password" value={llm.apiKey?.startsWith('••••') ? '' : llm.apiKey} onChange={(e) => setLlm({ ...llm, apiKey: e.target.value })} placeholder={llm.hasApiKey ? 'Isi untuk mengganti key' : 'Kosongkan bila endpoint tanpa key'} autoComplete="new-password" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="label">Temp</label><input type="number" step="0.1" min={0} max={2} className="input" value={llm.temperature} onChange={(e) => setLlm({ ...llm, temperature: e.target.value })} /></div>
                <div><label className="label">Max Tok</label><input type="number" min={16} max={4096} className="input" value={llm.maxTokens} onChange={(e) => setLlm({ ...llm, maxTokens: e.target.value })} /></div>
                <div><label className="label">Timeout dtk</label><input type="number" min={3} max={300} className="input" value={Math.round((llm.timeoutMs || 60000) / 1000)} onChange={(e) => setLlm({ ...llm, timeoutMs: Number(e.target.value) * 1000 })} /></div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary !py-2.5 text-xs"><Icon name="check" size={15} /> Simpan Pengaturan</button>
              <button type="button" onClick={testLlm} disabled={testing} className="btn btn-outline !py-2.5 text-xs">{testing ? 'Menguji…' : 'Uji Koneksi Sekarang'} <Icon name="bolt" size={14} /></button>
            </div>
            {llmSaved && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">{llmSaved}</p>}
            {testResult && (
              <div className={`rounded-xl border px-4 py-3 text-xs ${testResult.reachable ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
                <p className="font-extrabold">{testResult.reachable ? `✓ Endpoint merespons (HTTP ${testResult.status})` : '✗ Endpoint tidak merespons'}</p>
                <p className="mt-1">Model termuat: <span className="font-mono">{testResult.model ?? '—'}</span>{testResult.detail ? ` · ${testResult.detail}` : ''}</p>
              </div>
            )}
          </form>

          {/* Panduan offline PrivateLM */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5 border-gold-400/50">
              <p className="font-extrabold text-rst-900 flex items-center gap-2"><Icon name="wifiOff" size={17} className="text-gold-600" /> Offline dengan PrivateLM (cross-platform-llm-client)</p>
              <p className="mt-1.5 text-[11px] text-rst-600">Jalankan model GGUF sepenuhnya di perangkat (Android/iOS/iPad/PC) tanpa internet — SAPA PASIEN menempel ke API server OpenAI-compatible bawaan PrivateLM (port 8080).</p>
              <ol className="mt-3 space-y-2 text-[11.5px] text-rst-800 leading-relaxed list-none">
                {[
                  'Pasang PrivateLM (github.com/orailnoor/cross-platform-llm-client) di Android/iOS, atau build via Flutter.',
                  'Unduh model GGUF (mis. Qwen2.5-1.5B-Instruct/Llama-3.2-1B/3B Q4_K_M — aman untuk RAM 4–8 GB).',
                  'Muat model sampai status "Loaded" (chat internal PrivateLM bisa menjawab).',
                  'Buka pengaturan → API Server → aktifkan "Allow network access" + isi API key (wajib untuk jaringan).',
                  'Catat alamat server yang tampil, format: http://<IP-perangkat>:8080',
                  'Isi Base URL: http://<IP-perangkat>:8080/v1 dan API key yang sama di formulir sebelah, model: nama model yang termuat (PrivateLM melayani model apa pun namanya).',
                  'Klik "Uji Koneksi Sekarang" — bila ✓, aktifkan toggle mesin AI dan Simpan. Semua tanya-jawab kini 100% offline di server RS.',
                ].map((s, i) => <li key={i} className="flex gap-2"><span className="font-black text-rst-400">{i + 1}.</span>{s}</li>)}
              </ol>
              <p className="mt-3 text-[10px] text-rst-500">Catatan: server SAPA PASIEN dan perangkat PrivateLM harus satu jaringan (LAN/WiFi RS). Tanpa AI sekalipun, jawaban dasar tetap tersedia dari basis pengetahuan lokal (jadwal, tarif, kontak, pendaftaran, dll).</p>
            </div>
            <div className="card p-5">
              <p className="font-extrabold text-rst-900 flex items-center gap-2"><Icon name="info" size={15} className="text-rst-500" /> Perilaku jawaban</p>
              <ul className="mt-2 text-[11.5px] text-rst-700 space-y-1.5">
                <li>1. AI aktif &amp; endpoint merespons → jawaban generatif ber-konteks RST (RAG).</li>
                <li>2. AI aktif tetapi endpoint gagal/timeout → otomatis <strong>fallback offline</strong> + catatan kecil di jawaban.</li>
                <li>3. AI nonaktif → 100% basis pengetahuan lokal (tanpa internet &amp; tanpa model).</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
