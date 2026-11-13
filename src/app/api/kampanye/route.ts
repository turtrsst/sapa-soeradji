import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT id, title, summary, body, tag, location, start_date, end_date FROM campaigns WHERE active = 1 ORDER BY id DESC').all();
  return Response.json({ campaigns: rows });
}
