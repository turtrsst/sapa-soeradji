// Autentikasi admin sederhana (cookie HMAC-signed). Untuk demo/internal;
// ganti ADMIN_USERNAME/ADMIN_PASSWORD via env di produksi.
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'sapa_admin';

function secret(): string {
  return process.env.SAPA_ADMIN_SECRET || 'sapa-pasien-dev-secret-ubah-di-produksi';
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

export function checkAdminCredentials(username: string, password: string): boolean {
  const u = Buffer.from(String(username));
  const p = Buffer.from(String(password));
  const eu = Buffer.from(adminUsername());
  const ep = Buffer.from(adminPassword());
  const okU = u.length === eu.length && crypto.timingSafeEqual(u, eu);
  const okP = p.length === ep.length && crypto.timingSafeEqual(p, ep);
  return okU && okP;
}

export const ADMIN_COOKIE = COOKIE_NAME;
