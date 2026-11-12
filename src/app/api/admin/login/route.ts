import { checkAdminCredentials, createAdminToken, ADMIN_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Body bukan JSON' }, { status: 400 }); }
  const { username, password } = body ?? {};
  if (!checkAdminCredentials(String(username ?? ''), String(password ?? ''))) {
    return Response.json({ error: 'Username atau password salah.' }, { status: 401 });
  }
  const token = createAdminToken();
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
  return res;
}
