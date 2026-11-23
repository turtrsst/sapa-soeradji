import { isAdmin } from '@/lib/auth';
import { getLlmConfig } from '@/lib/settings';
import { sanitizeKeyArray } from '@/lib/keyPool';
import { probeEndpoint } from '@/lib/llm';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch { /* boleh kosong */ }
  // Uji bisa memakai: pool tersimpan, atau pool tersimpan + key baru (apiKeysToAdd) yang belum disimpan.
  const extra = Array.isArray(body?.apiKeysToAdd) ? sanitizeKeyArray(body.apiKeysToAdd) : [];
  const cfg = {
    ...getLlmConfig(),
    ...(body?.baseUrl ? { baseUrl: String(body.baseUrl) } : {}),
    ...(body?.model ? { model: String(body.model) } : {}),
    ...(body?.timeoutMs ? { timeoutMs: Number(body.timeoutMs) || undefined } : {}),
    ...(extra.length ? { apiKeys: sanitizeKeyArray([...(getLlmConfig().apiKeys || []), ...extra]) } : {}),
  };
  const result = await probeEndpoint(cfg);
  return Response.json(result);
}
