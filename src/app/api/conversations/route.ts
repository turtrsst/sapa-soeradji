import { getDb, uid } from '@/lib/db';
import { ensureOwnerKey, ownerCookieHeader, ownerKeyFromHeaders } from '@/lib/owner';
import { RATE_PUBLIC_POST_LIMIT, RATE_PUBLIC_POST_WINDOW, rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const owner = ownerKeyFromHeaders(req.headers);
  if (!owner) return Response.json({ conversations: [] }); // tanpa cookie identitas → tidak lihat apa pun
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.id, c.title, c.pinned, c.created_at, c.updated_at,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
      (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
    FROM conversations c WHERE c.owner = ? ORDER BY c.pinned DESC, c.updated_at DESC LIMIT 100
  `).all(owner);
  return Response.json({ conversations: rows });
}

export async function POST(req: Request) {
  const rl = rateLimit(rateLimitKey('conv', req.headers), RATE_PUBLIC_POST_LIMIT, RATE_PUBLIC_POST_WINDOW);
  if (!rl.ok) return Response.json({ error: 'Terlalu banyak percakapan dibuat. Coba lagi nanti.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } });
  const { key: owner, isNew } = ensureOwnerKey(req.headers);
  const db = getDb();
  const now = Date.now();
  const id = uid();
  db.prepare('INSERT INTO conversations (id, title, pinned, created_at, updated_at, owner) VALUES (?,?,?,?,?,?)')
    .run(id, 'Percakapan baru', 0, now, now, owner);
  const res = Response.json({ id, title: 'Percakapan baru' });
  if (isNew) res.headers.set('Set-Cookie', ownerCookieHeader(owner));
  return res;
}
