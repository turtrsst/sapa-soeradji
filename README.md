# SAPA PASIEN

**Strategi Akses Pemasaran Digital & Pelayanan Terintegrasi** — asisten AI & platform layanan digital pasien **RSUP Dr. Soeradji Tirtonegoro Klaten** (Rumah Sakit Umum Pusat Kelas A, RS vertikal Kementerian Kesehatan RI, BLU).

SAPA PASIEN menjawab pertanyaan dan keluhan masyarakat secara cepat — **keluhan pelayanan, pertanyaan jadwal dokter, pendaftaran online, tanya tarif, hingga kampanye kesehatan daring** — dan tetap berfungsi **tanpa internet** (mode offline) dengan dua lapis:

1. **Basis pengetahuan lokal (selalu aktif, tanpa model)** — jawaban deterministik dari data resmi RST (jadwal, tarif SK, kontak, FAQ, alur layanan).
2. **AI generatif offline via [cross-platform-llm-client (PrivateLM)](https://github.com/orailnoor/cross-platform-llm-client)** — model GGUF berjalan di HP/tablet/PC (Android/iOS) lewat **API Server OpenAI-compatible bawaan PrivateLM** (port 8080). SAPA PASIEN otomatis menempel ke endpoint itu dan men-*stream* jawabannya. Alternatif: Ollama, llama.cpp, LM Studio, atau API cloud (OpenAI/Kimi/OpenRouter).

---

## Fitur

| Modul | Keterangan |
|---|---|
| **Tanya SAPA PASIEN** (`/chat`) | Chatbot gaya ChatGPT: streaming token, riwayat percakapan tersimpan (SQLite), rename/pin/hapus, mode indikator (AI Lokal/Online vs Offline KB), salin jawaban, rating 👍👎, sumber jawaban ditampilkan. Termasuk **edukasi kesehatan umum** (batuk, demam, hipertensi, diabetes, maag, nyeri dada, diare, pusing) dengan tanda bahaya & kapan ke IGD. Pertanyaan di luar basis pengetahuan dijawab jujur dengan arahan kontak — **tidak pernah** menampilkan dokumen yang tidak relevan. Bila AI (PrivateLM/cloud) diaktifkan, model selalu diutamakan untuk pertanyaan di luar template. |
| **Jadwal Dokter** (`/jadwal`) | ±55 baris jadwal poliklinik regular, cari per dokter/poli/spesialisasi, filter hari, cetak (print-friendly). Update 12 Mei 2026 — dapat berubah, konfirmasi (0272) 321020. |
| **Home Care Go-Trah** (`/home-care`) | Semua ±80 item **Tarif Tindakan Pelayanan Home Care** hasil digitalisasi SK Dirut No. HK.02.03/D.XXVI/5441/2024 (dokumen SK dipindai, tarif terverifikasi per halaman), bisa dicari & dicetak, tersedia **unduhan PDF SK asli**, **formulir pengajuan kunjungan home care** ke petugas, dan tautan langsung ke pemesanan resmi online **Soeradji GOCARE** ([sias.rsupsoeradji.id/homecare](https://sias.rsupsoeradji.id/homecare/) — asisten Sora, 80+ layanan, minimal H-1). |
| **Keluhan / Pengaduan** (`/keluhan`) | Buat tiket → nomor tiket `SKT-YYYYMMDD-XXXXXX`, lacak status (baru → diproses → selesai) + tanggapan petugas, kategori & prioritas. |
| **Kampanye Kesehatan** (`/kampanye`) | Kampanye daring RST (SPELING, Bakti Sosial, CERDIK, Stop Gratifikasi, dll) + berbagi ke WhatsApp. Dikelola admin. |
| **Panel Admin** (`/admin`) | Login ber-cookie HMAC: statistik (grafik volume chat 14 hari, topik terbanyak), manajemen tiket keluhan (tanggapi + WA balasan), manajemen permintaan Home Care, kelola kampanye, **Pengaturan AI** (preset PrivateLM/Ollama/llama.cpp/LM Studio/OpenAI/Kimi/OpenRouter, uji koneksi, mode offline). |
| **API publik** | `/api/health`, `/api/jadwal`, `/api/tarif`, `/api/kampanye`, `/api/keluhan`, `/api/homecare`, SSE `/api/chat`, `/api/conversations*`. |

## Teknologi

- **Next.js 14** (App Router, React 18, TypeScript, Tailwind CSS) — SSR + API routes, tanpa layanan eksternal.
- **SQLite bawaan Node** (`node:sqlite`) — persistensi percakapan, tiket, campaign, konfigurasi. Tanpa dependensi native; folder data: `data/` (dapat diatur via `SAPA_DATA_DIR`).
- **RAG offline** (retrieval berbasis kata kunci + intent detection) — `src/lib/rag.ts`.
- **OpenAI-compatible streaming client** — `src/lib/llm.ts` (SSE), 100% kompatibel dengan API server PrivateLM.
- Seluruh aset lokal (logo, ikon, PDF SK) — tidak ada CDN eksternal; bisa jalan tanpa internet.

## Prasyarat

- **Node.js ≥ 22.5** (dibutuhkan untuk `node:sqlite`). Disarankan Node 22 LTS terbaru.
- npm ≥ 10.
- Untuk AI generatif offline (opsional): perangkat dengan [PrivateLM (cross-platform-llm-client)](https://github.com/orailnoor/cross-platform-llm-client) terinstal (Android/iOS/iPad/PC) atau runtime GGUF lain.

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
docker build -t sapa-pasien .
docker run -p 3000:3000 -v sapa-data:/data sapa-pasien
```

## Konfigurasi (env opsional)

| Variabel | Default | Keterangan |
|---|---|---|
| `ADMIN_USERNAME` | `admin` | Username panel admin |
| `ADMIN_PASSWORD` | `admin123` | **Wajib diganti di produksi** |
| `SAPA_ADMIN_SECRET` | (dev) | Rahasia penandatangan cookie admin — isi string acak panjang di produksi |
| `SAPA_DATA_DIR` | `./data` | Lokasi file SQLite |

## Mode Offline & Integrasi PrivateLM (cross-platform-llm-client)

Arsitektur tanya-jawab:

```
Pertanyaan pasien
  → intent detection + retrieval basis pengetahuan RST (offline)
  → AI diaktifkan & endpoint respons? → jawaban generatif RAG (streaming)
  → AI nonaktif / endpoint gagal / key salah? → jawaban basis pengetahuan (fallback otomatis + catatan)
```

**Langkah mengaktifkan AI offline dengan PrivateLM:**

1. Pasang & jalankan **PrivateLM** dari <https://github.com/orailnoor/cross-platform-llm-client> (unduh APK/IPA dari halaman Releases, atau build via Flutter: `flutter build apk --release`).
2. Unduh model GGUF (disarankan Qwen2.5-1.5B-Instruct / Llama-3.2-1B/3B `Q4_K_M`; HP/PC RAM 4–8 GB cukup) dan **muat model** hingga status *loaded*.
3. Di PrivateLM buka **Settings → API Server**: aktifkan **Allow network access**, isi **API key** (wajib untuk mode jaringan), port tetap **8080**.
4. Catat alamat yang tampil di layar server (mis. `http://192.168.1.10:8080`) — SAPA PASIEN dan perangkat PrivateLM harus **satu jaringan** (LAN/WiFi RS).
5. Login ke `/admin` → tab **Pengaturan AI (Offline)** → pilih preset **PrivateLM**, isi Base URL `http://<IP-perangkat>:8080/v1`, API key sama, model = nama model termuat (PrivateLM melayani model apa pun namanya) → **Uji Koneksi Sekarang** → aktifkan toggle → **Simpan**.

Selesai — seluruh tanya-jawab kini 100% offline di infrastruktur RS. Contoh uji manual:

```bash
curl http://192.168.1.10:8080/v1/health            # {"status":"ok"}
curl http://192.168.1.10:8080/v1/models             # daftar model termuat
curl -X POST http://192.168.1.10:8080/v1/chat/completions \
  -H "Authorization: Bearer <API_KEY>" -H "Content-Type: application/json" \
  -d '{"model":"model-lokal-privatelm","messages":[{"role":"user","content":"halo"}],"stream":true}'
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
    llm.ts             # Klien OpenAI-compatible streaming (PrivateLM dkk)
    db.ts              # SQLite (node:sqlite) + migrasi + seed kampanye/pengaturan
    settings.ts auth.ts llm settings, autentikasi cookie admin
public/documents/      # SK Tarif Home Care (PDF asli, dapat diunduh dari aplikasi)
public/images/         # Logo SAPA PASIEN
test/rag-test.mjs      # 32 pengujian basis pengetahuan & retrieval
```

## Sumber Data & Akurasi

- **Kontak & profil RST**: situs resmi [rsupsoeradji.id](https://rsupsoeradji.id), [rssoeradji.go.id](https://www.rssoeradji.go.id), [Instagram @rssoeradjitirtonegoro](https://www.instagram.com/rssoeradjitirtonegoro) (Contact Center (0272) 321020, IGD ext 200, pendaftaran WA 0816-9170-00, hotline pengaduan 0851-7957-7302, email rsupsoeradji_klaten@yahoo.com).
- **Tarif Home Care**: Keputusan Direktur Utama RST No. **HK.02.03/D.XXVI/5441/2024** (18 Maret 2024), melampirkan 5 kelompok tarif — digitalisasi dilakukan dari pindaian SK (scan) dan diverifikasi halaman demi halaman; salinan PDF tersedia di aplikasi (`/home-care` → Unduh SK).
- **Jadwal dokter**: diolah dari situs resmi & direktori jadwal publik (update **12 Mei 2026**); **jadwal dapat berubah sewaktu-waktu** — selalu konfirmasi ke (0272) 321020.
- Kampanye: berita/kegiatan resmi RST (bakti sosial & khitanan massal Nov 2026, SPELING Gantiwarno) serta program Kemenkes (CERDIK, GERMAS, DOTS).

## Dokumentasi

- [`docs/PANDUAN-INSTALL-PRIVATELM.md`](docs/PANDUAN-INSTALL-PRIVATELM.md) — panduan langkah demi langkah memasang PrivateLM (aplikasi AI lokal/offline OpenAI-compatible) di Android/iOS dan menyambungkannya ke SAPA PASIEN.
- [`docs/DEPLOYMENT-PUBLIK.md`](docs/DEPLOYMENT-PUBLIK.md) — arsitektur & checklist publikasi SAPA PASIEN di IP publik (HTTPS, firewall, reverse proxy, LLM lokal di server, keamanan & UU PDP).

## Catatan Penting

- SAPA PASIEN **bukan pengganti konsultasi medis**; tidak memberikan diagnosis atau resep. Untuk kondisi darurat: IGD RST (0272) 321020 ext 200 / **119**.
- Data percakapan & tiket tersimpan lokal di server aplikasi (SQLite); tidak ada data yang dikirim ke pihak ketiga kecuali jika admin mengaktifkan API cloud.
- Kampanye & jadwal bersifat informasional; rujukan terakhir adalah pengumuman resmi RST.

## Lisensi & Kredit

Aplikasi dibangun untuk RSUP Dr. Soeradji Tirtonegoro Klaten. Integrasi AI offline: [orailnoor/cross-platform-llm-client](https://github.com/orailnoor/cross-platform-llm-client) (MIT). Logo SAPA PASIEN dibuat khusus untuk aplikasi ini.
