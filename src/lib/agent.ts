// Agen AI SOERA AI — tool-calling di atas endpoint OpenAI-compatible (Ollama/Jan/
// llama.cpp/LM Studio/OpenAI) memakai Vercel AI SDK (package `ai` + `@ai-sdk/openai`).
// Agen WAJIB memakai tool untuk data RS (jadwal/tarif/kampanye/info) — dilarang mengarang.
// Per tanya-jawab, agen hanya resmi dipakai untuk "pertanyaan bebas" (intent general);
// pertanyaan layanan template dilayani alur deterministik (tanpa kuota).
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import type { LlmConfig } from './settings';
import { retrieve, matchJadwal, matchTarif, formatJadwalLines, formatTarifLines } from './rag';
import { TARIF_META } from './tarif';
import { JADWAL_UPDATE } from './jadwal';
import { getDb } from './db';
import { isKeyCoolingDown, isFailoverReason, keyHint, markKeyCooldown } from './keyPool';
import { buildJadwalCard, buildTarifCard, buildKampanyeCard, buildInfoCard, type CardPayload } from './genui';

export const AGENT_SYSTEM = `Anda adalah SOERA AI (Soeradji Assistant Intelligent) — asisten AI resmi RSUP Dr. Soeradji Tirtonegoro Klaten (RS vertikal Kementerian Kesehatan RI, Kelas A, BLU).

Cara kerja Anda mencontoh Muse: cerdas, tenang, bisa diandalkan, dan langsung ke inti. Anda membantu sungguhan, bukan performatif — tanpa "Pertanyaan yang bagus!" atau pujian generik. Kalimat pertama Anda adalah inti jawaban, baru kemudian detail dan langkah berikutnya. Sapa pasien dengan Bapak/Ibu.

ATURAN KERJA:
1. Jawab dalam Bahasa Indonesia yang sopan, ringkas, empatik, mudah dipahami (gaya layanan pelanggan rumah sakit). Gunakan **bold** untuk info penting dan daftar berbutir bila perlu. Akhiri dengan satu langkah berikutnya yang konkret.
2. Untuk data faktual RS (jadwal dokter, tarif layanan/Home Care, info layanan/pendaftaran/kontak, kampanye) Anda WAJIB memanggil tool yang tersedia. DILARANG mengarang nomor telepon, tarif, jadwal, atau nama tenaga medis. Bila tool tidak menemukan data, katakan jujur dan arahkan ke Contact Center (0272) 321020 / WhatsApp 0816-9170-00.
3. JANGAN memberi diagnosis medis, resep obat, atau interpretasi hasil pemeriksaan. Untuk keluhan klinis sarankan konsultasi dokter. Untuk DARURAT (nyeri dada hebat, sesak berat, stroke, kecelakaan, perdarahan hebat, penurunan kesadaran) arahkan SEGERA ke IGD (0272) 321020 ext 200 atau 119 — tanpa basa-basi.
4. Pertanyaan umum di luar RS: jawab singkat dan jujur. Bila tidak tahu, katakan tidak tahu — jangan mengarang.
5. Jangan pernah meminta kata sandi, PIN, atau data kartu. Jaga privasi data kesehatan.
6. Jadwal & tarif dapat berubah — anjurkan konfirmasi ke (0272) 321020. Bukan pengganti konsultasi medis.
7. Saat menyebut halaman aplikasi, WAJIB gunakan link markdown: [Jadwal Dokter](/jadwal), [Home Care](/home-care), [Keluhan](/keluhan), [Kampanye](/kampanye), [Tanya SOERA AI](/chat). Link eksternal: [nama](https://…). Contoh: buka [halaman Jadwal Dokter](/jadwal).
8. Anda adalah SOERA AI. Jangan mengaku sebagai Muse, manusia, dokter, atau perawat. Jangan bercanda soal sakit, keluhan, atau darurat.

CONTOH GAYA (ikuti polanya):
- User: "Jadwal dokter jantung Senin?" → panggil cari_jadwal_dokter(poli="jantung", hari="Senin") → jawab inti dulu: dokter + poli + hari + jam (**bold** untuk dokter & jam), lalu satu langkah: pendaftaran online WA 0816-9170-00 (H-7 s/d H-1), konfirmasi (0272) 321020, link [Jadwal Dokter](/jadwal).
- User: "Antrian JP Sabtu?" → bila data tidak ada di KB/tool, katakan jujur "belum ada di data saya" + arahkan (0272) 321020 — jangan mengarang.
- User: "Cuaca besok?" → "Soal cuaca di luar lingkup saya — saya asisten RS Soeradji. Yang bisa saya bantu: profil RS, pendaftaran, [Jadwal Dokter](/jadwal), tarif, Home Care, [Kampanye](/kampanye), [Keluhan](/keluhan)."`;

