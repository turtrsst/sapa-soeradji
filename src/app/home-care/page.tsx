'use client';
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { TARIF_SECTIONS, TARIF_META, searchTarif, formatRp } from '@/lib/tarif';

export default function HomeCarePage() {
  const [tab, setTab] = useState<'tarif' | 'form'>('tarif');
  const [q, setQ] = useState('');
  const [section, setSection] = useState<string>('all');
  const filtered = useMemo(() => {
    const base = searchTarif(q);
    return section === 'all' ? base : base.filter((i) => i.section === section);
  }, [q, section]);
  const sections = TARIF_SECTIONS.map((s) => s.judul);

  const [form, setForm] = useState({ name: '', phone: '', address: '', service: '', schedule: '', notes: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setResult(null);
    try {
      const res = await fetch('/api/homecare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      setResult(data);
      if (res.ok) setForm({ name: '', phone: '', address: '', service: '', schedule: '', notes: '' });
    } catch {
      setResult({ error: 'Gagal mengirim. Periksa koneksi Anda.' });
    } finally { setSending(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header */}
      <p className="chip bg-rst-100 text-rst-700 mb-2"><Icon name="home" size={12} /> Home Care Go-Trah</p>
      <h1 className="text-3xl font-black text-rst-900 tracking-tight">Home Care — Pelayanan di Rumah</h1>
      <p className="mt-1 text-sm text-rst-600 max-w-3xl">Tim dokter, perawat, dan fisioterapis RSUP Dr. Soeradji Tirtonegoro datang langsung ke rumah Anda — untuk pasien pasca rawat inap, lansia, disabilitas, atau yang sulit bepergian.</p>

      {/* SK Card */}
      <div className="mt-5 card p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/20 text-gold-600"><Icon name="doc" size={24} /></span>
        <div className="text-xs text-rst-700 leading-relaxed flex-1">
          <p className="text-sm font-extrabold text-rst-900">Dasar Tarif: SK Direktur Utama RST No. {TARIF_META.nomor}</p>
          <p className="mt-0.5">Tanggal {TARIF_META.tanggal} · mencabut SK No. HK.02.03/D.XXVI/24514/2023 · ditandatangani {TARIF_META.penandatangan}.</p>
          <p className="mt-1 font-semibold text-rst-800">Catatan SK: {TARIF_META.catatan}</p>
        </div>
        <a href={TARIF_META.dokumen} download className="btn btn-primary !py-2.5 text-xs shrink-0"><Icon name="download" size={15} /> Unduh SK (PDF)</a>
      </div>

      {/* Tabs */}
      <div className="no-print mt-6 flex gap-2 border-b border-rst-100">
        {[
          ['tarif', 'Tarif Tindakan (±80 item)'],
          ['form', 'Ajukan Kunjungan Home Care'],
        ].map(([id, label]) => (
          <button key={id as string} onClick={() => setTab(id as any)} className={`px-4 sm:px-5 py-3 text-sm font-bold border-b-2 -mb-px transition ${tab === id ? 'border-rst-600 text-rst-900' : 'border-transparent text-rst-400 hover:text-rst-700'}`}>{label}</button>
        ))}
      </div>

      {/* ===== TAB TARIF ===== */}
      {tab === 'tarif' && (
        <div className="mt-5">
          <div className="card p-4 grid gap-3 md:grid-cols-12 items-end">
            <div className="md:col-span-7 relative">
              <label className="label" htmlFor="cari-tarif">Cari tindakan / layanan</label>
              <Icon name="search" size={17} className="absolute left-3.5 bottom-3 text-rst-400" />
              <input id="cari-tarif" value={q} onChange={(e) => setQ(e.target.value)} placeholder="mis. infus, luka, NGT, fisioterapi, visite dokter…" className="input pl-10" />
            </div>
            <div className="md:col-span-4">
              <label className="label" htmlFor="seksi">Kelompok layanan</label>
              <select id="seksi" value={section} onChange={(e) => setSection(e.target.value)} className="input">
                <option value="all">Semua kelompok ({TARIF_SECTIONS.length})</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-1"><button onClick={() => window.print()} className="btn btn-outline w-full justify-center" title="Cetak"><Icon name="print" size={17} /></button></div>
          </div>

          <p className="mt-3 text-xs font-semibold text-rst-500">Menampilkan <strong className="text-rst-800">{filtered.length}</strong> tindakan. Biaya = Jasa Sarana + Jasa Pelayanan.</p>

          <div className="mt-2 space-y-6">
            {TARIF_SECTIONS.filter((s) => section === 'all' || s.judul === section).map((s) => {
              const items = filtered.filter((i) => i.section === s.judul);
              if (!items.length) return null;
              return (
                <div key={s.id} className="card overflow-hidden">
                  <div className="bg-rst-800 text-white px-4 py-2.5 flex items-center justify-between">
                    <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">{s.judul}</h2>
                    <span className="text-[10px] font-bold bg-white/15 rounded-full px-2 py-0.5">{items.length} item</span>
                  </div>
                  <div className="overflow-x-auto nice-scroll">
                    <table className="w-full min-w-[820px] border-collapse">
                      <thead><tr className="bg-rst-50 text-rst-700">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">No</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Jenis Pelayanan</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Jasa Sarana</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Jasa Pelayanan</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Jumlah</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Ket</th>
                      </tr></thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={`${s.id}-${it.no}`} className="odd:bg-rst-50/40 hover:bg-gold-400/10">
                            <td className="td text-rst-400 font-bold">{it.no}</td>
                            <td className="td font-medium text-rst-900">{it.nama}</td>
                            <td className="td text-right tabular-nums text-rst-600">{formatRp(it.sarana)}</td>
                            <td className="td text-right tabular-nums text-rst-600">{formatRp(it.pelayanan)}</td>
                            <td className="td text-right tabular-nums font-extrabold text-rst-900">{formatRp(it.jumlah)}</td>
                            <td className="td text-xs text-rst-500">{it.ket ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="card p-10 text-center text-rst-500 text-sm">Tidak ada item cocok dengan "{q}". Coba kata kunci lain.</div>}
          </div>
        </div>
      )}

      {/* ===== TAB FORM ===== */}
      {tab === 'form' && (
        <div className="mt-6 grid lg:grid-cols-12 gap-6">
          <form onSubmit={submit} className="card p-5 sm:p-6 lg:col-span-7 space-y-4">
            <h2 className="font-extrabold text-rst-900 text-lg">Ajukan Kunjungan Home Care</h2>
            <p className="text-xs text-rst-500 -mt-2">Isi formulir — petugas RST akan menghubungi Anda untuk verifikasi &amp; penjadwalan. Untuk kondisi darurat, jangan gunakan formulir ini; hubungi IGD <a href="tel:0272321020" className="underline font-bold">(0272) 321020 ext 200</a>.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label" htmlFor="hc-nama">Nama lengkap pasien *</label><input id="hc-nama" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Nama pasien" /></div>
              <div><label className="label" htmlFor="hc-hp">No. HP/WA keluarga *</label><input id="hc-hp" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="08xxxxxxxxxx" inputMode="tel" /></div>
            </div>
            <div><label className="label" htmlFor="hc-alamat">Alamat lengkap kunjungan *</label><textarea id="hc-alamat" required rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" placeholder="Jalan, RT/RW, kelurahan, kecamatan, patokan…" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="hc-layanan">Jenis layanan *</label>
                <select id="hc-layanan" required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="input">
                  <option value="">— pilih layanan —</option>
                  <optgroup label="Tindakan Medik">
                    <option>Pasang/lepas kateter urine</option><option>Pasang/lepas NGT / sonde</option><option>Pasang infus</option><option>Injeksi (IM/SC/IV)</option><option>Nebuliser</option><option>Perawatan luka (kecil/sedang/besar)</option><option>Pengambilan darah</option><option>Pemberian obat / edukasi keluarga</option>
                  </optgroup>
                  <optgroup label="Kunjungan Profesional">
                    <option>Visite dokter umum</option><option>Visite dokter spesialis</option><option>Visite dokter sub spesialis</option><option>Konsultasi psikologi</option><option>Fisioterapi / Rehabilitasi medik di rumah</option><option>Kunjungan rohaniwan / pendampingan</option>
                  </optgroup>
                  <optgroup label="Lainnya">
                    <option>Kunjungan lansia / perawatan paliatif</option><option>Breast care / perawatan pasca melahirkan</option><option>Sewa alat medik (tempat tidur / oksigen konsentrator)</option><option>Lainnya (tulis di catatan)</option>
                  </optgroup>
                </select>
              </div>
              <div><label className="label" htmlFor="hc-jadwal">Rencana jadwal</label><input id="hc-jadwal" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="input" placeholder="mis. Senin pagi, / setelah pulang rawat inap" /></div>
            </div>
            <div><label className="label" htmlFor="hc-catatan">Catatan / kondisi pasien</label><textarea id="hc-catatan" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Diagnosis singkat, obat rutin, BPJS/umum, akses rumah…" /></div>
            <button type="submit" disabled={sending} className="btn btn-primary w-full justify-center">{sending ? 'Mengirim…' : 'Kirim Permintaan Home Care'}<Icon name="send" size={17} /></button>
            {result?.message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm px-4 py-3">{result.message}</div>}
            {result?.error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{result.error}</div>}
          </form>
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5">
              <p className="font-extrabold text-rst-900 flex items-center gap-2"><Icon name="info" size={16} className="text-rst-500" /> Cara Kerja Home Care</p>
              <ol className="mt-3 space-y-2.5 text-xs text-rst-700 leading-relaxed">
                <li className="flex gap-2"><span className="font-black text-rst-400">1.</span>Permintaan via formulir ini / telepon (0272) 321020 / WA 0816-9170-00.</li>
                <li className="flex gap-2"><span className="font-black text-rst-400">2.</span>Verifikasi: petugas menghubungi Anda (identitas, diagnosis, alamat, skema pembayaran).</li>
                <li className="flex gap-2"><span className="font-black text-rst-400">3.</span>Penjadwalan kunjungan tim medis (dokter/perawat/fisioterapis sesuai kebutuhan).</li>
                <li className="flex gap-2"><span className="font-black text-rst-400">4.</span>Pelaksanaan tindakan di rumah + edukasi keluarga.</li>
                <li className="flex gap-2"><span className="font-black text-rst-400">5.</span>Pembayaran sesuai SK tarif; &gt;1 tindakan → jasa pelaksana hanya 1×. Bila BPJS, klaim sesuai ketentuan JKN.</li>
              </ol>
            </div>
            <div className="card p-5 bg-rst-50 border-rst-100">
              <p className="font-extrabold text-rst-900 flex items-center gap-2"><Icon name="phone" size={16} className="text-rst-500" /> Kontak Home Care</p>
              <ul className="mt-2 space-y-1.5 text-xs text-rst-700">
                <li>Contact Center: <a href="tel:0272321020" className="font-bold underline">(0272) 321020</a></li>
                <li>WhatsApp: <a href="https://wa.me/62816917000" className="font-bold underline">0816-9170-00</a></li>
                <li>Email: rsupsoeradji_klaten@yahoo.com</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
