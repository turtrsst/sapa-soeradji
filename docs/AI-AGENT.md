# SOERA AI — Screening AI Agent & Arsitektur Tool-Calling

> Pencarian GitHub (2026-11-12/13, via GitHub Search API): framework agent mana yang dipasang untuk menjawab pertanyaan pasien — baik **pertanyaan bebas** maupun **sesuai template** — dengan batas **5 pertanyaan bebas per pengguna per hari** (reset 00.00 WIB).

## 1. Hasil screening (kandidat nyata)

| Repositori | ⭐ | Tipe | Evaluasi untuk SOERA AI |
|---|---|---|---|
| [vercel/ai](https://github.com/vercel/ai) (AI SDK) | **27.898** | Library TS (embeddable) | ✅ **Dipilih.** Dibuat tim Next.js; `streamText` + `tool()` + `stepCountIs`; provider OpenAI-compatible (`createOpenAI` → `openai.chat(model)`) — kompatibel dengan **Ollama** (`localhost:11434/v1`), **Jan** (`:1337/v1`), llama.cpp, LM Studio. Streaming SSE, tool-calling, stop-condition bawaan. Terpasang: `ai@7.0.171`, `@ai-sdk/openai@4.0.116`, `zod@4.6.7`. |
| [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs) | 18.341 | Library TS (framework) | ⚠️ Mampu (agent & tool), tapi jauh lebih berat & abstrak; banyak paket `@langchain/*` terpisah; overkill untuk 4 tool read-only. Cadangan bila kelak butuh chain/RAG kompleks. |
| [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs) | 3.415 | Orkestrasi graph | ❌ Multi-step graph/multi-agent — tidak dibutuhkan sekarang. |
| [run-llama/LlamaIndexTS](https://github.com/run-llama/LlamaIndexTS) | 3.081 | Framework RAG TS | ⚠️ Unggul untuk RAG dokumen; KB kita sudah custom (retrieval + intent sendiri). Duplikasi. |
| [zyplon-ai/private-gpt](https://github.com/zyplon-ai/private-gpt) | 57.635 | **Service Python** (API+MCP) | ❌ Proses terpisah + duplikasi basis pengetahuan; bukan library yang bisa di-`npm install` ke Next.js. |
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | 94.095 | **Platform RAG penuh** (Docker, ES, dll.) | ❌ Infrastruktur berat; cocok produk data, bukan chatbot RS embedded. |
| h2oai/h2ogpt (11.922 ⭐), AutoGPT/AgentGPT (produk konsumen) | — | Service/produk | ❌ Bukan embed-lib; mis-scope untuk layanan terarah RS. |

Kriteria: bisa di-embed di Next.js (App Router) · OpenAI-compatible (offline Ollama/Jan) · tool-calling · streaming · lisensi MIT · aktif ter-update.

## 2. Arsitektur yang dipasang

```
Browser ──SSE──> /api/chat
                  │
                  ├─ intent template? (darurat/jadwal/tarif/homecare/keluhan/kampanye/daftar/kontak/profil)
                  │     └─> alur deterministik KB + data terstruktur — TANPA KUOTA (llm diberi konteks via streamLlm bila AI aktif)
                  │
                  └─ intent general (vitally_unknown) + AI aktif
                        ├─ kuota habis? → jawaban offline KB + catatan reset 00.00 WIB
                        └─ konsumsi 1 kuota → SOERA AI AGENT (src/lib/agent.ts)
                              └─ streamText + tools (Vercel AI SDK)
                                   ├─ cari_jadwal_dokter   → matchJadwal() (data jadwal ±55 baris)
                                   ├─ cari_tarif_layanan   → matchTarif() (SK Dirut HK.02.03/D.XXVI/5441/2024)
                                   ├─ cari_info_rst        → retrieve() KB 29 dokumen (pendaftaran/kontak/home care/edukasi/dll.)
                                   └─ daftar_kampanye_aktif → tabel campaigns (SQLite)
```

Prinsip: **agen tidak boleh mengarang data RS** — jawaban faktual wajib dari tool (data terstruktur/KB), diarahkan ke hotline bila tidak ketemu. Gagal sebelum token pertama → kuota dikembalikan otomatis (`refundAiQuota`).

## 3. Kuota: 5 pertanyaan bebas AI per pengguna per hari

- **Siapa pengguna?** Anonim; subjek kuota = `SHA-256(IP)` (x-forwarded-for / x-real-ip / cf-connecting-ip) — IP asli **tidak disimpan**.
- **Kapan reset?** Kunci tanggal `Asia/Jakarta` (UTC+7): `dayKeyJakarta()` — reset **00.00 WIB**.
- **Apa yang dihitung?** Hanya pertanyaan **bebas** (di luar template) saat AI aktif. Pertanyaan layanan template **tidak dibatasi**; AI nonaktif → kuota tidak dipakai sama sekali.
- **Penyimpanan:** tabel `ai_usage(subject, day, used, updated_at)` (SQLite) — migrasi otomatis.
- **UI:** sisa kuota tampil di bawah composer setelah jawaban AI (`sisa X/5 · reset 00.00 WIB`); panel admin → Ringkasan menampilkan "AI Bebas Hari Ini"; `/api/health` → blok `ai`.
- **Batas dapat diubah** lewat env `SOERA_AI_DAILY_LIMIT` (default 5). Catatan: limit per IP — satu NAT kantor/RS bisa berbagi kuota; untuk identitas per pasien butuh login (di luar scope saat ini).

## 4. Variabel & file terkait

| File | Isi |
|---|---|
| `src/lib/agent.ts` | `streamAgent()` — prompt sistem agen + 4 tool + `stopWhen: stepCountIs(5)` |
| `src/lib/aiUsage.ts` | `dayKeyJakarta()`, `consumeAiQuota()`, `refundAiQuota()`, `AI_DAILY_LIMIT` |
| `src/app/api/chat/route.ts` | gerbang kuota + pemilihan jalur agent (general) vs template (deterministik/streamLlm) |
| `test/ai-usage-test.mjs` | uji murni: reset 00.00 WIB & aritmetika kuota (ikut `npm test`) |

## 5. Cara mengaktifkan

1. Jalankan endpoint OpenAI-compatible (Ollama `ollama pull qwen2.5:3b` → `:11434/v1`, atau Jan → Settings → Local API Server → `:1337/v1`, atau llama-server/cloud).
2. `/admin` → **Pengaturan AI** → pilih preset (mis. *Ollama (lokal)*) → isi Model → **Uji Koneksi** → **Simpan** → aktifkan.
3. Pasien bertanya di `/chat`. Pertanyaan bebas ditandai kuota 5/hari di antarmuka; sisa kuota terlihat setelah tiap jawaban.

## 6. Batasan & kejujuran

- Agen memilih tool sendiri — kualitas pemilihan tergantung model (Qwen2.5-3B ke atas cukup andal untuk 4 tool; model lebih kecil bisa salah pilih — naikkan ke 7B bila tersedia).
- Tool-calling butuh endpoint yang mendukung `tools` (Ollama/OpenAI/llama-server/Jan mendukung — Jan ikut standar OpenAI; bila model lokal belum stabil memanggil tool, jawaban tetap mengalir sebagai teks — naikkan ukuran model bila perlu).
- Kuota per IP ≠ per orang; terapkan login bila perlu pengukuran individual.
- 5/hari adalah kebijakan produk (hemat + anti-abuse), bukan batas teknis endpoint — ubah `SOERA_AI_DAILY_LIMIT` bila RS ingin lain.
