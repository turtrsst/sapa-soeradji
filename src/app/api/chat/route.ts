import { getDb, uid } from '@/lib/db';
import { SYSTEM_PROMPT, streamLlm, type ChatMessage } from '@/lib/llm';
import { getLlmConfig } from '@/lib/settings';
import { retrieve, detectIntent, matchJadwal, matchTarif, formatJadwalLines, formatTarifLines } from '@/lib/rag';
import { composeOfflineAnswer } from '@/lib/offline';
import { TARIF_META } from '@/lib/tarif';
import { JADWAL_UPDATE } from '@/lib/jadwal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Body bukan JSON' }, 400); }
  const message = String(body?.message ?? '').trim();
  if (!message) return json({ error: 'Pesan kosong' }, 400);
  if (message.length > 4000) return json({ error: 'Pesan terlalu panjang (maks 4000 karakter)' }, 400);

  const db = getDb();
  const now = Date.now();
  let conversationId: string = String(body?.conversationId ?? '').trim();
  let title = '';
  const existing = conversationId
    ? (db.prepare('SELECT id, title FROM conversations WHERE id = ?').get(conversationId) as { id: string; title: string } | undefined)
    : undefined;
  if (existing) {
    title = existing.title;
  } else {
    conversationId = uid();
    title = message.replace(/\s+/g, ' ').slice(0, 64) + (message.length > 64 ? '…' : '');
    db.prepare('INSERT INTO conversations (id, title, pinned, created_at, updated_at) VALUES (?,?,?,?,?)')
      .run(conversationId, title, 0, now, now);
  }

  db.prepare('INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?,?,?,?)')
    .run(conversationId, 'user', message, now);

  // Konteks retrieval
  const intent = detectIntent(message);
  const hits = retrieve(message, 5);
  const jadwalRows = intent === 'jadwal' ? matchJadwal(message, 8) : [];
  const tarifRows = intent === 'tarif' || intent === 'homecare' ? matchTarif(message, 12) : [];
  const contextBlock = [
    `=== KONTEKS BASIS PENGETAHUAN RST (update ${JADWAL_UPDATE}) ===`,
    ...hits.map((h, i) => `[Dokumen ${i + 1}] ${h.doc.title}\n${h.doc.body.slice(0, 1600)}\n(Sumber: ${h.doc.source})`),
    jadwalRows.length ? `=== DATA JADWAL DOKTER (update ${JADWAL_UPDATE}, dapat berubah) ===\n${formatJadwalLines(jadwalRows)}` : '',
    tarifRows.length ? `=== DATA TARIF (${TARIF_META.nomor}, ${TARIF_META.tanggal}) ===\n${formatTarifLines(tarifRows)}\n${TARIF_META.catatan}` : '',
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

  const cfg = getLlmConfig();
  const sources = hits.map((h) => ({ title: h.doc.title, source: h.doc.source }));
  const started = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      send({ type: 'meta', conversationId, title, intent, sources, llmEnabled: cfg.enabled });

      let assistantText = '';
      let mode: 'llm' | 'offline' = 'offline';
      let llmFailedReason = '';

      if (cfg.enabled) {
        const result = await streamLlm(messages, (tok) => {
          assistantText += tok;
          send({ type: 'token', text: tok });
        }, cfg);
        if (result.ok && assistantText.trim()) {
          mode = 'llm';
        } else {
          llmFailedReason = result.reason || 'LLM gagal';
          assistantText = '';
        }
      }

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
        if (llmFailedReason) {
          const note = `\n\n_⚠️ AI online/offline-LLM tidak merespons (${llmFailedReason}). Jawaban di atas disusun dari basis pengetahuan lokal._`;
          assistantText += note;
          send({ type: 'token', text: note });
        }
      }

      const latency = Date.now() - started;
      const inserted = db.prepare('INSERT INTO messages (conversation_id, role, content, meta, created_at) VALUES (?,?,?,?,?)')
        .run(conversationId, 'assistant', assistantText, JSON.stringify({ intent, mode, latencyMs: latency, sources }), Date.now());
      db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(Date.now(), conversationId);
      db.prepare('INSERT INTO chat_logs (intent, mode, created_at) VALUES (?,?,?)').run(intent, mode, Date.now());

      send({ type: 'done', messageId: Number(inserted.lastInsertRowid), mode, latencyMs: latency, conversationId, title });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
