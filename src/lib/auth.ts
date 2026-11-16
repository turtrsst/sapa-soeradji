// Autentikasi admin (cookie HMAC-signed). Produksi: set SOERA_ADMIN_PASSWORD_HASH (bcrypt)
// dan SOERA_ADMIN_SECRET. Fallback: ADMIN_PASSWORD plain (timing-safe compare) + default admin123.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'soera_admin';

function secret(): string {
  return process.env.SOERA_ADMIN_SECRET || process.env.SAPA_ADMIN_SECRET || 'soera-ai-dev-secret-ubah-di-produksi';
}
export function adminUsername(): string { return process.env.ADMIN_USERNAME || 'admin'; }
export function adminPassword(): string { return process.env.ADMIN_PASSWORD || 'admin123'; }

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createAdminToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 12; // 12 jam
  const payload = `admin.${exp}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [b64, mac] = token.split('.');
  if (!b64 || !mac) return false;
  const payload = Buffer.from(b64, 'base64url').toString('utf8');
  const expected = sign(payload);
  const a = Buffer.from(mac); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(payload.split('.')[1]);
  return Number.isFinite(exp) && Date.now() < exp;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(COOKIE_NAME)?.value);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a); const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const okU = safeEqual(String(username), adminUsername());
  const hash = process.env.SOERA_ADMIN_PASSWORD_HASH;
  if (hash) return okU && bcrypt.compareSync(String(password), hash);
  return okU && safeEqual(String(password), adminPassword());
}

/** Daftar kelemahan kredensial yang terdeteksi (untuk peringatan startup & panel admin). */
export function adminAuthWeaknesses(): string[] {
  const issues: string[] = [];
  if (!process.env.SOERA_ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    issues.push('password admin masih default (admin123) — set SOERA_ADMIN_PASSWORD_HASH (bcrypt) atau ADMIN_PASSWORD');
  }
  if (!process.env.SOERA_ADMIN_SECRET && !process.env.SAPA_ADMIN_SECRET) {
    issues.push('secret cookie admin masih bawaan — set SOERA_ADMIN_SECRET (string acak panjang)');
  }
  return issues;
}

export const ADMIN_COOKIE = COOKIE_NAME;
