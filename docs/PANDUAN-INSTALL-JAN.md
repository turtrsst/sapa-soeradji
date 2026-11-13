# Panduan Install Jan (janhq/jan) untuk SOERA AI

Tujuan: menjalankan model AI **100% offline di komputer** (Windows/macOS/Linux) sebagai mesin jawaban SOERA AI — pasien bertanya, model lokal menjawab; tanpa internet, data tidak keluar rumah sakit. Jan adalah ChatGPT open-source (±44 ribu bintang di GitHub, September 2026) yang berjalan sepenuhnya di perangkat.

Sumber resmi: https://github.com/janhq/jan · Lisensi: **Apache-2.0** © Menlo Research · Nama aplikasi: **Jan**

> Ringkasan 3 langkah besar: (1) pasang Jan + unduh model di Komputer, (2) aktifkan **Local API Server** bawaan Jan (port 1337), (3) arahkan SOERA AI `/admin → Pengaturan AI` ke endpoint itu.

**Beda penting dibanding PrivateLM:** Jan hanya tersedia sebagai aplikasi **desktop** (tidak ada versi Android/iOS resmi) dan merupakan aplikasi **GUI** — cocok untuk PC petugas/admin/pilot, bukan layanan headless 24/7 di server. Untuk produksi publik, lihat [`DEPLOYMENT-PUBLIK.md`](DEPLOYMENT-PUBLIK.md) (§2C Ollama disarankan untuk server Windows RS).

---

## A. Kebutuhan Perangkat

| Komponen | Minimal | Disarankan |
|---|---|---|
| OS | Windows 10+ · macOS 13.6+ · Linux (deb/AppImage/Flatpak) | Windows 11 / macOS terbaru |
| RAM | 8 GB (model 3B) | 16 GB (model 7B) · 32 GB (model 13B) |
| GPU | NVIDIA/AMD/Intel Arc (opsional tapi sangat membantu) | GPU dengan VRAM ≥ 6 GB |
| Penyimpanan | ~200 MB app + 1–5 GB per model | SSD lega ≥ 16 GB |
| Jaringan | — (inferensi lokal; internet hanya untuk unduh model sekali) | LAN untuk akses lintas mesin (opsional) |

Ukuran model sesuai RAM:
- RAM 8 GB → **Qwen2.5-3B-Instruct GGUF Q4_K_M** (~2,0 GB) atau **Llama-3.2-3B-Instruct**
- RAM 16 GB → **Qwen2.5-7B / Llama-3.1-8B-Instruct Q4_K_M** (~4,5–4,7 GB)
- RAM 32 GB → **Qwen2.5-14B Instruct Q4_K_M** — kualitas jawaban jauh lebih baik

## B. Instalasi

