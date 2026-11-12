// Klien OpenAI-compatible — kompatibel dengan:
//  • PrivateLM (orailnoor/cross-platform-llm-client) API Server → mode OFFLINE/on-device (port 8080, /v1)
//  • llama.cpp llama-server, Ollama (/v1), LM Studio, vLLM
//  • Cloud: OpenAI, Kimi/Moonshot, OpenRouter, dll (selama OpenAI-compatible)
import { getLlmConfig, type LlmConfig } from './settings';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export const SYSTEM_PROMPT = `Anda adalah SAPA PASIEN — Strategi Akses Pemasaran Digital & Pelayanan Terintegrasi — asisten AI resmi RSUP Dr. Soeradji Tirtonegoro Klaten (RS vertikal Kementerian Kesehatan RI, Kelas A, BLU).

Tugas Anda: menjawab pertanyaan dan keluhan masyarakat tentang RSUP Dr. Soeradji Tirtonegoro dengan cepat, akurat, dan empatik: profil RS, kontak, jam layanan, cara pendaftaran, jadwal dokter, tarif layanan (termasuk Home Care), layanan unggulan, kampanye kesehatan, dan alur pengaduan.

ATURAN PENTING:
1. Gunakan HANYA konteks basis pengetahuan (KONTEKS) dan data terstruktur yang diberikan. Jangan mengarang nomor telepon, tarif, jadwal dokter, atau nama tenaga medis. Jika tidak ada dalam konteks, katakan dengan jujur dan arahkan ke Contact Center (0272) 321020 / WhatsApp 0816-9170-00.
2. JANGAN memberi diagnosis medis, resep obat, atau interpretasi hasil pemeriksaan. Untuk keluhan klinis, sarankan konsultasi dokter. Untuk DARURAT (nyeri dada hebat, sesak berat, stroke, kecelakaan, perdarahan hebat, penurunan kesadaran) arahkan SEGERA ke IGD (0272) 321020 ext 200 atau 119.
3. Jawab dalam Bahasa Indonesia yang sopan, hangat, singkat, dan mudah dipahami (gaya customer service rumah sakit). Gunakan **bold** untuk info penting dan daftar berbutir bila perlu. Sertakan nomor kontak relevan di akhir bila sesuai.
4. Bila pasien ingin menyampaikan keluhan/pengaduan, arahkan ke menu "Keluhan" di aplikasi ini untuk membuat tiket (akan ditindaklanjuti), dan hotline pengaduan 0851-7957-7302.
5. Jadwal & tarif dapat berubah; selalu anjurkan konfirmasi ke (0272) 321020.
6. Jangan pernah meminta kata sandi, PIN, atau data kartu. Jaga privasi data kesehatan.`;

function endpoint(cfg: LlmConfig): string {
  const base = (cfg.baseUrl || 'http://localhost:8080/v1').replace(/\/+$/, '');
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
}

export interface StreamResult { ok: boolean; reason?: string }

/**
 * Stream chat completion dari endpoint OpenAI-compatible.
 * onToken dipanggil per potongan teks. Mengembalikan ok=false bila gagal SEBELUM token pertama —
 * pemanggil boleh fallback ke jawaban offline.
 */
export async function streamLlm(
  messages: ChatMessage[],
  onToken: (t: string) => void,
  cfgOverride?: LlmConfig,
): Promise<StreamResult> {
  const cfg = cfgOverride ?? getLlmConfig();
  if (!cfg.enabled) return { ok: false, reason: 'LLM tidak diaktifkan' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.max(3000, cfg.timeoutMs || 60000));
  let received = false;
  try {
    const res = await fetch(endpoint(cfg), {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model || 'model-lokal',
        messages,
        temperature: cfg.temperature ?? 0.4,
        max_tokens: cfg.maxTokens ?? 900,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const detail = await safeText(res);
      return { ok: false, reason: `HTTP ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}` };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta: string = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? '';
          if (delta) { received = true; onToken(delta); }
        } catch { /* abaikan frame non-JSON */ }
      }
    }
    if (!received) return { ok: false, reason: 'Endpoint tidak mengembalikan teks' };
    return { ok: true };
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'timeout' : (err?.message || String(err));
    return { ok: false, reason: msg };
  } finally {
    clearTimeout(timer);
  }
}

async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return ''; }
}

export interface EndpointHealth {
  reachable: boolean;
  status?: number;
  model?: string | null;
  detail?: string;
}

export async function probeEndpoint(cfg?: LlmConfig): Promise<EndpointHealth> {
  const c = cfg ?? getLlmConfig();
  const base = (c.baseUrl || '').replace(/\/+$/, '');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${base}/models`, {
      signal: ctrl.signal,
      headers: c.apiKey ? { Authorization: `Bearer ${c.apiKey}` } : {},
    });
    const text = await res.text();
    let model: string | null = null;
    try { model = JSON.parse(text)?.data?.[0]?.id ?? null; } catch {}
    return { reachable: res.ok, status: res.status, model, detail: res.ok ? undefined : text.slice(0, 200) };
  } catch (err: any) {
    return { reachable: false, detail: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) };
  } finally {
    clearTimeout(t);
  }
}
