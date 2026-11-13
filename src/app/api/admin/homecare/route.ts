import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const rows = db.prepare('SELECT * FROM homecare_requests ORDER BY created_at DESC LIMIT 500').all();
  return Response.json({ requests: rows });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const id = String(body?.id ?? '');
  const status = ['baru', 'dijadwalkan', 'selesai', 'batal'].includes(body?.status) ? body.status : null;
  if (!id || !status) return Response.json({ error: 'id & status wajib' }, { status: 400 });
  const db = getDb();
  db.prepare('UPDATE homecare_requests SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), id);
  return Response.json({ ok: true });
}
