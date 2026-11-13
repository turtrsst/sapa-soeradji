// Rate limiter sederhana (fixed window, in-memory) untuk endpoint publik — cukup untuk
// monolith single-process. Untuk multi-instance, gunakan limit di reverse proxy/CDN
// (Caddy/Nginx/Cloudflare) DAN di aplikasi.
import crypto from 'node:crypto';

interface Bucket { count: number; resetAt: number }

const buckets = new Map<string, Bucket>();

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 24);
}

/** IP klien dari header proxy (x-forwarded-for / x-real-ip / cf-connecting-ip). */
export function clientIp(headers: Headers): string {
  const xf = headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || '127.0.0.1';
}

/** Kunci bucket — di-hash agar Map tidak menyimpan IP mentah. */
export function rateLimitKey(scope: string, headers: Headers): string {
  return `${scope}:${sha256(clientIp(headers))}`;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

function prune(now: number) {
  if (buckets.size <= 10000) return;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

/** Fixed-window rate limit. `now` bisa disuntik untuk pengujian. */
export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateLimitResult {
  prune(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (b.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: b.resetAt, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count += 1;
  return { ok: true, limit, remaining: limit - b.count, resetAt: b.resetAt, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
}

/** Cek apakah sebuah kunci sedang diblokir karena terlalu banyak GAGAL (mis. login). */
export function tooManyFailures(key: string, limit: number, windowMs: number, now: number = Date.now()): { blocked: boolean; retryAfterSec: number } {
  prune(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) return { blocked: false, retryAfterSec: 0 };
  if (b.count >= limit) return { blocked: true, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  return { blocked: false, retryAfterSec: 0 };
}

/** Catat 1 kegagalan (menambah counter window). */
export function recordFailure(key: string, windowMs: number, now: number = Date.now()): void {
  prune(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + windowMs });
  else b.count += 1;
}

/** Hapus catatan kegagalan (dipanggil saat aksi berhasil). */
export function clearFailures(key: string): void {
  buckets.delete(key);
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(r.limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset': String(Math.ceil(r.resetAt / 1000)),
  };
}

// Batas-batas default (bisa dioverride via env)
export const RATE_CHAT_LIMIT = Math.max(1, Number(process.env.SOERA_RATE_CHAT_LIMIT ?? 30) || 30);
export const RATE_CHAT_WINDOW = Math.max(10_000, Number(process.env.SOERA_RATE_CHAT_WINDOW_MS ?? 5 * 60_000) || 5 * 60_000);
export const RATE_LOGIN_LIMIT = Math.max(1, Number(process.env.SOERA_RATE_LOGIN_LIMIT ?? 5) || 5);
export const RATE_LOGIN_WINDOW = Math.max(10_000, Number(process.env.SOERA_RATE_LOGIN_WINDOW_MS ?? 10 * 60_000) || 10 * 60_000);
export const RATE_PUBLIC_POST_LIMIT = Math.max(1, Number(process.env.SOERA_RATE_PUBLIC_POST_LIMIT ?? 10) || 10);
export const RATE_PUBLIC_POST_WINDOW = Math.max(10_000, Number(process.env.SOERA_RATE_PUBLIC_POST_WINDOW_MS ?? 60 * 60_000) || 60 * 60_000);
