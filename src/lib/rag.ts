// Offline-first retrieval & intent detection (tanpa dependensi eksternal).
import { KB_DOCS, type KbDoc } from './kb';
import { searchJadwal, type JadwalDokter } from './jadwal';
import { searchTarif, formatRp, type TarifItem } from './tarif';

const STOPWORDS = new Set(('yang dan di ke dari untuk dengan pada adalah ini itu atau juga saya anda kamu kita kami dia mereka dalam akan sudah telah bisa dapat harus ada tidak tidak apa siapa kapan dimana bagaimana berapa saja suatu para karena agar serta bahwa oleh kepada saat ketika setelah sebelum antara melalui sehingga perlu mau ingin sedang masih belum belum').split(/\s+/));

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export interface RetrievalHit {
  doc: KbDoc;
  score: number;
  snippet: string;
}

function scoreDoc(doc: KbDoc, queryTokens: string[], rawQuery: string): number {
  const body = doc.body.toLowerCase();
  const title = doc.title.toLowerCase();
  const tags = doc.tags.join(' ').toLowerCase();
  let score = 0;
  for (const t of queryTokens) {
    if (tags.includes(t)) score += 6;
    if (title.includes(t)) score += 4;
    // frekuensi di body (cap)
    let idx = 0, count = 0;
    while (count < 5) {
      idx = body.indexOf(t, idx);
      if (idx === -1) break;
      count++; idx += t.length;
    }
    score += count * 1.5;
  }
  // frasa penuh di body/tag bernilai lebih
  const q = rawQuery.trim().toLowerCase();
  if (q.length >= 6) {
    if (tags.includes(q)) score += 10;
    if (body.includes(q)) score += 5;
  }
  return score;
}

function makeSnippet(doc: KbDoc, queryTokens: string[]): string {
  const sentences = doc.body.split(/(?<=[.!?\n])\s+|\n+/).filter((s) => s.trim().length > 30);
  let best = sentences[0] || doc.body.slice(0, 260);
  let bestScore = -1;
  for (const s of sentences) {
    const ls = s.toLowerCase();
    let sc = 0;
    for (const t of queryTokens) if (ls.includes(t)) sc++;
    if (sc > bestScore) { bestScore = sc; best = s; }
  }
  const clean = best.replace(/\s+/g, ' ').trim();
  return clean.length > 320 ? clean.slice(0, 317) + '…' : clean;
}

export function retrieve(query: string, topK = 5): RetrievalHit[] {
  const raw = query.trim();
  if (!raw) return [];
  const tokens = tokenize(raw);
  if (!tokens.length) return [];
  const hits = KB_DOCS
    .map((doc) => ({ doc, score: scoreDoc(doc, tokens, raw), snippet: '' }))
    .filter((h) => h.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((h) => ({ ...h, snippet: makeSnippet(h.doc, tokens) }));
  return hits;
}

export type Intent =
  | 'darurat' | 'jadwal' | 'tarif' | 'homecare' | 'keluhan' | 'kampanye'
  | 'daftar' | 'kontak' | 'profil' | 'sapaan' | 'vitally_unknown';

const GREET_WORDS = new Set([
  'halo', 'hai', 'hei', 'hallo', 'alo', 'hey', 'p', 'hallo-world',
  'pagi', 'siang', 'sore', 'malam', 'selamat', 'sugeng', 'monggo', 'kulonuwun',
  'permisi', 'salam', 'assalamualaikum', 'alaikum', 'assalamu',
]);

/** Sapaan murni (<= 6 kata, semua kata adalah sapaan) — mis. "halo", "halo selamat pagi", "monggo". */
export function isGreeting(message: string): boolean {
  const words = message.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return words.length > 0 && words.length <= 6 && words.every((w) => GREET_WORDS.has(w));
}

export function detectIntent(message: string): Intent {
  const m = message.toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => m.includes(w));
  if (isGreeting(m)) return 'sapaan';
  if (has('gawat darurat', 'darurat', 'igd', 'sesak napas', 'nyeri dada', 'stroke', 'kejang', 'kecelakaan', 'pingsan', 'henti jantung', 'perdarahan hebat', 'pendarahan hebat', 'bunuh diri', '119')) return 'darurat';
  if (has('keluhan', 'komplain', 'pengaduan', 'lapor', 'kecewa', 'antrian lama', 'petugas tidak', 'kurang puas', 'kritik', 'saran', 'kotak saran')) return 'keluhan';
  if (has('home care', 'homecare', 'go-trah', 'gotrah', 'kunjungan rumah', 'rawat di rumah', 'visite ke rumah')) return 'homecare';
  if (has('kontak', 'nomor', 'telepon', 'telpon', 'alamat', 'lokasi', 'maps', 'jam buka', 'jam besuk', 'fax', 'email', 'hotline', 'call center')) return 'kontak';
  if (has('jadwal', 'praktek', 'praktik', 'poli ', 'dokter', 'spesialis', 'jam praktik', 'jam poli')) return 'jadwal';
  if (has('tarif', 'biaya', 'harga', 'berapa', 'bayar', 'jasa sarana', 'jasa pelayanan', 'mahal')) return 'tarif';
  if (has('kampanye', 'promosi kesehatan', 'imunisasi', 'skrining', 'screening', 'penyuluhan', 'cerdik', 'germas', 'bakti sosial', 'khitanan', 'speling', 'berhenti merokok', 'kegiatan rs')) return 'kampanye';
  if (has('daftar', 'pendaftaran', 'registrasi', 'antrian online', 'booking', 'perjanjian', 'check in', 'check-in')) return 'daftar';
  if (has('profil', 'sejarah', 'tentang', 'visi', 'misi', 'akreditasi', 'kelas a')) return 'profil';
  return 'vitally_unknown';
}

