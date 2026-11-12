import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const rows = db.prepare('SELECT * FROM campaigns ORDER BY id DESC').all();
  return Response.json({ campaigns: rows });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const title = String(body?.title ?? '').trim();
  const summary = String(body?.summary ?? '').trim();
  const bodyText = String(body?.body ?? '').trim();
  if (title.length < 4 || summary.length < 4 || bodyText.length < 10) {
    return Response.json({ error: 'Judul & ringkasan min 4 karakter, isi kampanye min 10 karakter.' }, { status: 400 });
  }
  const db = getDb();
  db.prepare('INSERT INTO campaigns (title, summary, body, tag, location, start_date, end_date, active, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(title.slice(0, 200), summary.slice(0, 400), bodyText.slice(0, 4000),
      String(body?.tag ?? 'Promosi Kesehatan').slice(0, 80),
      body?.location ? String(body.location).slice(0, 200) : null,
      body?.start_date || null, body?.end_date || null, 1, Date.now());
  return Response.json({ ok: true });
}
