# Publikasi SAPA PASIEN di IP Publik — Arsitektur & Checklist

> Dokumen ini menjawab: *"kalau yang diinstall di web? Kan rencananya sistem ini akan dipublikkan IP publik untuk pasien."*
> Ringkasnya: **PrivateLM tidak bisa "diinstall di server web"** — ia aplikasi mobile. Tapi integrasinya tetap bisa, karena SAPA PASIEN memanggil LLM **dari sisi server**, dan engine yang dipakai PrivateLM (llama.cpp) tersedia juga untuk Linux.

---

## 1. Cara kerja integrasi (kenapa aman untuk publik)

```
Browser pasien ──HTTPS(443)──> Reverse proxy (Caddy/Nginx)
                                    │
                                    ▼
                          Next.js SAPA PASIEN (127.0.0.1:3000)
                                    │  dipanggil SERVER-SIDE
                                    ▼
              llama-server OpenAI-compatible (127.0.0.1:8080 /v1)
```

- Kunci API LLM **tidak pernah** menyentuh browser pasien; semua panggilan `/api/chat` → LLM terjadi di server.
- Port LLM (8080) dan port Next.js (3000) **tidak perlu — dan tidak boleh — dibuka ke internet**. Hanya 443 (dan 80 untuk redirect) yang publik.
- Ini pola yang sama persis dengan PrivateLM di HP; hanya lokasi endpoint-nya berbeda (localhost/LAN, bukan 192.168.x.x HP).

## 2. Opsi LLM untuk deployment publik

| Opsi | Kapan dipakai | Catatan |
|---|---|---|
| **A. llama-server di mesin yang sama** *(disarankan)* | Server publik sekaligus menjadi "mesin AI" | llama.cpp = engine di balik PrivateLM; OpenAI-compatible `/v1/chat/completions`. Model GGUF yang sama bisa dipakai (mis. Qwen2.5-1.5B/3B **Q4_K_M**). CPU-only cukup untuk model kecil; RAM 8–16 GB nyaman. |
| **B. Mesin/VM/GPU khusus di LAN RST** | RS punya GPU/workstation di datacenter | Web server publik → LLM hanya boleh diakses dari IP web server (firewall/UFW atau bind LAN + allowlist). |
| **C. Tanpa LLM (mode Offline KB)** | Langsung go-live tanpa menunggu pengadaan | Chatbot menjawab dari basis pengetahuan resmi RST + edukasi kesehatan umum; pertanyaan di luar KB dijawab jujur + hotline. **Sudah berfungsi penuh hari ini.** |
| **D. HP PrivateLM via WiFi RS** | Demo / pilot saja | **Tidak disarankan 24/7 publik**: baterai, layar, WiFi putus, reboot untuk update, dan IP HP berubah. |

Opsi cloud (OpenAI/dll.) tetap tersedia di **/admin → Pengaturan AI** bila RS mengizinkan — dengan catatan privasi di §5.

## 2A. Kalau pakai FreeLLMAPI (`github.com/tashfeenahmed/freellmapi`)?

FreeLLMAPI = agregator **free tier** 34 provider (~635 endpoint model, ~7,4 miliar token/bulan) di balik satu endpoint OpenAI-compatible `/v1` (localhost:3001). Kunci provider milik Anda (BYOK) disimpan AES-256-GCM terenkripsi; router memilih model sehat di bawah kuota, failover otomatis saat 429/5xx; keys/analytics/dashboard; MIT; self-host (Docker/desktop/Node 20+). Secara teknis **SAPA PASIEN bisa langsung memakainya** tanpa ubah kode: /admin → Pengaturan AI → pilih preset terdekat (mis. **llama.cpp llama-server (lokal)**) lalu ganti Base URL menjadi `http://127.0.0.1:3001/v1`, API Key = unified key `freellmapi-…`. (Preset hanyalah pengisi formulir — semua endpoint OpenAI-compatible bisa dipakai.)

**Tapi layak untuk pasien publik? Tidak direkomendasikan.** Evaluasi jujur:

- Repo sendiri menulis scope-nya: **"Personal experimentation only"**; README Limitations: no frontier models, latency variabel, **no SLA**, kapasitas efektif turun sore hari saat kuota harian provider habis (reset UTC midnight).
- Pertanyaan pasien (keluhan, gejala, kondisi pribadi) akan dikirim ke **pihak ketiga** (Groq, Gemini free, dll.) — free tier umumnya tunduk pada ToS personal/non-komersial dan bisa memproses data sesuai kebijakan masing-masing provider. Untuk layanan rumah sakit (data kesehatan = data pribadi spesifik, **UU PDP No. 27/2022**), ini berisiko hukum & etika tanpa tata kelola, DPA, dan persetujuan pasien yang eksplisit.
- Kuota/limit **bisa hilang atau berubah sepihak** kapan pun — bukan fondasi untuk layanan publik 24/7 milik RS.
- Pemakaian yang dapat dipertimbangkan: **uji coba/demo internal** dengan pertanyaan sintetis (bukan data pasien), untuk membandingkan kualitas jawaban. Untuk publik: tetap opsi A/B (LLM lokal, data tidak keluar RS) atau cloud berbayar dengan DPA.

