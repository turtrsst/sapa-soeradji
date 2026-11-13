import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const db = getDb();
  const row = db.prepare('SELECT * FROM tickets WHERE id = ? OR ticket_number = ?').get(params.id, params.id) as any;
  if (!row) return Response.json({ error: 'Tiket tidak ditemukan' }, { status: 404 });
  const status = ['baru', 'diproses', 'selesai', 'ditolak'].includes(body?.status) ? body.status : row.status;
  const response = typeof body?.response === 'string' ? body.response.slice(0, 4000) : row.response;
  db.prepare('UPDATE tickets SET status = ?, response = ?, updated_at = ? WHERE id = ?')
    .run(status, response ?? null, Date.now(), row.id);
  return Response.json({ ok: true });
}