const DAY_WORDS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
const isDayWord = (w: string) => DAY_WORDS.some((d) => w.startsWith(d));

export function matchJadwal(message: string, limit = 6): JadwalDokter[] {
  const m = message.toLowerCase();
  // coba ambil kata setelah "dokter" atau nama poli
  const stop = new Set(['jadwal', 'dokter', 'poli', 'praktik', 'praktek', 'jam', 'kapan', 'di', 'rst', 'rsup', 'soeradji', 'tirtonegoro', 'klaten', 'hari', 'ini', 'tolong', 'carikan', 'siapa', 'yang']);
  const words = tokenize(m).filter((w) => !stop.has(w));
  if (!words.length) return [];
  const scored = searchJadwal(words.join(' '));
  // Prioritaskan baris yang cocok dengan kata NON-hari (mis. "jantung") — hari hanya mempersempit.
  // Hindari baris "Selasa saja" ikut karena cocok kata hari, padahal tidak relevan dengan spesialisasi.
  const nonDay = words.filter((w) => !isDayWord(w));
  if (nonDay.length) {
    const relevant = scored.filter((r) => {
      const hay = `${r.poli} ${r.dokter} ${r.spesialis}`.toLowerCase();
      return nonDay.some((w) => hay.includes(w));
    });
    if (relevant.length) return relevant.slice(0, limit);
  }
  return scored.slice(0, limit);
}

export function matchTarif(message: string, limit = 8): (TarifItem & { section: string })[] {
  const stop = new Set(['tarif', 'biaya', 'harga', 'berapa', 'bayar', 'home', 'care', 'homecare', 'rst', 'rsup', 'soeradji', 'tolong', 'carikan', 'daftar', 'list', 'cek']);
  const words = tokenize(message).filter((w) => !stop.has(w));
  if (!words.length) return [];
  return searchTarif(words.join(' ')).slice(0, limit);
}

export function formatJadwalLines(rows: JadwalDokter[]): string {
  return rows.map((j) => `- **${j.dokter}** — ${j.poli}: ${j.hari}, ${j.jam}${j.catatan ? ` (${j.catatan})` : ''}`).join('\n');
}

export function formatTarifLines(rows: (TarifItem & { section: string })[]): string {
  return rows.map((t) => `- ${t.nama}: **${formatRp(t.jumlah)}** (Jasa Sarana ${formatRp(t.sarana)} + Jasa Pelayanan ${formatRp(t.pelayanan)})${t.ket ? ` — ${t.ket}` : ''} [${t.section}]`).join('\n');
}
