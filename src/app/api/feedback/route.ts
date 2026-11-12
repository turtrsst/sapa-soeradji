import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Body bukan JSON' }, { status: 400 }); }
  const rating = Number(body?.rating);
  if (![1, -1].includes(rating)) return Response.json({ error: 'rating harus 1 atau -1' }, { status: 400 });
  const conversationId = typeof body?.conversationId === 'string' ? body.conversationId.slice(0, 80) : null;
  const messageId = Number.isFinite(Number(body?.messageId)) ? Number(body.messageId) : null;
  const db = getDb();
  db.prepare('INSERT INTO feedback (conversation_id, message_id, rating, created_at) VALUES (?,?,?,?)')
    .run(conversationId, messageId, rating, Date.now());
  return Response.json({ ok: true });
}
