import { isAdmin } from '@/lib/auth';
import { getLlmConfig, saveLlmConfig, publicLlmConfig } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ config: publicLlmConfig(getLlmConfig()) });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const allowed: any = {};
  for (const k of ['enabled', 'provider', 'baseUrl', 'apiKey', 'model', 'temperature', 'maxTokens', 'timeoutMs']) {
    if (body[k] !== undefined) allowed[k] = body[k];
  }
  // apiKey kosong = pertahankan yang lama (kecuali diminta hapus eksplisit)
  if (typeof allowed.apiKey === 'string' && allowed.apiKey.trim() === '') delete allowed.apiKey;
  if (body.clearApiKey === true) allowed.apiKey = '';
  const saved = saveLlmConfig(allowed);
  return Response.json({ ok: true, config: publicLlmConfig(saved) });
}