export interface AgentStreamOptions {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  cfg: LlmConfig;
  onToken: (t: string) => void;
  /** Token reasoning/thinking (Gemini/model reasoning) — ditampilkan sebagai panel "Sedang berpikir…". */
  onReasoning?: (t: string) => void;
  /** Kartu generative (jadwal/tarif/kampanye/info) — dikirim sebagai event SSE "card". */
  onCard?: (card: CardPayload) => void;
  /** Fases eksekusi tool — untuk chip "Executing…" di UI. */
  onTool?: (evt: { phase: 'start' | 'result'; tool: string }) => void;
}

export interface AgentStreamResult {
  ok: boolean;
  reason?: string;
  tokens: number;
  /** Hint key (••••+last4) yang berhasil — hanya untuk log/UI admin, bukan key mentah. */
  keyHint?: string;
}

/**
 * Tap ke stream SSE mentah untuk menyalin delta reasoning (`reasoning_content` ala DeepSeek/Gemini
 * OpenAI-compat, `reasoning` ala OpenRouter, atau `reasoning_details[]`) ke callback.
 * @ai-sdk/openai tidak meneruskan field ini, jadi kita sadap di layer jaringan — passthrough
 * byte-per-byte tanpa mengubah respons yang diterima AI SDK.
 */
function tapReasoningStream(response: Response, onReasoning?: (t: string) => void): Response {
  if (!onReasoning || !response.body) return response;
  const decoder = new TextDecoder();
  let buffer = '';
  const emit = (line: string) => {
    const t = line.trim();
    if (!t.startsWith('data:')) return;
    const data = t.slice(5).trim();
    if (!data || data === '[DONE]') return;
    try {
      const j = JSON.parse(data);
      const d = j?.choices?.[0]?.delta ?? {};
      let r = '';
      if (typeof d.reasoning_content === 'string') r += d.reasoning_content;
      if (typeof d.reasoning === 'string') r += d.reasoning;
      if (Array.isArray(d.reasoning_details)) for (const it of d.reasoning_details) if (typeof it?.text === 'string') r += it.text;
      if (r) onReasoning(r);
    } catch { /* frame non-JSON */ }
  };
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) emit(line);
      controller.enqueue(chunk);
    },
    flush() { if (buffer) emit(buffer); },
  });
  return new Response(response.body.pipeThrough(transform), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function errStatus(e: any): number | undefined {
  const s = e?.statusCode ?? e?.status ?? e?.response?.status;
  const n = Number(s);
  return Number.isFinite(n) && n >= 100 && n < 600 ? n : undefined;
}
function reasonOf(e: any, fallback = 'error agen'): string {
  const m = e?.message || String(e || fallback);
  const st = errStatus(e);
  return st ? `HTTP ${st} — ${m}` : m;
}

function resolvePool(cfg: LlmConfig): string[] {
  const pool = (cfg.apiKeys ?? []).map((k) => String(k || '').trim()).filter(Boolean);
  if (pool.length) return [...new Set(pool)];
  const single = String(cfg.apiKey || '').trim();
  return single && !single.startsWith('••••') ? [single] : ['']; // [''] = endpoint lokal tanpa key
}

export async function streamAgent({ message, history, cfg, onToken, onReasoning, onCard, onTool }: AgentStreamOptions): Promise<AgentStreamResult> {
  const baseUrl = (cfg.baseUrl || 'http://localhost:8080/v1').replace(/\/+$/, '');
  const isGemini = /generativelanguage\.googleapis\.com/i.test(baseUrl);
  const pool = resolvePool(cfg);

  const tools = {
    cari_jadwal_dokter: tool({
      description: 'Cari jadwal praktik dokter/poliklinik RS Soeradji (update ' + JADWAL_UPDATE + '). Kata kunci: nama dokter, poli, spesialisasi, atau hari — mis. "jantung Senin", "dr. Suharso", "poli kulit".',
      inputSchema: z.object({ kata_kunci: z.string().describe('nama dokter / poli / spesialisasi / hari') }),
      execute: async ({ kata_kunci }) => {
        const rows = matchJadwal(kata_kunci, 8);
        if (rows.length) onCard?.(buildJadwalCard(rows));
        return rows.length
          ? `Jadwal (update ${JADWAL_UPDATE}, dapat berubah — konfirmasi (0272) 321020):\n${formatJadwalLines(rows)}\nPendaftaran online: WA 0816-9170-00 (H-7 s/d H-1).\nDetail & cetak: [halaman Jadwal Dokter](/jadwal).`
          : 'Tidak ada jadwal yang cocok untuk kata kunci itu. Sarankan konfirmasi (0272) 321020 atau lihat [halaman Jadwal Dokter](/jadwal).';
      },
    }),
    cari_tarif_layanan: tool({
      description: `Cari tarif resmi RS Soeradji/Home Care (SK Dirut ${TARIF_META.nomor}). Kata kunci: nama tindakan — mis. "pasang infus", "perawatan luka", "GDS", "fisioterapi".`,
      inputSchema: z.object({ kata_kunci: z.string().describe('nama tindakan/layanan yang dicari tarifnya') }),
      execute: async ({ kata_kunci }) => {
        const rows = matchTarif(kata_kunci, 10);
        if (rows.length) onCard?.(buildTarifCard(rows));
        return rows.length
          ? `Tarif (SK ${TARIF_META.nomor}, ${TARIF_META.tanggal}):\n${formatTarifLines(rows)}\n${TARIF_META.catatan}\nTabel lengkap (±80 item) & unduh SK: [halaman Home Care](/home-care). Pesan online: [Soeradji GOCARE](https://sias.rsupsoeradji.id/homecare/).`
          : 'Tidak ada tarif cocok. Sarankan lihat [halaman Home Care](/home-care) atau hubungi (0272) 321020.';
      },
    }),
    cari_info_rst: tool({
      description: 'Cari informasi resmi RS Soeradji: profil RS, kontak, cara pendaftaran online, E-Yang Soeradji, home care (Soeradji GOCARE), keluhan/pengaduan, kampanye, edukasi kesehatan umum, dan layanan unggulan.',
      inputSchema: z.object({ kata_kunci: z.string().describe('topik yang dicari, mis. "pendaftaran", "home care", "keluhan", "MCU"') }),
      execute: async ({ kata_kunci }) => {
        const hits = retrieve(kata_kunci, 3);
        if (!hits.length) return 'Tidak ada dokumen basis pengetahuan yang cocok.';
        onCard?.(buildInfoCard(hits));
        return hits.map((h) => `[${h.doc.title} | Sumber: ${h.doc.source}]\n${h.doc.body.slice(0, 900)}`).join('\n\n');
      },
    }),
    daftar_kampanye_aktif: tool({
      description: 'Daftar kampanye kesehatan RS Soeradji yang sedang/terakhir dipublikasikan (bakti sosial, SPELING, CERDIK, skrining, dll).',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const rows = getDb().prepare(
            'SELECT title, summary, location, start_date, end_date FROM campaigns WHERE active = 1 ORDER BY created_at DESC LIMIT 6'
          ).all() as { title: string; summary: string; location: string | null; start_date: string | null; end_date: string | null }[];
          if (rows.length) onCard?.(buildKampanyeCard(rows));
        if (!rows.length) return 'Belum ada kampanye aktif. Lihat [menu Kampanye](/kampanye) untuk arsip.';
          return rows.map((r) => `- ${r.title}: ${r.summary}${r.location ? ` (Tempat: ${r.location})` : ''}${r.start_date ? ` (Mulai: ${r.start_date}${r.end_date ? ` s/d ${r.end_date}` : ''})` : ''}`).join('\n') + '\nSemua kampanye: [menu Kampanye](/kampanye).';
        } catch {
          return 'Data kampanye tidak tersedia saat ini.';
        }
      },
    }),
  };

  // Fallback antar key di pool: percobaan berurutan #1..#N.
  // Pindah key HANYA bila gagal SEBELUM token pertama terkirim (aman: tidak ada teks dobel di klien).
  let tokensTotal = 0;
  let lastReason = '';
  let triedRealKey = 0;
  for (const key of pool) {
    if (key && isKeyCoolingDown(key)) continue;
    if (key) triedRealKey++;
    const tapFetch: typeof fetch = async (input: any, init?: any) => tapReasoningStream(await fetch(input, init), onReasoning);
    const openai = createOpenAI({ baseURL: baseUrl, apiKey: key || 'soera-local', fetch: tapFetch });
    const model = openai.chat(cfg.model || 'model-lokal');
    let tokens = 0;
    const attempt: Record<string, any> = {
      // Gemini: kirim effort thinking (tidak bisa dimatikan di Gemini 3.x; 'low' paling hemat).
      ...(isGemini ? { reasoning: (cfg.thinkingEffort ?? 'low') as any } : {}),
    };
    try {
      const result = streamText({
        model,
        system: AGENT_SYSTEM,
        messages: [...history, { role: 'user' as const, content: message }],
        tools,
        stopWhen: stepCountIs(5),
        temperature: cfg.temperature ?? 0.4,
        maxOutputTokens: Math.min(4096, Math.max(64, cfg.maxTokens ?? 900)),
        abortSignal: AbortSignal.timeout(Math.max(5000, cfg.timeoutMs || 60000)),
        onError: ({ error }) => { console.error('[soera-agent]', error); },
        ...attempt,
      });
      for await (const rawPart of result.fullStream) {
        const part: any = rawPart;
        if (part?.type === 'text-delta') {
          const text: string = part.text ?? part.delta ?? '';
          if (text) { tokens++; tokensTotal++; onToken(text); }
        } else if (part?.type === 'reasoning-delta') {
          const text: string = part.text ?? part.delta ?? '';
          if (text) onReasoning?.(text);
        } else if (part?.type === 'tool-call') {
          onTool?.({ phase: 'start', tool: String(part.toolName ?? 'tool') });
        } else if (part?.type === 'tool-result') {
          onTool?.({ phase: 'result', tool: String(part.toolName ?? 'tool') });
        } else if (part?.type === 'error') {
          lastReason = reasonOf(part.error);
        }
      }
      if (tokens > 0) return { ok: true, tokens, keyHint: keyHint(key) };
      if (!lastReason) lastReason = 'Endpoint tidak mengembalikan teks';
    } catch (err: any) {
      lastReason = err?.name === 'TimeoutError' || err?.name === 'AbortError' ? 'timeout' : reasonOf(err);
    }
    if (key && isFailoverReason(lastReason)) markKeyCooldown(key);
    if (tokens > 0) return { ok: true, tokens: tokensTotal, keyHint: keyHint(key) }; // sebagian teks terlanjur terkirim — jangan ulangi
    // gagal total pada key ini → coba key berikutnya (bila ada & alasannya memungkinkan pindah)
    if (pool.length > 1 && !isFailoverReason(lastReason)) break; // 400/404 deterministik — key lain tak membantu
  }
  return {
    ok: false,
    reason: pool.length > 1 && triedRealKey > 1 ? `${lastReason} (semua ${triedRealKey} key dicoba)` : lastReason,
    tokens: tokensTotal,
  };
}
