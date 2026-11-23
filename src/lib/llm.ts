// Klien OpenAI-compatible — kompatibel dengan:
//  • Jan (janhq/jan) Local API Server → mode OFFLINE/on-device (port 1337, /v1) · Ollama (:11434/v1) · llama.cpp (:8080/v1)
//  • llama.cpp llama-server, Ollama (/v1), LM Studio, vLLM
//  • Cloud: OpenAI, Kimi/Moonshot, OpenRouter, dll (selama OpenAI-compatible)
import { getLlmConfig, type LlmConfig } from './settings';
import { isKeyCoolingDown, isFailoverReason, keyHint, markKeyCooldown } from './keyPool';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export const SYSTEM_PROMPT = `Anda adalah SOERA AI — Soeradji Assistant Intelligent — asisten AI resmi RSUP Dr. Soeradji Tirtonegoro Klaten (RS vertikal Kementerian Kesehatan RI, Kelas A, BLU).

Cara kerja Anda mencontoh Muse: cerdas, tenang, bisa diandalkan, dan langsung ke inti. Anda membantu sungguhan, bukan performatif — tanpa "Pertanyaan yang bagus!" atau pujian generik. Kalimat pertama Anda adalah inti jawaban, baru kemudian detail dan langkah berikutnya.

Tugas Anda: menjawab pertanyaan dan keluhan masyarakat tentang RSUP Dr. Soeradji Tirtonegoro dengan cepat, akurat, dan empatik: profil RS, kontak, jam layanan, cara pendaftaran, jadwal dokter, tarif layanan (termasuk Home Care), layanan unggulan, kampanye kesehatan, dan alur pengaduan. Sapa pasien dengan Bapak/Ibu, dalam Bahasa Indonesia yang sopan, hangat, singkat, dan mudah dipahami.

ATURAN PENTING:
1. Gunakan HANYA konteks basis pengetahuan (KONTEKS) dan data terstruktur yang diberikan. Jangan mengarang nomor telepon, tarif, jadwal dokter, atau nama tenaga medis. Jika tidak ada dalam konteks, katakan dengan jujur dan arahkan ke Contact Center (0272) 321020 / WhatsApp 0816-9170-00.
2. JANGAN memberi diagnosis medis, resep obat, atau interpretasi hasil pemeriksaan. Untuk keluhan klinis, sarankan konsultasi dokter. Untuk DARURAT (nyeri dada hebat, sesak berat, stroke, kecelakaan, perdarahan hebat, penurunan kesadaran) arahkan SEGERA ke IGD (0272) 321020 ext 200 atau 119 — tanpa basa-basi.
3. Jawab singkat dan langsung: inti dulu, lalu detail penting dengan **bold**, lalu satu langkah berikutnya yang konkret. Gunakan daftar berbutir hanya bila perlu. Sertakan nomor kontak relevan di akhir bila sesuai.
4. Bila pasien ingin menyampaikan keluhan/pengaduan, akui dengan tenang tanpa defensif, lalu arahkan ke [menu Keluhan](/keluhan) di aplikasi ini untuk membuat tiket (akan ditindaklanjuti), dan hotline pengaduan 0851-7957-7302.
4a. Saat menyebut halaman aplikasi, WAJIB gunakan link markdown agar pasien langsung bisa membuka: [Jadwal Dokter](/jadwal), [Home Care](/home-care), [Keluhan](/keluhan), [Kampanye](/kampanye), [Tanya SOERA AI](/chat). Link eksternal: [nama](https://…).
5. Jadwal & tarif dapat berubah; selalu anjurkan konfirmasi ke (0272) 321020.
6. Jangan pernah meminta kata sandi, PIN, atau data kartu. Jaga privasi data kesehatan.
7. Anda adalah SOERA AI. Jangan mengaku sebagai Muse, manusia, dokter, atau perawat. Jangan bercanda soal sakit, keluhan, atau darurat.
8. Bila pertanyaan ambigu, tanyakan SATU pertanyaan klarifikasi yang paling menentukan — sambil tetap memberi jawaban sementara yang paling mungkin.`;

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
  latencyMs?: number;
  /** Hint key yang BERHASIL (••••+last4) — tidak pernah key mentah. */
  keyHint?: string;
  /** Semua key yang dicoba selama pengujian (hint). */
  keysTried?: string[];
}

