import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const db = getDb();
  const id = Number(params.id);
  const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as any;
  if (!row) return Response.json({ error: 'Kampanye tidak ditemukan' }, { status: 404 });
  if (typeof body.active === 'boolean' || body.active === 0 || body.active === 1) {
    db.prepare('UPDATE campaigns SET active = ? WHERE id = ?').run(body.active ? 1 : 0, id);
    return Response.json({ ok: true });
  }
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : row.title;
  const summary = typeof body.summary === 'string' && body.summary.trim() ? body.summary.trim().slice(0, 400) : row.summary;
  const bodyText = typeof body.body === 'string' && body.body.trim() ? body.body.trim().slice(0, 4000) : row.body;
  const tag = typeof body.tag === 'string' ? body.tag.slice(0, 80) : row.tag;
  const location = typeof body.location === 'string' ? body.location.slice(0, 200) : row.location;
  db.prepare('UPDATE campaigns SET title = ?, summary = ?, body = ?, tag = ?, location = ?, start_date = ?, end_date = ? WHERE id = ?')
    .run(title, summary, bodyText, tag, location, body.start_date ?? row.start_date, body.end_date ?? row.end_date, id);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(Number(params.id));
  return Response.json({ ok: true });
}
