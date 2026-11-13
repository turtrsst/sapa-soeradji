import { searchTarif, TARIF_META, TARIF_SECTIONS } from '@/lib/tarif';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const results = searchTarif(q);
  return Response.json({ meta: TARIF_META, sections: TARIF_SECTIONS.map(s => ({ id: s.id, judul: s.judul, count: s.items.length })), count: results.length, results });
}
