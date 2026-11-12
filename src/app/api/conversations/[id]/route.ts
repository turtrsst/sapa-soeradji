import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const conv = db.prepare('SELECT id, title, pinned, created_at, updated_at FROM conversations WHERE id = ?').get(params.id);
  if (!conv) return Response.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });
  const messages = db.prepare('SELECT id, role, content, meta, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(params.id);
  return Response.json({ conversation: conv, messages });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM conversations WHERE id = ?').run(params.id);
  return Response.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const conv = db.prepare('SELECT id FROM conversations WHERE id = ?').get(params.id);
  if (!conv) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 });
  if (typeof body.title === 'string' && body.title.trim()) {
    db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(body.title.trim().slice(0, 120), params.id);
  }
  if (typeof body.pinned === 'boolean') {
    db.prepare('UPDATE conversations SET pinned = ? WHERE id = ?').run(body.pinned ? 1 : 0, params.id);
  }
  return Response.json({ ok: true });
}
