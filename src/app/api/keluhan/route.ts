import { getDb, uid } from '@/lib/db';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

import { KELUHAN_KATEGORI as KATEGORI } from '@/lib/keluhan-constants';

function ticketNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SKT-${ymd}-${rand}`;
}

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Body bukan JSON' }, { status: 400 }); }
  const name = String(body?.name ?? '').trim();
  const phone = String(body?.phone ?? '').trim();
  const category = String(body?.category ?? '').trim();
  const subject = String(body?.subject ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const priority = ['rendah', 'normal', 'tinggi'].includes(body?.priority) ? body.priority : 'normal';
  if (name.length < 2 || phone.length < 6 || !category || subject.length < 4 || description.length < 10) {
    return Response.json({ error: 'Mohon lengkapi: nama, No. HP/WA, kategori, subjek (min 4 karakter), deskripsi (min 10 karakter).' }, { status: 400 });
  }
  if (!KATEGORI.includes(category)) return Response.json({ error: 'Kategori tidak valid' }, { status: 400 });

  const db = getDb();
  const now = Date.now();
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = ticketNumber();
    try {
      db.prepare('INSERT INTO tickets (id, ticket_number, name, phone, category, subject, description, priority, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
        .run(uid(), number, name.slice(0, 120), phone.slice(0, 40), category, subject.slice(0, 200), description.slice(0, 4000), priority, 'baru', now, now);
      return Response.json({ ok: true, ticketNumber: number, message: 'Tiket pengaduan Anda tercatat. Simpan nomor tiket untuk melacak status.' });
    } catch { /* tabrakan nomor, coba lagi */ }
  }
  return Response.json({ error: 'Gagal membuat tiket, coba lagi.' }, { status: 500 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = (searchParams.get('ticket') ?? '').trim().toUpperCase();
  const phone = (searchParams.get('phone') ?? '').trim();
  if (!number || !phone) return Response.json({ error: 'Parameter ticket & phone wajib diisi' }, { status: 400 });
  const db = getDb();
  const row = db.prepare('SELECT ticket_number, category, subject, description, priority, status, response, created_at, updated_at FROM tickets WHERE ticket_number = ? AND phone = ?').get(number, phone) as any;
  if (!row) return Response.json({ found: false, message: 'Tiket tidak ditemukan. Periksa kembali nomor tiket dan No. HP/WA yang digunakan saat melapor.' }, { status: 404 });
  return Response.json({ found: true, ticket: row });
}

