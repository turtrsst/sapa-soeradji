// Layer database SQLite (node:sqlite bawaan Node >= 22.5). Tanpa dependensi native.
// File database: data/sapa-pasien.sqlite (di-gitignore).
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  const dir = process.env.SAPA_DATA_DIR || path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'soera-ai.sqlite');
  _db = new DatabaseSync(file);
  _db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  migrate(_db);
  return _db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    meta TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'baru',
    response TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'Promosi Kesehatan',
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS homecare_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    service TEXT NOT NULL,
    schedule TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'baru',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intent TEXT,
    mode TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT,
    message_id INTEGER,
    rating INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_usage (
    subject TEXT NOT NULL,
    day TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (subject, day)
  );
  `);
  seedDefaults(db);
}

function seedDefaults(db: DatabaseSync) {
  const now = Date.now();
  const c = db.prepare('SELECT COUNT(*) as n FROM campaigns').get() as { n: number };
  if (c.n === 0) {
    const ins = db.prepare('INSERT INTO campaigns (title, summary, body, tag, location, start_date, end_date, active, created_at) VALUES (?,?,?,?,?,?,?,?,?)');
    const seeds: [string, string, string, string, string | null, string | null, string | null][] = [
      ['Bakti Sosial & Khitanan Massal RST 2026', '99 anak turut serta pada bakti sosial dan khitanan massal RSUP Dr. Soeradji Tirtonegoro.', 'RSUP Dr. Soeradji Tirtonegoro menggelar Bakti Sosial dan Khitanan Massal yang diikuti 99 anak dari berbagai kecamatan di Kabupaten Klaten. Kegiatan meliputi pemeriksaan kesehatan pra-khitan, tindakan khitanan, dan edukasi kesehatan pasca tindakan. Pantau kanal resmi RST untuk kegiatan berikutnya atau hubungi (0272) 321020 untuk informasi pendaftaran.', 'Bakti Sosial', 'RSUP Dr. Soeradji Tirtonegoro Klaten', '2026-11-09', null],
      ['SPELING — Spesialis Keliling ke Kecamatan', 'Dokter spesialis RST turun langsung melayani masyarakat di kecamatan, dimulai dari Gantiwarno (110 pasien terlayani).', 'SPELING (Spesialis Keliling) membawa layanan dokter spesialis RST ke kecamatan-kecamatan Kabupaten Klaten: konsultasi dokter spesialis, pemeriksaan dasar, dan edukasi kesehatan, bekerja sama dengan puskesmas setempat. Jadwal diumumkan lewat kanal resmi RST dan puskesmas; konfirmasi ke (0272) 321020.', 'SPELING', 'Kecamatan Gantiwarno & kecamatan lain di Klaten', null, null],
      ['CERDIK — Cek Kesehatan Berkala', 'Ajak keluarga menerapkan CERDIK: Cek kesehatan, Enyahkan asap rokok, Rajin olahraga, Diet seimbang, Istirahat cukup, Kelola stres.', 'Penyakit tidak menular (hipertensi, diabetes, stroke, jantung koroner) adalah penyebab kematian utama di Indonesia. RST mengajak masyarakat rutin memeriksakan tekanan darah, gula darah, kolesterol, dan IMT — minimal 1 kali setahun. Layanan skrining tersedia di MCU RST dan pada kegiatan SPELING/bakti sosial.', 'Promosi Kesehatan', 'Seluruh wilayah Klaten', null, null],
      ['Berhenti Merokok — Konsultasi di RST', 'Klinik berhenti merokok membantu Anda lepas dari ketergantungan nikotin dengan pendampingan dokter.', 'Rokok meningkatkan risiko PPOK, kanker paru, dan penyakit jantung. RST menyediakan konsultasi berhenti merokok (terapi perilaku + farmakoterapi bila perlu). Tanyakan di poli Penyakit Dalam/Paru atau hubungi (0272) 321020.', 'Promosi Kesehatan', 'RSUP Dr. Soeradji Tirtonegoro Klaten', null, null],
      ['STOP GRATIFIKASI — Layanan RST Tanpa Imbalan', 'Jangan beri dan jangan terima gratifikasi. Layanan RST transparan tanpa pungutan liar.', 'RST berkomitmen pada integritas: tidak ada biaya di luar tarif resmi. Minta kuitansi setiap pembayaran. Laporkan indikasi gratifikasi/pungli ke hotline pengaduan 0851-7957-7302 atau (0272) 321020.', 'Integritas', 'RSUP Dr. Soeradji Tirtonegoro Klaten', null, null],
      ['Deteksi Dini TB di TB DOTS RST', 'Batuk > 2 minggu? Periksa dahak GRATIS di poli TB DOTS RST.', 'Tuberkulosis masih menjadi masalah kesehatan nasional. Gejala: batuk lebih dari 2 minggu, demam hilang timbul, keringat malam, berat badan turun. Obat TB GRATIS di program nasional (DOTS). Periksa ke poli Paru/TB DOTS RST — dr. Zakiah Novianti, Sp.P (Selasa & Jumat 09.00–13.00).', 'Promosi Kesehatan', 'Poli Paru / TB DOTS RST', null, null],
    ];
    for (const s of seeds) ins.run(...s, 1, now);
  }
  const s = db.prepare('SELECT COUNT(*) as n FROM settings').get() as { n: number };
  if (s.n === 0) {
    const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    ins.run('llm_config', JSON.stringify({
      enabled: false,
      provider: 'PrivateLM (cross-platform-llm-client) API Server — Mode Offline',
      baseUrl: 'http://localhost:8080/v1',
      apiKey: '',
      model: 'model-lokal-privatelm',
      temperature: 0.4,
      maxTokens: 900,
      timeoutMs: 60000,
    }));
  }
}

export function uid(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