## 2B. Opsi B di Windows lewat RDP (komputer server Anda)

Jika Anda **bisa RDP ke komputer server**, mesin itu bisa jadi host LLM (dan sekalian host aplikasi). Prinsip: RDP hanya kanal **admin** — jangan dibuka ke internet.

**Skenario B1 — SAPA PASIEN ikut di mesin Windows yang sama** (paling sederhana; setara Opsi A di Windows):
1. RDP masuk → install **Node.js 20 LTS** (jika belum) & driver GPU NVIDIA + CUDA (jika ada GPU; jika tidak, llama-server build CPU tetap jalan).
2. Unduh **llama.cpp Windows release** dari rilis resminya (`llama-server.exe`, pilih build `cuda-*` atau `cpu-*`/`avx2`).
3. Unduh model GGUF dari Hugging Face, mis. `Qwen2.5-3B-Instruct-Q4_K_M.gguf` (~2 GB; RAM 8 GB+) atau 1.5B (RAM 4–6 GB) → simpan di `C:\llm\models\`.
4. Uji manual: `llama-server.exe -m C:\llm\models\qwen2.5-3b-instruct-q4_k_m.gguf --host 127.0.0.1 --port 8080 --api-key "KEY-RANDOM" -c 4096` → buka `http://127.0.0.1:8080/health`.
5. Jadikan **service Windows** (auto-start & auto-restart): `nssm install llama-server "C:\llm\llama-server.exe" "-m ... --host 127.0.0.1 --port 8080 --api-key KEY"` lalu `nssm start llama-server`. Jangan jalankan di jendela RDP — ia mati saat sesi putus.
6. **Firewall**: hanya port 443 (+80) publik; 3000 & 8080 tetap loopback/LAN. RDP (3389) **hanya** dari IP admin/VPN — aktifkan NLA, ganti port bila perlu, matikan sleep, jadwalkan Windows Update di luar jam layanan.
7. /admin → Pengaturan AI → Base URL `http://127.0.0.1:8080/v1` → Uji Koneksi → Simpan. Selesai.

**Skenario B2 — SAPA PASIEN di server Linux/VPS publik, LLM di mesin Windows RST** (LAN):
1. Di mesin Windows: `llama-server.exe --host 0.0.0.0 --port 8080 --api-key "KEY-PANJANG"` sebagai service (langkah 5 B1).
2. Windows Defender Firewall → inbound rule port 8080 **hanya** dari IP server aplikasi; jangan pernah port-forward 8080 ke internet.
3. Jika server aplikasi **di luar LAN RS** (VPS): jangan buka 8080 telanjang — pakai **Tailscale/WireGuard** (kedua mesin join tailnet; Base URL `http://100.x.y.z:8080/v1`) atau reverse SSH tunnel dari mesin Windows ke VPS. Ini satu-satunya cara aman menembus NAT RS.
4. RDP hanya lewat VPN kantor (bukan internet); audit akun RDP secara berkala.

**Catatan jujur B:** RDP ≠ high availability — bila mesin mati/RDP putus, LLM (atau aplikasi) ikut mati. Gunakan service + UPS + backup terjadwal. Kalau RS mengizinkan, tetap idealnya aplikasi dan LLM di mesin server yang sama (B1) agar tidak ada trafik LLM lewat jaringan sama sekali.

## 3. Langkah praktis (Ubuntu/Debian)

### 3.1 Aplikasi
```bash
sudo apt update && sudo apt install -y nodejs npm git
git clone <repo> sapa-pasien && cd sapa-pasien
npm ci && npm run build
# jalankan via systemd / PM2 — contoh systemd di §3.4
```

### 3.2 Jalankan llama-server (opsi A)
```bash
# unduh model GGUF (sekali saja), mis. dari Hugging Face:
# Qwen2.5-1.5B-Instruct-Q4_K_M.gguf (~1.1 GB) → /opt/models/
/usr/local/bin/llama-server \
  -m /opt/models/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  --host 127.0.0.1 --port 8080 \
  --api-key "GANTI-DENGAN-KEY-RANDOM-PANJANG" \
  -c 4096 --threads "$(nproc)"

# uji:
curl -s http://127.0.0.1:8080/health
curl -s http://127.0.0.1:8080/v1/chat/completions \
  -H "Authorization: Bearer GANTI-DENGAN-KEY-RANDOM-PANJANG" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-1.5b-instruct","messages":[{"role":"user","content":"halo"}]}'
```

Contoh unit systemd (`/etc/systemd/system/llama-server.service`):
```ini
[Unit]
Description=llama.cpp server (LLM SAPA PASIEN)
After=network.target

[Service]
User=llamacpp
ExecStart=/usr/local/bin/llama-server -m /opt/models/qwen2.5-1.5b-instruct-q4_k_m.gguf --host 127.0.0.1 --port 8080 --api-key GANTI-KEY -c 4096 --threads 8
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3.3 Reverse proxy + HTTPS (Caddy — sertifikat otomatis Let's Encrypt)
```
# /etc/caddy/Caddyfile — contoh subdomain; samakan dengan zona DNS RS
sapa.rsupsoeradji.id {
    reverse_proxy 127.0.0.1:3000
}
```
`sudo systemctl reload caddy` — selesai. HTTP otomatis redirect ke HTTPS.

### 3.4 Aplikasi via systemd (`/etc/systemd/system/sapa-pasien.service`)
```ini
[Unit]
Description=SAPA PASIEN (Next.js)
After=network.target

