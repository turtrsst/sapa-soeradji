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
