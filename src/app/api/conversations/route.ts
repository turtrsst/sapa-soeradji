import { getDb, uid } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.id, c.title, c.pinned, c.created_at, c.updated_at,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
      (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
    FROM conversations c ORDER BY c.pinned DESC, c.updated_at DESC LIMIT 100
  `).all();
  return Response.json({ conversations: rows });
}

export async function POST() {
  const db = getDb();
  const now = Date.now();
  const id = uid();
  db.prepare('INSERT INTO conversations (id, title, pinned, created_at, updated_at) VALUES (?,?,?,?,?)')
    .run(id, 'Percakapan baru', 0, now, now);
  return Response.json({ id, title: 'Percakapan baru' });
}
