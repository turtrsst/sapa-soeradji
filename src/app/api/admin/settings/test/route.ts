import { isAdmin } from '@/lib/auth';
import { getLlmConfig } from '@/lib/settings';
import { probeEndpoint } from '@/lib/llm';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch { /* boleh kosong */ }
  const cfg = { ...getLlmConfig(), ...(body?.baseUrl ? { baseUrl: String(body.baseUrl) } : {}), ...(body?.apiKey ? { apiKey: String(body.apiKey) } : {}) };
  const result = await probeEndpoint(cfg);
  return Response.json(result);
}
