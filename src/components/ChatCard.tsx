'use client';
// Kartu generatif yang dikirim tool agen RS Soeradji di aliran chat (jadwal/tarif/kampanye/info).
// Data selalu dari basis pengetahuan/SQLite lokal — bukan karangan model.
import Icon from './Icon';
import { bp } from '@/lib/basePath';
import type { CardPayload } from '@/lib/genui';

const fmtRp = (n?: number | null) => (typeof n === 'number' ? 'Rp' + n.toLocaleString('id-ID') : '—');

export default function ChatCard({ card }: { card: CardPayload }) {
  if (!card || !card.items?.length) return null;

  if (card.kind === 'jadwal') {
    return (
      <div className="genui-card my-2 overflow-hidden rounded-2xl border border-rst-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-rst-100 bg-rst-50/60 px-3.5 py-2">
          <Icon name="calendar" size={15} className="text-rst-600" />
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-rst-800">Jadwal Dokter RS Soeradji</p>
          <a href={bp('/jadwal')} className="ml-auto text-[10px] font-bold text-rst-500 hover:text-rst-800 hover:underline">Lihat semua →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px] leading-snug">
            <thead>
              <tr className="text-left text-[9.5px] uppercase tracking-wider text-rst-400">
                <th className="px-3.5 py-1.5 font-bold">Dokter</th><th className="px-3.5 py-1.5 font-bold">Poli</th><th className="px-3.5 py-1.5 font-bold">Hari</th><th className="px-3.5 py-1.5 font-bold">Jam</th>
              </tr>
            </thead>
            <tbody>
              {card.items.map((j, i) => (
                <tr key={i} className="border-t border-rst-50 align-top text-rst-800 odd:bg-rst-50/40">
                  <td className="px-3.5 py-1.5 font-semibold">{j.dokter}{j.catatan && <span className="block text-[9px] font-bold uppercase text-amber-600">{j.catatan}</span>}</td>
                  <td className="px-3.5 py-1.5">{j.poli}</td>
                  <td className="px-3.5 py-1.5 whitespace-nowrap">{j.hari}</td>
                  <td className="px-3.5 py-1.5 whitespace-nowrap">{j.jam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-rst-100 px-3.5 py-2">
          <a href="https://wa.me/62816917000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10.5px] font-bold text-white hover:bg-emerald-700 transition"><Icon name="phone" size={11} /> Daftar via WA 0816-9170-00</a>
          <span className="text-[9.5px] text-rst-400">H-7 s/d H-1 · konfirmasi (0272) 321020 · jadwal dapat berubah</span>
        </div>
      </div>
    );
  }

  if (card.kind === 'tarif') {
    return (
      <div className="genui-card my-2 overflow-hidden rounded-2xl border border-rst-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-rst-100 bg-rst-50/60 px-3.5 py-2">
          <Icon name="clipboard" size={15} className="text-rst-600" />
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-rst-800">Tarif Layanan (SK {card.nomorSK})</p>
          <a href={bp('/home-care')} className="ml-auto text-[10px] font-bold text-rst-500 hover:text-rst-800 hover:underline">Tabel lengkap →</a>
        </div>
        <ul className="divide-y divide-rst-50">
          {card.items.map((t, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 px-3.5 py-1.5 text-[11.5px]">
              <span className="text-rst-800">{t.nama}{t.section && <span className="block text-[9px] uppercase tracking-wide text-rst-400">{t.section}</span>}</span>
              <span className="whitespace-nowrap font-bold text-rst-900">{fmtRp(t.jumlah)}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-rst-100 px-3.5 py-1.5 text-[9.5px] text-rst-400">Tarif resmi RS Soeradji/Home Care — dapat berubah. Info & pemesanan: (0272) 321020.</p>
      </div>
    );
  }

  if (card.kind === 'kampanye') {
    return (
      <div className="genui-card my-2 overflow-hidden rounded-2xl border border-rst-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-rst-100 bg-rst-50/60 px-3.5 py-2">
          <Icon name="megaphone" size={15} className="text-rst-600" />
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-rst-800">Kampanye Kesehatan RS Soeradji</p>
          <a href={bp('/kampanye')} className="ml-auto text-[10px] font-bold text-rst-500 hover:text-rst-800 hover:underline">Semua kampanye →</a>
        </div>
        <ul className="divide-y divide-rst-50">
          {card.items.map((c, i) => (
            <li key={i} className="px-3.5 py-2">
              <p className="text-[11.5px] font-bold text-rst-900">{c.title}</p>
              {c.summary && <p className="mt-0.5 text-[10.5px] leading-snug text-rst-600">{c.summary}</p>}
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9.5px] font-semibold text-rst-400">
                {c.location && <span>📍 {c.location}</span>}
                {c.start && <span>🗓 {c.start}{c.end ? ` s/d ${c.end}` : ''}</span>}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (card.kind === 'info') {
    return (
      <div className="genui-card my-2 overflow-hidden rounded-2xl border border-rst-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-rst-100 bg-rst-50/60 px-3.5 py-2">
          <Icon name="doc" size={15} className="text-rst-600" />
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-rst-800">Dokumen Basis Pengetahuan RS Soeradji</p>
        </div>
        <ul className="divide-y divide-rst-50">
          {card.items.map((d, i) => (
            <li key={i} className="flex items-start gap-2 px-3.5 py-2">
              <Icon name="check" size={12} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>
                <span className="block text-[11.5px] font-semibold leading-snug text-rst-800">{d.title}</span>
                {d.source && <span className="mt-0.5 block text-[9.5px] uppercase tracking-wide text-rst-400">Sumber: {d.source}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}
