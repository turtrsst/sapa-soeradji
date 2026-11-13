# SOERA AI

> Catatan: aplikasi sebelumnya bernama **SAPA PASIEN** — diganti **SOERA AI (SOERAdji Assistant Intelligent)** per 12 Nov 2026. Nama berkas DB legacy (`data/sapa-pasien.sqlite`) & env `SAPA_DATA_DIR` dipertahankan demi kompatibilitas data.

**Soeradji Assistant Intelligent** — asisten AI & platform layanan digital pasien **RSUP Dr. Soeradji Tirtonegoro Klaten** (Rumah Sakit Umum Pusat Kelas A, RS vertikal Kementerian Kesehatan RI, BLU).

SOERA AI menjawab pertanyaan dan keluhan masyarakat secara cepat — **keluhan pelayanan, pertanyaan jadwal dokter, pendaftaran online, tanya tarif, hingga kampanye kesehatan daring** — dan tetap berfungsi **tanpa internet** (mode offline) dengan dua lapis:

1. **Basis pengetahuan lokal (selalu aktif, tanpa model)** — jawaban deterministik dari data resmi RST (jadwal, tarif SK, kontak, FAQ, alur layanan).
2. **AI generatif offline via [Jan (janhq/jan)](https://github.com/janhq/jan)** — ChatGPT open-source yang berjalan 100% offline di komputer (Windows/macOS/Linux); model GGUF (Llama, Qwen, GPT-oss, …) berjalan lokal lewat **Local API Server OpenAI-compatible bawaan Jan** (port 1337). SOERA AI otomatis menempel ke endpoint itu dan men-*stream* jawabannya. Alternatif: Ollama, llama.cpp, LM Studio, atau API cloud (OpenAI/Kimi/OpenRouter).

---

## Fitur

| Modul | Keterangan |
|---|---|
| **Tanya SOERA AI** (`/chat`) | Chatbot gaya ChatGPT: streaming token, riwayat percakapan tersimpan (SQLite), rename/pin/hapus, mode indikator (AI Lokal/Online vs Offline KB), salin jawaban, rating 👍👎, sumber jawaban ditampilkan. Termasuk **edukasi kesehatan umum** (batuk, demam, hipertensi, diabetes, maag, nyeri dada, diare, pusing) dengan tanda bahaya & kapan ke IGD. Pertanyaan di luar basis pengetahuan dijawab jujur dengan arahan kontak — **tidak pernah** menampilkan dokumen yang tidak relevan. Bila AI (Jan/Ollama/cloud) diaktifkan, **agen AI tool-calling** (Vercel AI SDK) menjawab pertanyaan bebas: memanggil tool `cari_jadwal_dokter`, `cari_tarif_layanan`, `cari_info_rst`, `daftar_kampanye_aktif` — dibatasi **5 pertanyaan bebas per pengguna per hari** (reset 00.00 WIB, di-hash anonim). Pertanyaan layanan (jadwal/tarif/home care/dll.) tidak memakai kuota. Lihat [`docs/AI-AGENT.md`](docs/AI-AGENT.md). |
| **Jadwal Dokter** (`/jadwal`) | ±55 baris jadwal poliklinik regular, cari per dokter/poli/spesialisasi, filter hari, cetak (print-friendly). Update 12 Mei 2026 — dapat berubah, konfirmasi (0272) 321020. |
| **Soeradji Go Care** (`/home-care`) | Semua ±80 item **Tarif Tindakan Pelayanan Home Care** hasil digitalisasi SK Dirut No. HK.02.03/D.XXVI/5441/2024 (dokumen SK dipindai, tarif terverifikasi per halaman), bisa dicari & dicetak, tersedia **unduhan PDF SK asli**, **formulir pengajuan kunjungan home care** ke petugas, dan tautan langsung ke pemesanan resmi online **Soeradji GOCARE** ([sias.rsupsoeradji.id/homecare](https://sias.rsupsoeradji.id/homecare/) — asisten Sora, 80+ layanan, minimal H-1). |
| **Keluhan / Pengaduan** (`/keluhan`) | Buat tiket → nomor tiket `SKT-YYYYMMDD-XXXXXX`, lacak status (baru → diproses → selesai) + tanggapan petugas, kategori & prioritas. |
| **Kampanye Kesehatan** (`/kampanye`) | Kampanye daring RST (SPELING, Bakti Sosial, CERDIK, Stop Gratifikasi, dll) + berbagi ke WhatsApp. Dikelola admin. |
| **Panel Admin** (`/admin`) | Login ber-cookie HMAC: statistik (grafik volume chat 14 hari, topik terbanyak), manajemen tiket keluhan (tanggapi + WA balasan), manajemen permintaan Home Care, kelola kampanye, **Pengaturan AI** (preset Jan/Ollama/llama.cpp/LM Studio/OpenAI/Kimi/OpenRouter, uji koneksi, mode offline). |
| **API publik** | `/api/health`, `/api/jadwal`, `/api/tarif`, `/api/kampanye`, `/api/keluhan`, `/api/homecare`, SSE `/api/chat`, `/api/conversations*`. |

## Teknologi

- **Next.js 14** (App Router, React 18, TypeScript, Tailwind CSS) — SSR + API routes, tanpa layanan eksternal.
- **SQLite bawaan Node** (`node:sqlite`) — persistensi percakapan, tiket, campaign, konfigurasi. Tanpa dependensi native; folder data: `data/` (dapat diatur via `SAPA_DATA_DIR`).
- **RAG offline** (retrieval berbasis kata kunci + intent detection) — `src/lib/rag.ts`.
- **OpenAI-compatible streaming client** — `src/lib/llm.ts` (SSE), 100% kompatibel dengan Local API Server Jan dan endpoint OpenAI-compatible lainnya.
- Seluruh aset lokal (logo, ikon, PDF SK) — tidak ada CDN eksternal; bisa jalan tanpa internet.

## Prasyarat

- **Node.js ≥ 22.5** (dibutuhkan untuk `node:sqlite`). Disarankan Node 22 LTS terbaru.
- npm ≥ 10.
- Untuk AI generatif offline (opsional): komputer dengan [Jan (janhq/jan)](https://github.com/janhq/jan) terinstal (Windows/macOS/Linux), atau runtime OpenAI-compatible lain (Ollama, llama-server, LM Studio).

## Menjalankan (pengembangan)

```bash
npm install
npm run dev        # http://localhost:3000
```

## Menjalankan (produksi)

```bash
npm ci
npm run build
npm start          # http://0.0.0.0:3000
```

Verifikasi: `curl http://localhost:3000/api/health`
Jalankan pengujian basis pengetahuan & retrieval: `npm test`

**Docker** (opsional, belum diuji di lingkungan pengembangan ini):
```bash
docker build -t soera-ai .
docker run -p 3000:3000 -v soera-data:/data soera-ai
```

## Konfigurasi (env opsional)

| Variabel | Default | Keterangan |
|---|---|---|
| `ADMIN_USERNAME` | `admin` | Username panel admin |
| `ADMIN_PASSWORD` | `admin123` | **Wajib diganti di produksi** |
| `SOERA_ADMIN_SECRET` | (dev) | Rahasia penandatangan cookie admin — isi string acak panjang di produksi (`SAPA_ADMIN_SECRET` lama tetap dihormati) |
| `SOERA_AI_DAILY_LIMIT` | `5` | Maks. pertanyaan bebas AI per pengguna/IP per hari (reset 00.00 WIB) |
| `SOERA_RATE_CHAT_LIMIT` | `30` | Maks. request `/api/chat` per IP per window (429 bila lewat) |
| `SOERA_RATE_CHAT_WINDOW_MS` | `300000` | Window rate limit chat (5 menit) |
| `SOERA_RATE_LOGIN_LIMIT` | `5` | Maks. kegagalan login admin per IP per window (blokir 429) |
| `SOERA_RATE_LOGIN_WINDOW_MS` | `600000` | Window throttle login (10 menit) |
| `SOERA_RATE_PUBLIC_POST_LIMIT` | `10` | Maks. pengiriman publik (keluhan + home care) per IP per jam |
| `SOERA_RATE_PUBLIC_POST_WINDOW_MS` | `3600000` | Window limit pengiriman publik (1 jam) |
| `SAPA_DATA_DIR` | `./data` | Lokasi file SQLite |

## Mode Offline & Integrasi Jan (janhq/jan)

Arsitektur tanya-jawab:

```
Pertanyaan pasien
  → intent detection + retrieval basis pengetahuan RST (offline)
  → AI diaktifkan & endpoint respons? → jawaban generatif RAG (streaming)
  → AI nonaktif / endpoint gagal / key salah? → jawaban basis pengetahuan (fallback otomatis + catatan)
```

**Langkah mengaktifkan AI offline dengan Jan:**

1. Pasang **Jan** dari <https://github.com/janhq/jan> ([Windows `jan.exe`](https://app.jan.ai/download/latest/win-x64) / [macOS `jan.dmg`](https://app.jan.ai/download/latest/mac-universal) / Linux `jan.deb`·AppImage·Flatpak).
2. Di tab **Hub**, unduh model GGUF (disarankan **Qwen2.5-3B-Instruct `Q4_K_M`** untuk RAM 8 GB, atau 7B untuk 16 GB) dan **muat model** di chat.
3. Jan → **Settings → Local API Server** → pilih model → **Start Server** (log: `JAN API listening at http://127.0.0.1:1337`).
4. Endpoint OpenAI-compatible aktif di `http://127.0.0.1:1337/v1` (loopback default; set Host `0.0.0.0` bila SOERA AI di mesin lain di LAN RS).
5. Login ke `/admin` → tab **Pengaturan AI (Offline)** → pilih preset **Jan**, isi Base URL `http://127.0.0.1:1337/v1` (atau `http://<IP-PC-Jan>:1337/v1`), Model = model id dari `GET /v1/models` (mis. `qwen2.5-3b-instruct`), API key bebas (mis. `jan`) → **Uji Koneksi Sekarang** → aktifkan toggle → **Simpan**.

Catatan: Jan adalah aplikasi **desktop (GUI)** — untuk server produksi 24/7 disarankan Ollama sebagai Windows Service (lihat [`docs/DEPLOYMENT-PUBLIK.md`](docs/DEPLOYMENT-PUBLIK.md) §2C). Jan paling cocok untuk PC petugas/pilot/demo. Tidak ada versi Android/iOS resmi.

Selesai — seluruh tanya-jawab kini 100% offline di infrastruktur RS. Contoh uji manual:

```bash
curl http://127.0.0.1:1337/v1/models              # model id yang dikenali server Jan
curl -X POST http://127.0.0.1:1337/v1/chat/completions \
  -H "Authorization: Bearer jan" -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-3b-instruct","messages":[{"role":"user","content":"halo"}],"stream":true}'
```

Preset lain tersedia di panel: Ollama (`http://localhost:11434/v1`), llama.cpp `llama-server` (`http://localhost:8080/v1`), LM Studio (`http://localhost:1234/v1`), OpenAI, Kimi/Moonshot, OpenRouter.

## Struktur Proyek

```
src/
  app/                 # App Router: pages + API routes (chat SSE, admin, …)
  components/          # ChatClient, Header, Footer, Markdown, AdminDashboard, Icon
  lib/
    kb.ts              # Basis pengetahuan RST (19 dokumen, bersumber)
    tarif.ts           # Digitalisasi SK HK.02.03/D.XXVI/5441/2024 (semua item tarif)
    jadwal.ts          # ±55 baris jadwal poliklinik (update 12 Mei 2026)
    rag.ts             # Retrieval + intent detection
    offline.ts         # Penyusun jawaban deterministik (mode offline)
    llm.ts             # Klien OpenAI-compatible streaming (Jan/Ollama dkk)
    db.ts              # SQLite (node:sqlite) + migrasi + seed kampanye/pengaturan
    settings.ts auth.ts llm settings, autentikasi cookie admin
public/documents/      # SK Tarif Home Care (PDF asli, dapat diunduh dari aplikasi)
public/images/         # Logo SOERA AI
test/rag-test.mjs      # 32 pengujian basis pengetahuan & retrieval
```

## Sumber Data & Akurasi

- **Kontak & profil RST**: situs resmi [rsupsoeradji.id](https://rsupsoeradji.id), [rssoeradji.go.id](https://www.rssoeradji.go.id), [Instagram @rssoeradjitirtonegoro](https://www.instagram.com/rssoeradjitirtonegoro) (Contact Center (0272) 321020, IGD ext 200, pendaftaran WA 0816-9170-00, hotline pengaduan 0851-7957-7302, email rsupsoeradji_klaten@yahoo.com).
- **Tarif Home Care**: Keputusan Direktur Utama RST No. **HK.02.03/D.XXVI/5441/2024** (18 Maret 2024), melampirkan 5 kelompok tarif — digitalisasi dilakukan dari pindaian SK (scan) dan diverifikasi halaman demi halaman; salinan PDF tersedia di aplikasi (`/home-care` → Unduh SK).
- **Jadwal dokter**: diolah dari situs resmi & direktori jadwal publik (update **12 Mei 2026**); **jadwal dapat berubah sewaktu-waktu** — selalu konfirmasi ke (0272) 321020.
- Kampanye: berita/kegiatan resmi RST (bakti sosial & khitanan massal Nov 2026, SPELING Gantiwarno) serta program Kemenkes (CERDIK, GERMAS, DOTS).

## Keamanan (hardening bawaan)

- **Rate limit in-memory** (fixed window): `/api/chat` 30 req/5 mnt/IP · login admin 5 gagal/10 mnt/IP (429 + `Retry-After`) · pengiriman publik (keluhan + home care) 10/jam/IP. Limit dapat diubah via env di atas. Untuk multi-instance/produksi besar tambahkan limit di reverse proxy (Caddy/Nginx/Cloudflare).
- **Security headers** di semua respons: CSP (default-src 'self'), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **IP tidak disimpan**: subjek kuota AI di-hash SHA-256; kredensial admin default HARUS diganti sebelum publik; cookie `HttpOnly; SameSite=Lax`; sesi 12 jam.
- **`sharp`** terpasang untuk optimasi gambar Next.js produksi.

## Dokumentasi

- [`docs/PANDUAN-INSTALL-JAN.md`](docs/PANDUAN-INSTALL-JAN.md) — panduan langkah demi langkah memasang Jan (aplikasi AI lokal/offline OpenAI-compatible) di Windows/macOS/Linux dan menyambungkannya ke SOERA AI.
- [`docs/DEPLOYMENT-PUBLIK.md`](docs/DEPLOYMENT-PUBLIK.md) — arsitektur & checklist publikasi SOERA AI di IP publik (HTTPS, firewall, reverse proxy, LLM lokal di server, keamanan & UU PDP).
- [`docs/AI-AGENT.md`](docs/AI-AGENT.md) — screening GitHub framework AI Agent (vercel/ai vs langchainjs/langgraph/LlamaIndex/privateGPT/RAGFlow) + arsitektur agen tool-calling & kuota 5/hari.

## Catatan Penting

- SOERA AI **bukan pengganti konsultasi medis**; tidak memberikan diagnosis atau resep. Untuk kondisi darurat: IGD RST (0272) 321020 ext 200 / **119**.
- Data percakapan & tiket tersimpan lokal di server aplikasi (SQLite); tidak ada data yang dikirim ke pihak ketiga kecuali jika admin mengaktifkan API cloud.
- Kampanye & jadwal bersifat informasional; rujukan terakhir adalah pengumuman resmi RST.

## Lisensi & Kredit

Aplikasi dibangun untuk RSUP Dr. Soeradji Tirtonegoro Klaten. Integrasi AI offline: [janhq/jan](https://github.com/janhq/jan) (Apache-2.0). Logo SOERA AI dibuat khusus untuk aplikasi ini.
