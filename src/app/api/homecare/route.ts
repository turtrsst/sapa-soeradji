import { getDb, uid } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Body bukan JSON' }, { status: 400 }); }
  const name = String(body?.name ?? '').trim();
  const phone = String(body?.phone ?? '').trim();
  const address = String(body?.address ?? '').trim();
  const service = String(body?.service ?? '').trim();
  const schedule = String(body?.schedule ?? '').trim();
  const notes = String(body?.notes ?? '').trim();
  if (name.length < 2 || phone.length < 6 || address.length < 6 || !service) {
    return Response.json({ error: 'Mohon lengkapi nama, No. HP/WA, alamat, dan jenis layanan.' }, { status: 400 });
  }
  const db = getDb();
  const now = Date.now();
  const id = uid();
  db.prepare('INSERT INTO homecare_requests (id, name, phone, address, service, schedule, notes, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, name.slice(0, 120), phone.slice(0, 40), address.slice(0, 500), service.slice(0, 200), schedule.slice(0, 120), notes.slice(0, 2000), 'baru', now, now);
  return Response.json({ ok: true, id, message: 'Permintaan Home Care tercatat. Petugas RST akan segera menghubungi Anda untuk penjadwalan.' });
}