[Service]
WorkingDirectory=/opt/sapa-pasien
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3.5 Hubungkan SAPA PASIEN ke LLM lokal
`/admin` → **Pengaturan AI** → preset *llama.cpp / LocalAI (OpenAI-compatible)* → Base URL `http://127.0.0.1:8080/v1`, API Key = key di §3.2, Model = nama model. **Uji Koneksi Sekarang** → **Simpan** → aktifkan. Perilakunya identik dengan PrivateLM di HP — hanya endpoint-nya yang lokal.

## 4. DNS & firewall

- Ajukan subdomain ke tim Sistem Informasi RS (satu zona dengan `sias.rsupsoeradji.id`), mis. **`sapa.rsupsoeradji.id` → IP publik server**; atau minta IP publik sendiri dari ISP/RS dan arahkan A record.
- Bila behind NAT: port-forward **443 + 80 saja** (jangan forward 3000/8080).
- Contoh `ufw`:
  ```bash
  sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
  sudo ufw allow from <IP-KANTOR-IT> to any port 22 proto tcp
  sudo ufw enable
  ```

## 5. Checklist keamanan (wajib sebelum go-live publik)

1. **Ganti password admin default (`admin123`) sebelum publik pertama kali.** Idealnya `/admin` hanya boleh diakses dari VPN/IP allowlist (Caddy: `basic_auth` atau matcher path `/admin*`).
2. **HTTPS saja**; aktifkan HSTS (Caddy otomatis), header `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
3. **Rate limit `/api/chat`** (mis. 20 req/menit/IP) — lewat Cloudflare/WAF di depan, atau `limit_req` di Nginx.
4. **UU PDP (UU No. 27/2022)**: data kesehatan = data pribadi spesifik. Tampilkan disclaimer yang sudah ada; **jangan** kirim percakapan pasien ke API cloud tanpa persetujuan/tata kelola; enkripsi disk server; enkripsi backup `data/sapa-pasien.sqlite`.
5. **Jangan ekspos port 8080** ke mana pun selain web server; gunakan API key berbeda per environment; rotasi berkala.
6. **Backup** SQLite harian (cron + `sqlite3 .backup`) + salinan di luar server; retensi tiket diatur sesuai kebutuhan RS.
7. **Monitoring**: ping `/api/health` (berisi status DB, jumlah dokumen KB, status LLM) untuk uptime/alert; pantau disk (model GGUF + log).
8. **Update rutin**: `npm audit`, patch Next.js/dependensi; rotasi sertifikat otomatis (Caddy).
9. **Privasi operasional**: log akses tanpa menyimpan isi percakapan secara masal; batasi akses pegawai ke `/admin` sesuai SK.
10. **Disclaimer medis** tetap tampil di footer & jawaban; SAPA PASIEN bukan diagnosis.

## 6. Hubungan dengan Soeradji GOCARE (homecare online resmi)

SAPA PASIEN **tidak menggantikan** GOCARE. Aplikasi ini menautkan dan mengedukasi: halaman **Home Care** dan jawaban chatbot mengarahkan pasien ke pemesanan resmi **https://sias.rsupsoeradji.id/homecare/** (asisten Sora, katalog 80+ layanan, tarif SK Direktur, pemesanan minimal H-1, notifikasi tiap tahap). Pemesanan, akun, dan verifikasi tetap di GOCARE/SIAS. Formulir di SAPA PASIEN hanya mencatat permintaan untuk ditindaklanjuti petugas. Bila RS ingin integrasi lebih dalam (SSO/antrean tersinkron), perlu koordinasi API dengan tim SIAS — di luar cakupan aplikasi saat ini.

## 7. Bila LLM belum siap saat go-live

Deploy apa adanya dengan AI **nonaktif** — mode Offline KB menjawab dari basis pengetahuan resmi + edukasi umum, dan jujur menyebut keterbatasannya (hotline + arahan). Aktifkan AI menyusul lewat `/admin` tanpa downtime. Tidak ada mode "setengah rusak": koneksi LLM terputus pun otomatis fallback dan jawaban tetap terkirim dengan label mode.

## 8. Catatan kejujuran

- `Dockerfile` tersedia di repo tetapi **belum diuji** (tidak ada Docker di lingkungan pengembangan); gunakan systemd/PM2 bila ragu.
- Estimasi resource opsi A: model 1.5B Q4_K_M ≈ 1.1 GB file + ~2–3 GB RAM runtime; 3B ≈ 2 GB file + ~4–5 GB RAM; tambah swap & monitoring OOM.
- Langkah Caddy/systemd di atas adalah konfigurasi standar, tetapi sesuaikan dengan infrastruktur & kebijakan keamanan RST (konsultasi tim SI/IT RS sebelum publik).
