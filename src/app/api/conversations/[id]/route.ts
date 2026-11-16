import { getDb } from '@/lib/db';
import { ownerKeyFromHeaders } from '@/lib/owner';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const owner = ownerKeyFromHeaders(req.headers);
  const db = getDb();
  const conv = owner ? db.prepare('SELECT id, title, pinned, created_at, updated_at FROM conversations WHERE id = ? AND owner = ?').get(paramId, owner) : undefined;
  if (!conv) return Response.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });
  const messages = db.prepare('SELECT id, role, content, meta, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(paramId);
  return Response.json({ conversation: conv, messages });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const owner = ownerKeyFromHeaders(req.headers);
  const db = getDb();
  if (owner) db.prepare('DELETE FROM messages WHERE conversation_id = ? AND conversation_id IN (SELECT id FROM conversations WHERE id = ? AND owner = ?)').run(paramId, paramId, owner);
  if (owner) db.prepare('DELETE FROM conversations WHERE id = ? AND owner = ?').run(paramId, owner);
  return Response.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const db = getDb();
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const owner = ownerKeyFromHeaders(req.headers);
  const conv = owner ? db.prepare('SELECT id FROM conversations WHERE id = ? AND owner = ?').get(paramId, owner) : undefined;
  if (!conv) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 });
  if (typeof body.title === 'string' && body.title.trim()) {
    db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(body.title.trim().slice(0, 120), paramId);
  }
  if (typeof body.pinned === 'boolean') {
    db.prepare('UPDATE conversations SET pinned = ? WHERE id = ?').run(body.pinned ? 1 : 0, paramId);
  }
  return Response.json({ ok: true });
}
