// Kuota "pertanyaan bebas AI" (free-form) untuk pengguna publik — dibatasi per hari,
// reset otomatis 00.00 WIB (Asia/Jakarta, UTC+7). Pertanyaan layanan (template:
// jadwal dokter, tarif, home care, kampanye, pendaftaran, dll.) TIDAK dikenakan kuota.
// Identitas pengguna di-hash (SHA-256) — IP asli tidak disimpan.
import crypto from 'node:crypto';
import { getDb } from './db';

export const AI_DAILY_LIMIT = Math.max(1, Number(process.env.SOERA_AI_DAILY_LIMIT ?? 5) || 5);

/** Kunci tanggal di zona Asia/Jakarta (UTC+7) — kuota direset setiap 00.00 WIB. */
export function dayKeyJakarta(d: Date = new Date()): string {
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export function quotaRemaining(used: number, max: number = AI_DAILY_LIMIT): number {
  return Math.max(0, max - Math.max(0, used));
}

/** Subjek kuota anonim: hash dari IP (x-forwarded-for / x-real-ip). */
export function aiSubject(headers: Headers): string {
  const xf = headers.get('x-forwarded-for');
  const ip = xf ? xf.split(',')[0].trim() : (headers.get('x-real-ip') || headers.get('cf-connecting-ip') || '127.0.0.1');
  return crypto.createHash('sha256').update(`soera:${ip}`).digest('hex').slice(0, 32);
}

export interface QuotaState {
  ok: boolean;
  day: string;
  used: number;
  max: number;
  remaining: number;
}

function readUsed(subject: string, day: string): number {
  const db = getDb();
  const row = db.prepare('SELECT used FROM ai_usage WHERE subject = ? AND day = ?').get(subject, day) as { used: number } | undefined;
  return row?.used ?? 0;
}

export function peekAiQuota(subject: string): QuotaState {
  const day = dayKeyJakarta();
  const used = readUsed(subject, day);
  return { ok: used < AI_DAILY_LIMIT, day, used, max: AI_DAILY_LIMIT, remaining: quotaRemaining(used, AI_DAILY_LIMIT) };
}

/** Konsumsi 1 kuota. Mengembalikan ok=false (tanpa mengubah DB) bila kuota hari ini habis. */
export function consumeAiQuota(subject: string): QuotaState {
  const db = getDb();
  const day = dayKeyJakarta();
  const now = Date.now();
  const used = readUsed(subject, day);
  if (used >= AI_DAILY_LIMIT) {
    return { ok: false, day, used, max: AI_DAILY_LIMIT, remaining: 0 };
  }
  db.prepare(
    `INSERT INTO ai_usage (subject, day, used, updated_at) VALUES (?,?,1,?)
     ON CONFLICT(subject, day) DO UPDATE SET used = used + 1, updated_at = excluded.updated_at`
  ).run(subject, day, now);
  const newUsed = used + 1;
  return { ok: true, day, used: newUsed, max: AI_DAILY_LIMIT, remaining: quotaRemaining(newUsed, AI_DAILY_LIMIT) };
}

/** Kembalikan 1 kuota (dipakai bila agen AI gagal SEBELUM mengeluarkan token). */
export function refundAiQuota(subject: string): void {
  const db = getDb();
  const day = dayKeyJakarta();
  db.prepare('UPDATE ai_usage SET used = MAX(0, used - 1), updated_at = ? WHERE subject = ? AND day = ?')
    .run(Date.now(), subject, day);
}
