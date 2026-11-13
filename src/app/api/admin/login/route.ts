import { checkAdminCredentials, createAdminToken, ADMIN_COOKIE } from '@/lib/auth';
import { RATE_LOGIN_LIMIT, RATE_LOGIN_WINDOW, clearFailures, recordFailure, rateLimitKey, tooManyFailures } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const failKey = rateLimitKey('login', req.headers);
  const gate = tooManyFailures(failKey, RATE_LOGIN_LIMIT, RATE_LOGIN_WINDOW);
  if (gate.blocked) {
    return Response.json(
      { error: `Terlalu banyak percobaan login. Coba lagi dalam ±${Math.ceil(gate.retryAfterSec / 60)} menit.` },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } },
    );
  }
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Body bukan JSON' }, { status: 400 }); }
  const { username, password } = body ?? {};
  if (!checkAdminCredentials(String(username ?? ''), String(password ?? ''))) {
    recordFailure(failKey, RATE_LOGIN_WINDOW);
    return Response.json({ error: 'Username atau password salah.' }, { status: 401 });
  }
  clearFailures(failKey);
  const token = createAdminToken();
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
  return res;
}
