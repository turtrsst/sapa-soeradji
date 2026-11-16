import { getDb } from '@/lib/db';
import { KB_DOCS } from '@/lib/kb';
import { probeEndpoint } from '@/lib/llm';
import { getLlmConfig } from '@/lib/settings';
import { AI_DAILY_LIMIT } from '@/lib/aiUsage';
import { isAdmin } from '@/lib/auth';
import { adminAuthWeaknesses } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbOk = false;
  try { getDb().prepare('SELECT 1').get(); dbOk = true; } catch {}
  const admin = await isAdmin();
  const cfg = getLlmConfig();
  // Probe endpoint hanya untuk admin — publik tidak perlu tahu detail infrastruktur
  const probe = admin && cfg.enabled ? await probeEndpoint(cfg) : null;
  const body: Record<string, unknown> = {
    status: 'ok',
    app: 'SOERA AI',
    service: 'RSUP Dr. Soeradji Tirtonegoro Klaten',
    time: new Date().toISOString(),
    db: dbOk ? 'ok' : 'error',
    offline: { knowledgeBase: 'ok', documents: KB_DOCS.length },
    ai: {
      freeFormDailyLimit: AI_DAILY_LIMIT,
      scope: 'per pengguna (hash IP), reset 00.00 Asia/Jakarta — pertanyaan layanan (template) tidak dibatasi',
      engine: 'Vercel AI SDK + tool-calling agent',
    },
  };
  if (admin) {
    body.llm = {
      enabled: cfg.enabled,
      provider: cfg.provider,
      baseUrl: cfg.baseUrl,
      reachable: probe?.reachable ?? null,
      model: probe?.model ?? cfg.model,
    };
    const weak = adminAuthWeaknesses();
    if (weak.length) body.securityWarnings = weak;
  } else {
    body.llm = { enabled: cfg.enabled };
  }
  return Response.json(body);
}
