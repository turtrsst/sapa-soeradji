import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const db = getDb();
  const rows = status && status !== 'all'
    ? db.prepare('SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC LIMIT 500').all(status)
    : db.prepare('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 500').all();
  return Response.json({ tickets: rows });
}