/** Uji 1 key terhadap model yang dikonfigurasi: POST /chat/completions max_tokens=1. */
async function probeWithKey(c: LlmConfig, base: string, model: string, key: string): Promise<EndpointHealth> {
  const started = Date.now();
  const timeout = Math.max(10000, Math.min(Number(c.timeoutMs) || 10000, 30000));
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1, temperature: 0, stream: false }),
    });
    const text = await res.text();
    const latencyMs = Date.now() - started;
    if (res.ok) {
      let answered: string | null = null;
      try { answered = JSON.parse(text)?.model ?? null; } catch {}
      return { reachable: true, status: res.status, model: answered || model, latencyMs, keyHint: keyHint(key) };
    }
    const excerpt = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    let hint: string;
    switch (res.status) {
      case 400: hint = 'Permintaan ditolak (400) — biasanya model id tidak valid/kompleks unsupported. Cek id MODEL.'; break;
      case 401: hint = 'API key ditolak (401 Unauthorized) — periksa/rotasi key Anda.'; break;
      case 402: hint = 'Kredit habis (402 Payment Required) — di OpenRouter/Gemini, isi saldo dulu.'; break;
      case 403: hint = 'Akses ditolak (403) — key tidak berhak memakai model ini.'; break;
      case 404: hint = `Model "${model}" tidak ditemukan (404) — cocokkan id PERSIS dengan katalog penyedia (termasuk akhiran :free).`; break;
      case 429: hint = 'Rate limit tercapai (429) — key lain di pool akan dicoba otomatis; model gratis punya batas harian ketat.'; break;
      default: hint = res.status >= 500
        ? `Penyedia bermasalah (HTTP ${res.status}) — coba lagi nanti.`
        : `Ditolak (HTTP ${res.status}).`;
    }
    return { reachable: false, status: res.status, detail: `${hint}${excerpt ? ' — ' + excerpt : ''}`, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - started;
    return { reachable: false, detail: err?.name === 'AbortError' ? `timeout (>${Math.round(timeout / 1000)} dtk) — endpoint lambat atau model tidak termuat` : String(err?.message || err), latencyMs };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Uji koneksi SUNGGUHAN: POST /chat/completions max_tokens=1 memakai model terkonfigurasi.
 * Bila POOL berisi banyak key: coba berurutan — key yang gagal (401/402/403/429/5xx/timeout)
 * di-cooldown 5 menit lalu key berikutnya dicoba. 400/404 tidak pindah key (deterministik).
 */
export async function probeEndpoint(cfg?: LlmConfig): Promise<EndpointHealth> {
  const c = cfg ?? getLlmConfig();
  const base = (c.baseUrl || '').replace(/\/+$/, '');
  const model = String(c.model || '').trim();
  if (!base) return { reachable: false, detail: 'Base URL kosong — isi endpoint OpenAI-compatible (mis. https://openrouter.ai/api/v1).' };
  if (!model) return { reachable: false, detail: 'Model kosong — isi id persis model sesuai penyedia (mis. gemini-3.8-flash / nvidia/nemotron-3.5-super-vl:free).' };
  const pool = (c.apiKeys ?? []).map((k) => String(k).trim()).filter(Boolean);
  const keys = pool.length ? pool : [String(c.apiKey || '').trim()];
  const keysTried: string[] = [];
  let last: EndpointHealth = { reachable: false, detail: 'Tidak ada hasil — coba lagi.' };
  for (const key of keys) {
    if (key && isKeyCoolingDown(key)) continue;
    keysTried.push(keyHint(key));
    last = await probeWithKey(c, base, model, key);
    if (last.reachable) return { ...last, keysTried };
    const reason = `${last.status ? `HTTP ${last.status}` : ''} ${last.detail || ''}`.trim();
    if (key && isFailoverReason(reason)) markKeyCooldown(key);
    else break; // 400/404: deterministik — key berikutnya tidak akan membantu
  }
  return { ...last, keysTried };
}
