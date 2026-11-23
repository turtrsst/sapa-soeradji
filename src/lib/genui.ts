// Generative UI cards — payload terstruktur yang mengalir di SSE (event "card") dan
// dirender ChatClient sebagai kartu kaya (jadwal/tarif/kampanye/info). Semua data
// berasal dari tool agen (KB/SQLite lokal) — bukan karangan LLM.
import type { JadwalDokter } from './jadwal';
import { TARIF_META } from './tarif';

export type CardPayload =
  | { kind: 'jadwal'; items: { dokter: string; poli: string; hari: string; jam: string; catatan?: string }[] }
  | { kind: 'tarif'; items: { nama: string; jumlah: number | null; section?: string }[]; nomorSK: string }
  | { kind: 'kampanye'; items: { title: string; summary: string; location?: string | null; start?: string | null; end?: string | null }[] }
  | { kind: 'info'; items: { title: string; source: string }[] };

export function buildJadwalCard(rows: JadwalDokter[], max = 6): CardPayload {
  return {
    kind: 'jadwal',
    items: rows.slice(0, max).map(({ dokter, poli, hari, jam, catatan }) => ({
      dokter: String(dokter || ''), poli: String(poli || ''), hari: String(hari || ''), jam: String(jam || ''),
      ...(catatan ? { catatan: String(catatan) } : {}),
    })),
  };
}

export function buildTarifCard(rows: { nama: string; jumlah: number | null; section?: string }[], max = 8): CardPayload {
  return {
    kind: 'tarif',
    items: rows.slice(0, max).map((r) => ({
      nama: String(r.nama || ''), jumlah: typeof r.jumlah === 'number' ? r.jumlah : null,
      ...(r.section ? { section: String(r.section) } : {}),
    })),
    nomorSK: TARIF_META.nomor,
  };
}

export function buildKampanyeCard(
  rows: { title?: string; summary?: string; location?: string | null; start_date?: string | null; end_date?: string | null }[],
  max = 6,
): CardPayload {
  return {
    kind: 'kampanye',
    items: rows.slice(0, max).map((r) => ({
      title: String(r.title || ''), summary: String(r.summary || ''),
      location: r.location ?? null, start: r.start_date ?? null, end: r.end_date ?? null,
    })),
  };
}

export function buildInfoCard(hits: { doc?: { title?: string; source?: string } }[], max = 3): CardPayload {
  const seen = new Set<string>();
  const items: { title: string; source: string }[] = [];
  for (const h of hits || []) {
    const t = h?.doc;
    if (!t?.title) continue;
    if (seen.has(t.title)) continue;
    seen.add(t.title);
    items.push({ title: String(t.title), source: String(t.source || '') });
    if (items.length >= max) break;
  }
  return { kind: 'info', items };
}
