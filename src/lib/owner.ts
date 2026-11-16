// Identitas anonim pengunjung (BUKAN akun/login) untuk mengisolasi percakapan.
// Cookie httpOnly berisi kunci acak; server tidak menyimpan IP, hanya kunci ini.
// Tanpa cookie → pengunjung tidak bisa melihat percakapan siapa pun (termasuk miliknya sendiri).
import crypto from 'node:crypto';

export const OWNER_COOKIE = 'soera_owner';

/** Ambil kunci owner dari header Cookie (atau '' bila belum ada). */
export function ownerKeyFromHeaders(headers: Headers): string {
  const raw = headers.get('cookie') || '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${OWNER_COOKIE}=([A-Za-z0-9_-]{10,64})`));
  return m ? m[1] : '';
}

export function mintOwnerKey(): string {
  return crypto.randomBytes(18).toString('base64url');
}

export function ownerCookieHeader(key: string): string {
  return `${OWNER_COOKIE}=${key}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
}

/** Kunci owner efektif untuk request (pakai yang ada, atau mint baru). */
export function ensureOwnerKey(headers: Headers): { key: string; isNew: boolean } {
  const existing = ownerKeyFromHeaders(headers);
  if (existing) return { key: existing, isNew: false };
  return { key: mintOwnerKey(), isNew: true };
}