1. **Windows**: unduh [`jan.exe`](https://app.jan.ai/download/latest/win-x64) dari jan.ai (atau via [Microsoft Store](https://apps.microsoft.com/detail/xpdcnfn5cpzlqb), atau dari halaman [Releases](https://github.com/janhq/jan/releases)) → jalankan installer.
2. **macOS**: unduh [`jan.dmg`](https://app.jan.ai/download/latest/mac-universal) (universal: Intel + Apple Silicon) → seret ke Applications.
3. **Linux**: [`jan.deb`](https://app.jan.ai/download/latest/linux-amd64-deb) atau [jan.AppImage](https://app.jan.ai/download/latest/linux-amd64-appimage), atau `flatpak install flathub ai.jan.Jan`.
4. Buka **Jan** → selesaikan wizard awal → aplikasi terbuka di halaman chat.

## C. Mengunduh & Memuat Model

1. Di Jan buka tab **Hub** (atau *Settings → Assistant* sesuai versi) → cari model, mis. `Qwen2.5-3B-Instruct` varian **GGUF Q4_K_M** → klik **Download** (satu kali butuh internet, via Hugging Face).
   - Alternatif: unduh file `.gguf` sendiri dari huggingface.co, lalu *import* di Jan.
   - Jan menampilkan indikator kompatibilitas: *Fits / May be slow / Won't fit*. Pilih yang **Fits**.
2. Setelah selesai, pilih model di dropdown chat → model otomatis dimuat (ditandai status loaded).
3. Coba chat di dalam Jan — pastikan menjawab wajar. Jika ya, mesin lokal siap.

## D. Mengaktifkan Local API Server (inti integrasi)

1. Jan → **Settings → Local API Server**.
2. Pilih model yang dimuat → klik **Start Server**.
3. Jan menampilkan log `JAN API listening at http://127.0.0.1:1337`. Endpoint **OpenAI-compatible** tersedia di `http://127.0.0.1:1337/v1`.
4. Secara default server hanya **loopback** (`127.0.0.1`) — hanya komputer itu sendiri yang bisa mengakses.
   - Bila SOERA AI berjalan di mesin **lain** (mis. server RS), set **Host = `0.0.0.0`** di pengaturan yang sama agar bisa diakses via LAN. Hanya lakukan di jaringan internal RS — **jangan pernah** mem-port-forward port 1337 ke internet.
   - Port default: **1337** (bisa diubah).
5. **Catat model id** yang termuat — klik `GET /v1/models` (lihat contoh curl di F) atau lihat id di kartu model di Jan (format umumnya hyphenated-lowercase, mis. `qwen2.5-3b-instruct`).
6. Uji dari terminal:
   ```bash
   curl http://127.0.0.1:1337/v1/models
   curl -X POST http://127.0.0.1:1337/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer jan" \
     -d '{"model":"<model-id>","messages":[{"role":"user","content":"Halo"}],"stream":false}'
   ```
   API key boleh string apa pun (Jan menerima non-empty string); bila Anda mengonfigurasi key khusus di Jan, pakai key itu.

## E. Menghubungkan ke SOERA AI

1. Login `http://<server-soera-ai>:3000/admin` → tab **Pengaturan AI (Offline)**.
2. Pilih preset **Jan (Local API Server — offline, komputer ini)** — atau **Jan di perangkat lain (LAN, Host 0.0.0.0)** bila SOERA AI dan Jan beda mesin.
3. Isi:
   - Base URL: `http://127.0.0.1:1337/v1` (satu mesin) atau `http://<IP-PC-Jan>:1337/v1` (LAN)
   - API Key: string apa pun (mis. `jan`) — atau key yang Anda konfigurasi di Jan
   - Model: **model id dari Jan** (lihat `GET /v1/models`, mis. `qwen2.5-3b-instruct`)
   - Temperature 0.4, Max Tokens 900 (default cukup)
4. Klik **Uji Koneksi Sekarang** → harus tampil ✓ dengan nama model.
5. Aktifkan toggle mesin AI → **Simpan Pengaturan**.
6. Uji dari pasien: tanyakan *"apakah batuk berdahak itu bahaya?"* — bila jawaban berlabel **AI Lokal/Online** (bukan "Offline KB"), integrasi berhasil.

**Stabilkan akses lintas mesin:** di router/access point RS set **DHCP reservation** untuk PC Jan; matikan *AP/client isolation*; firewall Windows izinkan port 1337 hanya untuk subnet RS.

## F. Build dari Source (Developer)

Prasyarat: **Node.js ≥ 20**, **Yarn ≥ 4.5**, **Rust** (untuk Tauri), Make; Windows: Git Bash + Visual Studio Build Tools (MSVC x64) + LLVM + Ninja + CMake (lihat README repo).

```bash
git clone https://github.com/janhq/jan.git
cd jan
make dev      # atau: yarn install && yarn build && yarn dev
```

## G. Troubleshooting

| Gejala | Solusi |
|---|---|
| `Connection refused` ke 127.0.0.1:1337 | Local API Server belum di-Start (Settings → Local API Server), atau Jan ditutup — start ulang server di Jan |
| SOERA AI di mesin lain tidak bisa akses | Host Jan masih `127.0.0.1` → ubah ke `0.0.0.0` di Local API Server; cek firewall & DHCP reservation |
| Model id tidak dikenal (400/404) | Salin persis dari `curl http://127.0.0.1:1337/v1/models` — bukan nama tampilan |
| Jawaban sangat lambat | Pakai model lebih kecil (3B Q4_K_M); ringankan GPU offload; GPU driver terbaru (NVIDIA/AMD/Intel Arc) |
| SOERA AI masih "Offline KB" meski AI aktif | Endpoint tidak terjangkau/model salah → *Uji Koneksi* di panel admin; cek terminal `npm start` |
| Laptop/PC Jan mati → AI ikut mati | Untuk operasional nyata pakai **Ollama sebagai Windows Service** di server (lihat DEPLOYMENT-PUBLIK §2C) — Jan paling tepat untuk admin/pilot/demo |

**Keamanan:** jangan port-forward 1337 ke internet; Jan tidak punya auth kuat di jaringan — andalkan VLAN/firewall RS; ganti API key berkala bila dikonfigurasi khusus; komputer Jan sebaiknya khusus (auto-login + power plan high performance + tidak sleep) untuk pilot 24/7.

---

> **Akan dipublikasikan di IP publik untuk pasien?** Baca [`DEPLOYMENT-PUBLIK.md`](DEPLOYMENT-PUBLIK.md) — di server web yang disarankan adalah Ollama (§2C, jalan sebagai service) atau llama-server; Jan cocok untuk demo/pilot di PC petugas. Ada juga checklist HTTPS, firewall, rate limit, dan kepatuhan UU PDP.
