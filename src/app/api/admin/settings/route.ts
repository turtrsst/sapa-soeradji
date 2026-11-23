import { isAdmin } from '@/lib/auth';
import { getLlmConfig, saveLlmConfig, publicLlmConfig } from '@/lib/settings';
import { sanitizeKeyArray } from '@/lib/keyPool';

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
  for (const k of ['enabled', 'provider', 'baseUrl', 'model', 'temperature', 'maxTokens', 'timeoutMs', 'thinkingEffort']) {
    if (body[k] !== undefined) allowed[k] = body[k];
  }
  // ===== Pool API key: operasi yang dikirim klien admin → diterapkan di server =====
  // Klien TIDAK PERNAH menerima key mentah (hanya hint), jadi penghapusan memakai index.
  const current = getLlmConfig();
  let pool = [...current.apiKeys];
  const toAdd: string[] = [];
  if (Array.isArray(body.apiKeysToAdd)) for (const k of body.apiKeysToAdd) if (typeof k === 'string' && k.trim()) toAdd.push(k.trim());
  // Back-compat: field apiKey tunggal dari UI lama → ditambahkan ke pool (bukan mengganti)
  if (typeof body.apiKey === 'string' && body.apiKey.trim() && !body.apiKey.trim().startsWith('••••')) toAdd.push(body.apiKey.trim());
  if (toAdd.length) pool = sanitizeKeyArray([...pool, ...toAdd]);
  if (Array.isArray(body.apiKeyIndexesToRemove)) {
    const rm = new Set(body.apiKeyIndexesToRemove.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 0));
    if (rm.size) pool = pool.filter((_, i) => !rm.has(i));
  }
  if (body.clearApiKey === true || body.clearApiKeys === true) pool = [];
  allowed.apiKeys = pool;
  const saved = saveLlmConfig(allowed);
  return Response.json({ ok: true, config: publicLlmConfig(saved) });
}
