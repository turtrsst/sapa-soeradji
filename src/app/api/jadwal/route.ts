import { searchJadwal, POLI_LIST, JADWAL_UPDATE } from '@/lib/jadwal';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const poli = searchParams.get('poli') ?? 'all';
  const hari = searchParams.get('hari') ?? 'all';
  const results = searchJadwal(q, poli, hari);
  return Response.json({ update: JADWAL_UPDATE, poliList: POLI_LIST, count: results.length, results });
}
