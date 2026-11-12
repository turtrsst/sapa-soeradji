import { getDb } from '@/lib/db';
import { probeEndpoint } from '@/lib/llm';
import { getLlmConfig } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbOk = false;
  try { getDb().prepare('SELECT 1').get(); dbOk = true; } catch {}
  const cfg = getLlmConfig();
  const probe = cfg.enabled ? await probeEndpoint(cfg) : null;
  return Response.json({
    status: 'ok',
    app: 'SAPA PASIEN',
    service: 'RSUP Dr. Soeradji Tirtonegoro Klaten',
    time: new Date().toISOString(),
    db: dbOk ? 'ok' : 'error',
    offline: { knowledgeBase: 'ok', documents: 19 },
    llm: {
      enabled: cfg.enabled,
      provider: cfg.provider,
      baseUrl: cfg.baseUrl,
      reachable: probe?.reachable ?? null,
      model: probe?.model ?? cfg.model,
    },
  });
}
