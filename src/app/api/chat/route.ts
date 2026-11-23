import { getDb, uid } from '@/lib/db';
import { AI_DAILY_LIMIT, aiSubject, consumeAiQuota, refundAiQuota } from '@/lib/aiUsage';
import { RATE_CHAT_LIMIT, RATE_CHAT_WINDOW, rateLimit, rateLimitKey, rateLimitHeaders } from '@/lib/rateLimit';
import { streamAgent } from '@/lib/agent';
import type { CardPayload } from '@/lib/genui';
import { SYSTEM_PROMPT, type ChatMessage } from '@/lib/llm';
import { getLlmConfig } from '@/lib/settings';
import { ensureOwnerKey, ownerCookieHeader } from '@/lib/owner';
import { retrieve, detectIntent } from '@/lib/rag';
import { composeOfflineAnswer } from '@/lib/offline';
import { JADWAL_UPDATE } from '@/lib/jadwal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

export async function POST(req: Request) {
  const rl = rateLimit(rateLimitKey('chat', req.headers), RATE_CHAT_LIMIT, RATE_CHAT_WINDOW);
  if (!rl.ok) {
    return json({ error: `Terlalu banyak permintaan. Coba lagi dalam ±${Math.ceil(rl.retryAfterSec / 60)} menit.` }, 429, { 'Retry-After': String(rl.retryAfterSec), ...rateLimitHeaders(rl) });
  }
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Body bukan JSON' }, 400); }
  const message = String(body?.message ?? '').trim();
  if (!message) return json({ error: 'Pesan kosong' }, 400);
  if (message.length > 4000) return json({ error: 'Pesan terlalu panjang (maks 4000 karakter)' }, 400);

  const { key: owner, isNew: ownerIsNew } = ensureOwnerKey(req.headers);
  const db = getDb();
  const now = Date.now();
  let conversationId: string = String(body?.conversationId ?? '').trim();
  let title = '';
  // Percakapan milik pengunjung LAIN diabaikan → dibuat percakapan baru untuk pengunjung ini
  const existing = conversationId
    ? (db.prepare('SELECT id, title FROM conversations WHERE id = ? AND owner = ?').get(conversationId, owner) as { id: string; title: string } | undefined)
    : undefined;
  if (existing) {
    title = existing.title;
  } else {
    conversationId = uid();
    title = message.replace(/\s+/g, ' ').slice(0, 64) + (message.length > 64 ? '…' : '');
    db.prepare('INSERT INTO conversations (id, title, pinned, created_at, updated_at, owner) VALUES (?,?,?,?,?,?)')
      .run(conversationId, title, 0, now, now, owner);
  }

  db.prepare('INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?,?,?,?)')
    .run(conversationId, 'user', message, now);

  // Konteks retrieval
  const intent = detectIntent(message);
  const hits = retrieve(message, 5);

  const cfg = getLlmConfig();
  const sources = hits.map((h) => ({ title: h.doc.title, source: h.doc.source }));
  const started = Date.now();

  // Pertanyaan BEBAS (intent general) dijawab agen AI — dibatasi 10/pengguna/hari (reset 00.00 WIB).
  // Pertanyaan LAYANAN (jadwal/tarif/home care/pendaftaran/kampanye/dll.) tanpa kuota.
  // Intent 'vitally_unknown' = pertanyaan bebas (di luar template) — dilayani agen AI bila AI aktif
  const isFreeForm = intent === 'vitally_unknown';
  const subject = isFreeForm ? aiSubject(req.headers) : '';
  let quota: { used: number; max: number; remaining: number } | null = null;
  let quotaExhausted = false;
  if (cfg.enabled && isFreeForm) {
    const q = consumeAiQuota(subject);
    quota = { used: q.used, max: q.max, remaining: q.remaining };
    quotaExhausted = !q.ok;
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      send({ type: 'meta', conversationId, title, intent, sources, llmEnabled: cfg.enabled, aiQuota: isFreeForm && cfg.enabled ? quota : undefined });

      let assistantText = '';
      const cards: CardPayload[] = [];
      let mode: 'llm' | 'offline' = 'offline';
      let llmFailedReason = '';

      if (cfg.enabled && !quotaExhausted && isFreeForm) {
        // Agen AI (tool-calling) untuk pertanyaan bebas — Vercel AI SDK + endpoint OpenAI-compatible
        const contextBlock = [
          `=== KONTEKS BASIS PENGETAHUAN RS Soeradji (update ${JADWAL_UPDATE}) ===`,
          ...hits.map((h, i) => `[Dokumen ${i + 1}] ${h.doc.title}\n${h.doc.body.slice(0, 1600)}\n(Sumber: ${h.doc.source})`),
          '=== AKHIR KONTEKS ===',
        ].filter(Boolean).join('\n\n');
        const history = (db.prepare(
          'SELECT role, content FROM messages WHERE conversation_id = ? AND id < (SELECT MAX(id) FROM messages WHERE conversation_id = ?) ORDER BY id DESC LIMIT 10'
        ).all(conversationId, conversationId) as { role: string; content: string }[]).reverse();
        const messages: ChatMessage[] = [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
          ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
          { role: 'user', content: message },
        ];
        const r = await streamAgent({
          message,
          history: messages.slice(1, -1) as { role: 'user' | 'assistant'; content: string }[],
          cfg,
          onToken: (tok) => { assistantText += tok; send({ type: 'token', text: tok }); },
          onReasoning: (t) => { const rt = t.slice(0, 2000); send({ type: 'reasoning', text: rt }); },
          onTool: (evt) => { send({ type: 'tool', phase: evt.phase, tool: evt.tool }); },
          onCard: (card) => { cards.push(card); send({ type: 'card', card }); },
        });
        if (r.ok && assistantText.trim()) {
          mode = 'llm';
        } else {
          llmFailedReason = r.reason || 'agen AI gagal';
          if (!assistantText.trim()) refundAiQuota(subject); // gagal sebelum token pertama → kuota dikembalikan
          assistantText = '';
        }
      }
      // Pertanyaan layanan (intent template): dijawab INSTAN dari basis pengetahuan lokal —
      // tidak memanggil LLM (lebih cepat, deterministik, grounded), tidak memakai kuota AI.

      if (!assistantText.trim()) {
        // Fallback offline (selalu tersedia)
        mode = 'offline';
        const off = composeOfflineAnswer(message);
        assistantText = off.text;
        // kirim per potongan agar terasa streaming
        const chunkSize = 24;
        for (let i = 0; i < assistantText.length; i += chunkSize) {
          send({ type: 'token', text: assistantText.slice(i, i + chunkSize) });
        }
        if (quotaExhausted) {
          const note = `\n\n_⏳ **Kuota pertanyaan AI di luar layanan RS Soeradji Anda hari ini sudah habis** (maks ${AI_DAILY_LIMIT}/hari) — direset pukul **00.00 WIB**. Pertanyaan layanan (jadwal dokter, tarif, pendaftaran, Home Care, kampanye, kontak, keluhan) **tetap bisa dijawab tanpa kuota**. Bantuan langsung: **(0272) 321020** / WhatsApp **0816-9170-00**._`;
          assistantText += note;
          send({ type: 'token', text: note });
        } else if (llmFailedReason) {
          const note = `\n\n_⚠️ AI online/offline-LLM tidak merespons (${llmFailedReason}). Jawaban di atas disusun dari basis pengetahuan lokal._`;
          assistantText += note;
          send({ type: 'token', text: note });
        }
      }

      const latency = Date.now() - started;
      const metaPayload: Record<string, unknown> = { intent, mode, latencyMs: latency, sources };
      if (cards.length) metaPayload.cards = cards;
      const inserted = db.prepare('INSERT INTO messages (conversation_id, role, content, meta, created_at) VALUES (?,?,?,?,?)')
        .run(conversationId, 'assistant', assistantText, JSON.stringify(metaPayload), Date.now());
      db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(Date.now(), conversationId);
      db.prepare('INSERT INTO chat_logs (intent, mode, created_at) VALUES (?,?,?)').run(intent, mode, Date.now());

      send({ type: 'done', messageId: Number(inserted.lastInsertRowid), mode, latencyMs: latency, conversationId, title, aiQuota: isFreeForm && cfg.enabled ? quota : undefined });
      controller.close();
    },
  });

  const sseHeaders: Record<string, string> = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...rateLimitHeaders(rl),
  };
  if (ownerIsNew) sseHeaders['Set-Cookie'] = ownerCookieHeader(owner);
  return new Response(stream, { headers: sseHeaders });
}

function json(obj: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extraHeaders } });
}
