// Pool API key + cooldown in-memory — murni (tanpa jaringan), bisa diuji otomatis.
// Urutan = prioritas: key #1 dicoba dulu; bila gagal dengan alasan yang "bisa pindah"
// (auth/kuota/timeout/5xx/jaringan), key berikutnya dicoba dengan cooldown 5 menit.
// 400/404/422 = kesalahan konfigurasi deterministik → JANGAN pindah key.
export const KEY_COOLDOWN_MS = 5 * 60 * 1000;

const cooldowns = new Map<string, number>();

export function keyHint(key?: string | null): string {
  const k = String(key || '').trim();
  return k ? '••••' + k.slice(-4) : '—';
}

export function sanitizeKeyArray(input: unknown, max = 8): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    const k = String(raw ?? '').trim();
    if (!k || k.startsWith('••••')) continue; // jangan pernah menyimpan hint sebagai key
    if (!out.includes(k)) out.push(k);
    if (out.length >= max) break;
  }
  return out;
}

export function isFailoverReason(reason: string): boolean {
  const r = String(reason || '');
  const m = /HTTP\s*(\d{3})/i.exec(r) || /\b(\d{3})\s*(unauthorized|forbidden|payment required|too many)/i.exec(r);
  if (m) {
    const s = Number(m[1]);
    if (s === 400 || s === 404 || s === 422) return false; // deterministik — key lain tidak mengubah apa pun
    return s === 401 || s === 402 || s === 403 || s === 408 || s === 429 || s >= 500;
  }
  if (/abort|timeout|timed.?out|fetch failed|network|ECONN|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|socket|terminated/i.test(r)) return true;
  if (/rate.?limit|quota|unauthor|forbidden|insufficient|payment/i.test(r)) return true;
  if (/invalid api.?key|bad api.?key|api.?key.*(invalid|incorrect|expired|missing|deleted|revoked)|incorrect api key/i.test(r)) return true;
  return false;
}

export function isKeyCoolingDown(key: string, now = Date.now()): boolean {
  const until = cooldowns.get(key);
  return typeof until === 'number' && until > now;
}

export function markKeyCooldown(key: string, now = Date.now(), ms = KEY_COOLDOWN_MS): number {
  const until = now + ms;
  cooldowns.set(key, until);
  return until;
}

/** Hanya untuk pengujian. */
export function clearKeyCooldowns(): void {
  cooldowns.clear();
}
