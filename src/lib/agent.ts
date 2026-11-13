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

export const AGENT_SYSTEM = `Anda adalah SOERA AI (Soeradji Assistant Intelligent) — asisten AI resmi RSUP Dr. Soeradji Tirtonegoro Klaten (RS vertikal Kementerian Kesehatan RI, Kelas A, BLU).

ATURAN KERJA:
1. Jawab dalam Bahasa Indonesia yang sopan, ringkas, empatik, mudah dipahami (gaya layanan pelanggan rumah sakit). Gunakan **bold** untuk info penting dan daftar berbutir bila perlu.
2. Untuk data faktual RS (jadwal dokter, tarif layanan/Home Care, info layanan/pendaftaran/kontak, kampanye) Anda WAJIB memanggil tool yang tersedia. DILARANG mengarang nomor telepon, tarif, jadwal, atau nama tenaga medis. Bila tool tidak menemukan data, katakan jujur dan arahkan ke Contact Center (0272) 321020 / WhatsApp 0816-9170-00.
3. JANGAN memberi diagnosis medis, resep obat, atau interpretasi hasil pemeriksaan. Untuk keluhan klinis sarankan konsultasi dokter. Untuk DARURAT (nyeri dada hebat, sesak berat, stroke, kecelakaan, perdarahan hebat, penurunan kesadaran) arahkan SEGERA ke IGD (0272) 321020 ext 200 atau 119.
4. Pertanyaan umum di luar RS: jawab singkat dan jujur. Bila tidak tahu, katakan tidak tahu — jangan mengarang.
5. Jangan pernah meminta kata sandi, PIN, atau data kartu. Jaga privasi data kesehatan.
6. Jadwal & tarif dapat berubah — anjurkan konfirmasi ke (0272) 321020. Bukan pengganti konsultasi medis.
7. Saat menyebut halaman aplikasi, WAJIB gunakan link markdown: [Jadwal Dokter](/jadwal), [Home Care](/home-care), [Keluhan](/keluhan), [Kampanye](/kampanye), [Tanya SOERA AI](/chat). Link eksternal: [nama](https://…). Contoh: buka [halaman Jadwal Dokter](/jadwal).`;

export interface AgentStreamOptions {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  cfg: LlmConfig;
  onToken: (t: string) => void;
}

export interface AgentStreamResult {
  ok: boolean;
  reason?: string;
  tokens: number;
}

export async function streamAgent({ message, history, cfg, onToken }: AgentStreamOptions): Promise<AgentStreamResult> {
  const baseUrl = (cfg.baseUrl || 'http://localhost:8080/v1').replace(/\/+$/, '');
  const openai = createOpenAI({ baseURL: baseUrl, apiKey: cfg.apiKey || 'soera-local' });
  const model = openai.chat(cfg.model || 'model-lokal');

  const tools = {
    cari_jadwal_dokter: tool({
      description: 'Cari jadwal praktik dokter/poliklinik RST (update ' + JADWAL_UPDATE + '). Kata kunci: nama dokter, poli, spesialisasi, atau hari — mis. "jantung Senin", "dr. Suharso", "poli kulit".',
      inputSchema: z.object({ kata_kunci: z.string().describe('nama dokter / poli / spesialisasi / hari') }),
      execute: async ({ kata_kunci }) => {
        const rows = matchJadwal(kata_kunci, 8);
        return rows.length
          ? `Jadwal (update ${JADWAL_UPDATE}, dapat berubah — konfirmasi (0272) 321020):\n${formatJadwalLines(rows)}\nPendaftaran online: WA 0816-9170-00 (H-7 s/d H-1).\nDetail & cetak: [halaman Jadwal Dokter](/jadwal).`
          : 'Tidak ada jadwal yang cocok untuk kata kunci itu. Sarankan konfirmasi (0272) 321020 atau lihat [halaman Jadwal Dokter](/jadwal).';
      },
    }),
    cari_tarif_layanan: tool({
      description: `Cari tarif resmi RST/Home Care (SK Dirut ${TARIF_META.nomor}). Kata kunci: nama tindakan — mis. "pasang infus", "perawatan luka", "GDS", "fisioterapi".`,
      inputSchema: z.object({ kata_kunci: z.string().describe('nama tindakan/layanan yang dicari tarifnya') }),
      execute: async ({ kata_kunci }) => {
        const rows = matchTarif(kata_kunci, 10);
        return rows.length
          ? `Tarif (SK ${TARIF_META.nomor}, ${TARIF_META.tanggal}):\n${formatTarifLines(rows)}\n${TARIF_META.catatan}\nTabel lengkap (±80 item) & unduh SK: [halaman Home Care](/home-care). Pesan online: [Soeradji GOCARE](https://sias.rsupsoeradji.id/homecare/).`
          : 'Tidak ada tarif cocok. Sarankan lihat [halaman Home Care](/home-care) atau hubungi (0272) 321020.';
      },
    }),
    cari_info_rst: tool({
      description: 'Cari informasi resmi RST: profil RS, kontak, cara pendaftaran online, E-Yang Soeradji, home care (Soeradji GOCARE), keluhan/pengaduan, kampanye, edukasi kesehatan umum, dan layanan unggulan.',
      inputSchema: z.object({ kata_kunci: z.string().describe('topik yang dicari, mis. "pendaftaran", "home care", "keluhan", "MCU"') }),
      execute: async ({ kata_kunci }) => {
        const hits = retrieve(kata_kunci, 3);
        if (!hits.length) return 'Tidak ada dokumen basis pengetahuan yang cocok.';
        return hits.map((h) => `[${h.doc.title} | Sumber: ${h.doc.source}]\n${h.doc.body.slice(0, 900)}`).join('\n\n');
      },
    }),
    daftar_kampanye_aktif: tool({
      description: 'Daftar kampanye kesehatan RST yang sedang/terakhir dipublikasikan (bakti sosial, SPELING, CERDIK, skrining, dll).',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const rows = getDb().prepare(
            'SELECT title, summary, location, start_date, end_date FROM campaigns WHERE active = 1 ORDER BY created_at DESC LIMIT 6'
          ).all() as { title: string; summary: string; location: string | null; start_date: string | null; end_date: string | null }[];
          if (!rows.length) return 'Belum ada kampanye aktif. Lihat [menu Kampanye](/kampanye) untuk arsip.';
          return rows.map((r) => `- ${r.title}: ${r.summary}${r.location ? ` (Tempat: ${r.location})` : ''}${r.start_date ? ` (Mulai: ${r.start_date}${r.end_date ? ` s/d ${r.end_date}` : ''})` : ''}`).join('\n') + '\nSemua kampanye: [menu Kampanye](/kampanye).';
        } catch {
          return 'Data kampanye tidak tersedia saat ini.';
        }
      },
    }),
  };

  let tokens = 0;
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
    });
    for await (const part of result.textStream) {
      if (part) { tokens++; onToken(part); }
    }
    if (tokens === 0) return { ok: false, reason: 'Agent tidak mengembalikan teks', tokens: 0 };
    return { ok: true, tokens };
  } catch (err: any) {
    const reason = err?.name === 'TimeoutError' || err?.name === 'AbortError' ? 'timeout' : (err?.message || String(err));
    return { ok: false, reason, tokens };
  }
}
