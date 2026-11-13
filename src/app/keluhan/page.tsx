'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { KELUHAN_KATEGORI } from '@/lib/keluhan-constants';

const PRIORITAS = [ ['rendah', 'Rendah'], ['normal', 'Normal'], ['tinggi', 'Tinggi — mendesak'] ] as const;

export default function KeluhanPage() {
  const [form, setForm] = useState({ name: '', phone: '', category: '', subject: '', description: '', priority: 'normal' });
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState<{ ticketNumber?: string; message?: string; error?: string } | null>(null);

  const [track, setTrack] = useState({ ticket: '', phone: '' });
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setCreated(null);
    try {
      const res = await fetch('/api/keluhan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      setCreated(data);
      if (res.ok) setForm({ name: '', phone: '', category: '', subject: '', description: '', priority: 'normal' });
    } catch { setCreated({ error: 'Gagal mengirim. Coba lagi.' }); } finally { setSending(false); }
  };

  const doTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTracking(true); setTrackResult(null);
    try {
      const res = await fetch(`/api/keluhan?ticket=${encodeURIComponent(track.ticket)}&phone=${encodeURIComponent(track.phone)}`);
      setTrackResult(await res.json());
    } catch { setTrackResult({ message: 'Gagal melacak tiket.' }); } finally { setTracking(false); }
  };

  const statusStep = (s: string) => ({ baru: 0, diproses: 1, selesai: 2 }[s] ?? 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <p className="chip bg-rst-100 text-rst-700 mb-2"><Icon name="inbox" size={12} /> Layanan Pengaduan Terintegrasi</p>
      <h1 className="text-3xl font-black text-rst-900 tracking-tight">Keluhan, Kritik &amp; Saran</h1>
      <p className="mt-1 text-sm text-rst-600 max-w-3xl">Suara Anda adalah bahan perbaikan layanan kami. Setiap laporan mendapat <strong>nomor tiket</strong> dan ditindaklanjuti petugas RST. Respon awal ≤ 1×24 jam kerja.</p>

      <div className="mt-6 grid lg:grid-cols-12 gap-6">
        {/* FORM */}
        <form onSubmit={submit} className="card p-5 sm:p-6 lg:col-span-7 space-y-4">
          <h2 className="font-extrabold text-rst-900 text-lg">Buat Tiket Pengaduan</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label" htmlFor="k-nama">Nama *</label><input id="k-nama" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Nama Anda" /></div>
            <div><label className="label" htmlFor="k-hp">No. HP/WA *</label><input id="k-hp" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="08xxxxxxxxxx" inputMode="tel" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label" htmlFor="k-kat">Kategori *</label><select id="k-kat" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input"><option value="">— pilih —</option>{KELUHAN_KATEGORI.map((k) => <option key={k}>{k}</option>)}</select></div>
            <div><label className="label">Prioritas</label><div className="flex gap-1.5">{PRIORITAS.map(([v, l]) => (
              <button type="button" key={v} onClick={() => setForm({ ...form, priority: v })} className={`flex-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold transition ${form.priority === v ? (v === 'tinggi' ? 'border-red-400 bg-red-50 text-red-700' : 'border-rst-500 bg-rst-50 text-rst-800') : 'border-rst-200 text-rst-500'}`}>{l}</button>
            ))}</div></div>
          </div>
          <div><label className="label" htmlFor="k-subjek">Subjek *</label><input id="k-subjek" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" placeholder="mis. Antrean loket pendaftaran terlalu lama" minLength={4} /></div>
          <div><label className="label" htmlFor="k-desk">Kronologi / detail *</label><textarea id="k-desk" required minLength={10} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Ceritakan kejadian: kapan, di mana (unit/poli), siapa yang terlibat, apa yang terjadi…" /></div>
          <button type="submit" disabled={sending} className="btn btn-primary w-full justify-center">{sending ? 'Mengirim…' : 'Kirim Pengaduan'}<Icon name="send" size={17} /></button>
          {created?.ticketNumber && (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold">Pengaduan Tercatat</p>
              <p className="mt-1 text-3xl font-black text-emerald-800 tracking-wider select-all">{created.ticketNumber}</p>
              <p className="mt-2 text-xs text-emerald-800">{created.message}</p>
              <p className="mt-1 text-[10.5px] text-emerald-700">Simpan nomor ini + No. HP Anda untuk melacak status di panel "Lacak Tiket".</p>
            </div>
          )}
          {created?.error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{created.error}</div>}
        </form>

        {/* TRACK + INFO */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={doTrack} className="card p-5">
            <p className="font-extrabold text-rst-900 flex items-center gap-2"><Icon name="search" size={16} className="text-rst-500" /> Lacak Status Tiket</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={track.ticket} onChange={(e) => setTrack({ ...track, ticket: e.target.value })} className="input uppercase" placeholder="SKT-20261112-XXXXXX" required aria-label="Nomor tiket" />
              <input value={track.phone} onChange={(e) => setTrack({ ...track, phone: e.target.value })} className="input" placeholder="No. HP/WA saat melapor" required inputMode="tel" aria-label="No HP" />
            </div>
            <button type="submit" disabled={tracking} className="btn btn-outline w-full justify-center mt-3">{tracking ? 'Melacak…' : 'Lacak Tiket'}</button>
            {trackResult?.found && (
              <div className="mt-4 rounded-2xl border border-rst-100 bg-rst-50/50 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-rst-900">{trackResult.ticket.ticket_number}</p>
                  <span className={`chip ${trackResult.ticket.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' : trackResult.ticket.status === 'diproses' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{trackResult.ticket.status.toUpperCase()}</span>
                </div>
                <p className="mt-2 text-xs text-rst-600"><span className="font-bold">{trackResult.ticket.category}</span> — {trackResult.ticket.subject}</p>
                {/* progress */}
                <div className="mt-3 flex items-center">
                  {['Diterima', 'Diproses', 'Selesai'].map((label, i) => {
                    const reached = statusStep(trackResult.ticket.status) >= i;
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && <span className={`absolute top-2 right-1/2 h-0.5 w-full -z-0 ${reached ? 'bg-rst-500' : 'bg-rst-100'}`} />}
                        <span className={`relative z-10 h-4 w-4 rounded-full border-2 ${reached ? 'bg-rst-500 border-rst-600' : 'bg-white border-rst-200'}`} />
                        <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-rst-500">{label}</span>
                      </div>
                    );
                  })}
                </div>
                {trackResult.ticket.response && (
                  <div className="mt-3 rounded-xl bg-white border border-rst-100 p-3"><p className="text-[10px] uppercase tracking-widest text-rst-400 font-bold">Tanggapan petugas</p><p className="mt-1 text-xs text-rst-800">{trackResult.ticket.response}</p></div>
                )}
                <p className="mt-2 text-[10px] text-rst-400">Dilaporkan: {new Date(trackResult.ticket.created_at).toLocaleString('id-ID')}</p>
              </div>
            )}
            {trackResult && !trackResult.found && <p className="mt-3 text-xs text-red-600">{trackResult.message}</p>}
          </form>

          <div className="card p-5">
            <p className="font-extrabold text-rst-900 flex items-center gap-2"><Icon name="phone" size={16} className="text-rst-500" /> Saluran Lain</p>
            <ul className="mt-2 space-y-1.5 text-xs text-rst-700">
              <li>Hotline pengaduan: <a href="tel:085179577302" className="font-bold underline">0851-7957-7302</a></li>
              <li>Contact Center: <a href="tel:0272321020" className="font-bold underline">(0272) 321020</a></li>
              <li>Email: rsupsoeradji_klaten@yahoo.com</li>
              <li>Kotak saran di area rumah sakit</li>
            </ul>
            <div className="mt-3 rounded-xl bg-gold-400/15 border border-gold-400/40 p-3 text-[11px] text-rst-800 leading-relaxed">
              <strong>Anti-pungli:</strong> layanan RST tidak dipungut biaya di luar tarif resmi — jangan beri uang/imbalan kepada petugas. Laporkan indikasi gratifikasi ke <a href="tel:085179577302" className="underline font-bold">0851-7957-7302</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
