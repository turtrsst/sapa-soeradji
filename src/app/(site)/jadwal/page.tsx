'use client';
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { JADWAL_DOKTER, JADWAL_UPDATE, POLI_LIST, searchJadwal } from '@/lib/jadwal';

export default function JadwalPage() {
  const [q, setQ] = useState('');
  const [poli, setPoli] = useState('all');
  const [hari, setHari] = useState('all');
  const results = useMemo(() => searchJadwal(q, poli, hari), [q, poli, hari]);
  const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="chip bg-rst-100 text-rst-700 mb-2"><Icon name="calendar" size={12} /> Poliklinik Reguler</p>
          <h1 className="text-3xl font-black text-rst-900 tracking-tight">Jadwal Dokter</h1>
          <p className="mt-1 text-sm text-rst-600">RSUP Dr. Soeradji Tirtonegoro Klaten · Update {JADWAL_UPDATE} · <span className="font-semibold">jadwal dapat berubah sewaktu-waktu</span> — konfirmasi ke <a className="underline font-semibold" href="tel:0272321020">(0272) 321020</a>.</p>
        </div>
        <button onClick={() => window.print()} className="btn btn-outline no-print"><Icon name="print" size={17} /> Cetak Jadwal</button>
      </div>

      {/* Filters */}
      <div className="no-print card mt-5 p-4 sm:p-5 grid gap-3 md:grid-cols-12 items-end">
        <div className="md:col-span-5">
          <label className="label" htmlFor="q">Cari dokter / poli / spesialisasi</label>
          <div className="relative">
            <Icon name="search" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rst-400" />
            <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="mis. bedah jantung, Sp.PD, ortopedi…" className="input pl-10" />
          </div>
        </div>
        <div className="md:col-span-4">
          <label className="label" htmlFor="poli">Poliklinik</label>
          <select id="poli" value={poli} onChange={(e) => setPoli(e.target.value)} className="input">
            <option value="all">Semua Poliklinik ({POLI_LIST.length})</option>
            {POLI_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="label" htmlFor="hari">Hari praktik</label>
          <select id="hari" value={hari} onChange={(e) => setHari(e.target.value)} className="input">
            <option value="all">Semua hari</option>
            {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="md:col-span-12 flex flex-wrap gap-1.5">
          {['all', ...HARI].map((h) => (
            <button key={h} onClick={() => setHari(h)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${hari === h ? 'bg-rst-600 text-white' : 'bg-rst-50 text-rst-700 hover:bg-rst-100'}`}>{h === 'all' ? 'Semua' : h}</button>
          ))}
        </div>
      </div>

      {/* Ringkasan */}
      <p className="mt-4 text-xs font-semibold text-rst-500">Menampilkan <strong className="text-rst-800">{results.length}</strong> jadwal praktik{poli !== 'all' ? ` di ${poli}` : ''}{hari !== 'all' ? ` hari ${hari}` : ''}.</p>

      {/* Table */}
      <div className="card mt-2 overflow-hidden">
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr><th className="th w-14">No</th><th className="th">Dokter</th><th className="th">Spesialisasi / Poli</th><th className="th">Hari</th><th className="th">Jam</th></tr>
            </thead>
            <tbody>
              {results.map((j, i) => (
                <tr key={`${j.dokter}-${j.hari}-${i}`} className="odd:bg-rst-50/40 hover:bg-gold-400/10 transition">
                  <td className="td text-rst-400 font-bold">{i + 1}</td>
                  <td className="td font-bold text-rst-900">{j.dokter}</td>
                  <td className="td"><span className="text-rst-800">{j.spesialis}</span><span className="block text-[10.5px] text-rst-500 font-semibold">{j.poli}{j.catatan ? ` · ${j.catatan}` : ''}</span></td>
                  <td className="td whitespace-nowrap font-semibold text-rst-800">{j.hari}</td>
                  <td className="td whitespace-nowrap">{j.jam}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={5} className="td py-10 text-center text-rst-500">Tidak ada jadwal yang cocok dengan "{q || poli}". Coba kata kunci lain atau <a href="tel:0272321020" className="underline font-bold">hubungi (0272) 321020</a>.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan */}
      <div className="mt-5 grid md:grid-cols-3 gap-3 text-xs text-rst-700">
        <div className="rounded-2xl border border-rst-100 bg-white p-4"><p className="font-extrabold text-rst-900 flex items-center gap-1.5"><Icon name="info" size={14} /> Pendaftaran Online</p>H-7 s/d H-1 pukul 07.30–14.00 WIB via WhatsApp <a className="underline font-bold" href="https://wa.me/62816917000">0816-9170-00</a>. Format: <code className="bg-rst-50 px-1 rounded">Daftar NoRM Nama Poli Tanggal</code></div>
        <div className="rounded-2xl border border-rst-100 bg-white p-4"><p className="font-extrabold text-rst-900 flex items-center gap-1.5"><Icon name="phone" size={14} /> Konfirmasi Jadwal</p>Jadwal dapat berubah sewaktu-waktu karena libur nasional, tugas dinas, atau cuti dokter. Selalu konfirmasi ke Contact Center <a className="underline font-bold" href="tel:0272321020">(0272) 321020</a>.</div>
        <div className="rounded-2xl border border-rst-100 bg-white p-4"><p className="font-extrabold text-rst-900 flex items-center gap-1.5"><Icon name="clipboard" size={14} /> Jam Layanan Poli</p>Senin–Kamis 07.30–16.00 WIB · Jumat 07.30–16.30 WIB · Pendaftaran sampai 14.00/14.30 WIB. Sabtu/Minggu &amp; libur: poliklinik tutup, IGD tetap buka.</div>
      </div>
      <p className="mt-4 text-[10.5px] text-rst-400">Sumber data: situs resmi RST &amp; direktori jadwal publik (update {JADWAL_UPDATE}). RST tidak bertanggung jawab atas perubahan jadwal tanpa pemberitahuan — verifikasi sebelum berangkat.</p>
    </div>
  );
}
