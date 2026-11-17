# Panduan Instalasi SOERA AI di Windows Server (XAMPP)

Panduan operasional untuk memasang **SOERA AI** (aplikasi Next.js 15 + SQLite) pada komputer server RSUP Dr. Soeradji Tirtonegoro Klaten yang 24 jam menyala, dengan path yang diminta: **`C:\xampp\htdocs\soera-ai\`**, dan membukanya lewat **domain sendiri (publik)**.

> **Arsitektur singkat**
> ```
> Pengunjung (internet)
>   → DNS domain (mis. sias.rsupsoeradji.id)
>   → [Opsi A] Cloudflare Tunnel  ── atau ── [Opsi B] Apache XAMPP (vhost host sendiri, reverse proxy + HTTPS)  ── atau ── [Opsi C] sub-path di domain SIAS (sias.rsupsoeradji.id/soera-ai/)
>   → Node.js 127.0.0.1:3000  (aplikasi SOERA AI, jalan sebagai Windows Service via NSSM)
>   → SQLite di C:\xampp\htdocs\soera-ai\data\soera-ai.sqlite
> ```
> **Otomatisasi:** langkah 2–6 bisa dijalankan dengan [`scripts/Install-SoeraAI.ps1`](../scripts/Install-SoeraAI.ps1) (instalasi + Windows Service NSSM + verifikasi), backup harian dengan [`scripts/Backup-SoeraAI.ps1`](../scripts/Backup-SoeraAI.ps1), dan cek kesehatan dengan [`scripts/Verify-SoeraAI.ps1`](../scripts/Verify-SoeraAI.ps1). Operasional harian mengacu pada [`SOP-OPERASIONAL.md`](SOP-OPERASIONAL.md).

> Aplikasi ini **bukan PHP** — Apache XAMPP di sini hanya menjadi *reverse proxy* (penerus). Tidak perlu mengubah/memindahkan `htdocs` yang lain, dan **folder `soera-ai` tidak boleh dilayani Apache sebagai file statis** (berisi kode & data). Konfigurasi di bawah sudah mengamankannya.

Estimasi waktu: 60–90 menit termasuk konfigurasi domain.

---

## 0. Yang Anda perlukan

- Windows Server 2019/2022 (atau Windows 10/11) — 4 GB RAM minimal, 8 GB disarankan (16 GB bila sekaligus menjalankan Ollama/Jan kecil)
- XAMPP terpasang di `C:\xampp` (hanya "Apache" yang dipakai; MySQL tidak wajib)
- Domain publik, mis. **`sias.rsupsoeradji.id`** (subdomain resmi RS) — atau domain lain milik RS
- Akses RDP/admin ke server + hak set DNS (atau tiket ke pengelola DNS rsupsoeradji.id)
- Koneksi internet di server untuk unduh Node.js & `npm ci` (sekali saja)

---

## 1. Pasang Node.js 22 LTS

1. Buka <https://nodejs.org/en/download> → unduh **Node.js 22 LTS (Windows Installer .msi, x64)**.
2. Install (default saja). Pastikan centang **“Add to PATH”**.
3. Buka **PowerShell sebagai Administrator**, verifikasi:
   ```powershell
   node -v    # v22.x.x
   npm -v     # 10.x.x
   ```

## 2. Ambil source code ke `C:\xampp\htdocs\soera-ai`

```powershell
cd C:\xampp\htdocs
git clone https://github.com/turtrsst/sapa-soeradji.git soera-ai
cd soera-ai
npm ci
```
> Belum ada Git? Install **Git for Windows** (<https://git-scm.com/download/win>) atau salin folder proyek dari PC dev (tanpa `node_modules` dan `.next`, lalu jalankan `npm ci`).

> **Server tanpa internet?** Lakukan `npm ci` di PC dengan internet, lalu salin seluruh folder `soera-ai` — termasuk `node_modules` — ke server (via RDP copy/robocopy). Semua dependensi sudah termasuk di `node_modules` setelah `npm ci`.

## 3. Konfigurasi rahasia & environment

Aplikasi membaca environment dari proses. Paling rapi: tanam langsung di Windows Service (langkah 5) via NSSM `AppEnvironmentExtra`. Bila ingin uji manual dulu, buat file `C:\xampp\htdocs\soera-ai\.env.local` (lihat [`.env.example`](../.env.example)).

**Wajib diproduksi:**

| Variabel | Contoh / cara buat |
|---|---|
| `SOERA_ADMIN_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SOERA_ADMIN_PASSWORD_HASH` | `node -e "console.log(require('bcryptjs').hashSync('PASSWORD-KUAT-ANDA', 12))"` (jalankan di folder `soera-ai`) |
| `SAPA_DATA_DIR` | `C:\xampp\htdocs\soera-ai\data` |
| `SOERA_PUBLIC_URL` | `https://sias.rsupsoeradji.id/soera-ai` |
| `SOERA_BASE_PATH` | `/soera-ai` (hanya bila disajikan di sub-path — **wajib sama persis saat build & saat service berjalan**; installer menangani keduanya bila pakai `-BasePath`) |

**Opsional:** `ADMIN_USERNAME` (default `admin`), `SOERA_AI_DAILY_LIMIT` (default 5), `SOERA_RATE_*` (lihat `.env.example`).

> ⚠️ Jangan pakai password default `admin123` di publik. Login ke `/admin` akan **throttle** setelah 5 gagal/10 menit, dan server **memperingatkan** di log bila kredensial masih default.

**Uji cepat konfigurasi** (masih sebagai aplikasi biasa):
```powershell
cd C:\xampp\htdocs\soera-ai
npm run build      # harus "✓ Compiled successfully"
npm start          # Running on http://0.0.0.0:3000
# browser: http://127.0.0.1:3000 → Beranda, Jadwal, /keluhan
# Ctrl+C untuk berhenti
```

## 4. Siapkan folder data & backup

SQLite dibuat otomatis di `SAPA_DATA_DIR` (default `./data`). Buat folder log & backup di luar folder web:
```powershell
mkdir C:\xampp\htdocs\soera-ai\logs
mkdir D:\backup-soera-ai      # ganti D: sesuai drive data RS
```
Untuk backup otomatis: lihat **Langkah 8**.

## 5. Jadikan Windows Service 24 jam (NSSM)

Aplikasi harus hidup terus — jangan andalkan "jendela PowerShell terbuka". Pakai **NSSM** (Non-Sucking Service Manager):

1. Unduh NSSM dari <https://nssm.cc/download> → ekstrak → salin `win64\nssm.exe` ke `C:\Windows\System32\`.
2. PowerShell **Administrator**:
   ```powershell
   nssm install SoeraAI "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next start -H 127.0.0.1 -p 3000"
   nssm set SoeraAI AppDirectory "C:\xampp\htdocs\soera-ai"
   nssm set SoeraAI AppEnvironmentExtra "SOERA_ADMIN_SECRET=ISI_SECRET_ANDA" "SOERA_ADMIN_PASSWORD_HASH=ISI_HASH_BCRYPT_ANDA" "SAPA_DATA_DIR=C:\xampp\htdocs\soera-ai\data" "SOERA_PUBLIC_URL=https://sias.rsupsoeradji.id/soera-ai" "SOERA_BASE_PATH=/soera-ai" "NODE_ENV=production"
   nssm set SoeraAI AppStdout "C:\xampp\htdocs\soera-ai\logs\stdout.log"
   nssm set SoeraAI AppStderr "C:\xampp\htdocs\soera-ai\logs\stderr.log"
   nssm set SoeraAI AppRotateFiles 1
   nssm set SoeraAI AppRestartDelay 5000
   nssm set SoeraAI Start SERVICE_AUTO_START
   nssm start SoeraAI
   ```
   > Catatan bind: `-H 127.0.0.1` — aplikasi HANYA mendengar di loopback; satu-satunya pintu masuk adalah proxy (Apache/Tunnel). Microsoft Defender Firewall bisa memblokir 3000 dari luar; ini memang diinginkan.
3. Verifikasi:
   ```powershell
   nssm status SoeraAI    # SERVICE_RUNNING
   Invoke-WebRequest http://127.0.0.1:3000/api/health | Select-Object -ExpandProperty Content
   ```
4. Alternatif tanpa NSSM: **Task Scheduler** → Create Task → Run whether user logged on or not → At startup → `node "C:\xampp\htdocs\soera-ai\node_modules\next\dist\bin\next" start -H 127.0.0.1 -p 3000`, Working directory `C:\xampp\htdocs\soera-ai`, Restart on failure. (NSSM lebih andal untuk restart & logging; disarankan.)

## 6. Kunci folder `soera-ai` agar tidak disajikan XAMPP

Edit `C:\xampp\apache\conf\httpd.conf`, tambahkan di bagian bawah:
```apache
# === SOERA AI ===
<Directory "C:/xampp/htdocs/soera-ai">
    Require all denied
</Directory>
```
Ini mencegah siapa pun mengunduh source code/`.env` lewat Apache.

## 7. HTTPS & domain — pilih salah satu

### Opsi A — Cloudflare Tunnel *(disarankan; tanpa IP publik / tanpa buka port)*
Server RS biasanya di balik NAT/IP privat. Tunnel outbound-only cocok: tidak perlu membuka port 80/443, HTTPS gratis, dan bisa disertai proteksi Cloudflare (WAF, rate limit edge).

1. Pastikan `rsupsoeradji.id` (atau domain pilihan) dikelola di **Cloudflare** (nameserver diarahkan ke Cloudflare; atau pakai Cloudflare for SaaS).
2. Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create a tunnel** → beri nama `soera-ai` → ikuti instruksi unduh/install `cloudflared` untuk Windows → jalankan sebagai service (`cloudflared service install <TOKEN>`).
3. Di tunnel yang sama → **Public Hostname**: `sias.rsupsoeradji.id` → service `http://127.0.0.1:3000`. Simpan. DNS CNAME terbuat otomatis; sertifikat HTTPS otomatis.
4. (Opsional, di Cloudflare) aktifkan **WAF managed rules** + **Rate limiting rule** chat (mis. 30 req/5 menit per IP) untuk defense-in-depth di atas limit aplikasi.
5. Tambahkan ke `SOERA_PUBLIC_URL` nilai `https://sias.rsupsoeradji.id` (sudah di langkah 5).

### Opsi B — Apache XAMPP sebagai reverse proxy + Let's Encrypt
Cocok bila server punya **IP publik statis** dan bisa dibuka port 80/443.

1. Edit `C:\xampp\apache\conf\httpd.conf`, pastikan modul ini aktif (hapus `#`):
   ```apache
   LoadModule proxy_module modules/mod_proxy.so
   LoadModule proxy_http_module modules/mod_proxy_http.so
   LoadModule rewrite_module modules/mod_rewrite.so
   LoadModule headers_module modules/mod_headers.so
   LoadModule ssl_module modules/mod_ssl.so
   LoadModule socache_shmcb_module modules/mod_socache_shmcb.so
   ```
2. Buat `C:\xampp\apache\conf\extra\soera-ai.conf`:
   ```apache
   <VirtualHost *:80>
       ServerName sias.rsupsoeradji.id
       # Redirect paksa ke HTTPS (aktifkan setelah sertifikat terpasang)
       # RewriteEngine On
       # RewriteCond %{HTTPS} off
       # RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

       ProxyPreserveHost On
       ProxyPass "/" "http://127.0.0.1:3000/"
       ProxyPassReverse "/" "http://127.0.0.1:3000/"
       RequestHeader set X-Forwarded-Proto "https"
       RequestHeader set X-Forwarded-For %{REMOTE_ADDR}e
   </VirtualHost>
   ```
   Di `httpd.conf` bagian bawah tambahkan: `Include conf/extra/soera-ai.conf`
3. Restart Apache: XAMPP Control Panel → Stop/Start **Apache** (atau `httpd.exe -k restart`).
4. Install sertifikat gratis: unduh **win-acme** (<https://www.win-acme.com/>), jalankan `wacs.exe` → “Create certificate (simple)” → pilih vhost `sias.rsupsoeradji.id` → win-acme membuat vhost 443 + renew otomatis.
5. Windows Firewall: inbound izinkan **TCP 80, 443**; **jangan** izinkan 3000 dari luar.

### Opsi C — Sub-path di domain yang sudah ada: `sias.rsupsoeradji.id/soera-ai/`

Pilihan paling sederhana bila `sias.rsupsoeradji.id` (Apache SIAS) memang sudah 24 jam online & dikelola SI: SOERA AI hidup di samping SIAS — **tanpa DNS baru, tanpa vhost baru, tanpa sertifikat baru** (HTTPS SIAS dipakai bersama).

1. Pasang/build dengan base path (installer menangani build + environment service sekaligus):
   ```powershell
   cd C:\xampp\htdocs\soera-ai
   git fetch origin main; git merge --ff-only origin/main
   .\scripts\Install-SoeraAI.ps1 -PublicUrl "https://sias.rsupsoeradji.id/soera-ai" -BasePath "/soera-ai"
   ```
   Manual: `$env:SOERA_BASE_PATH='/soera-ai'; npm run build`, dan pastikan environment service memuat `SOERA_BASE_PATH=/soera-ai` (cek: `nssm get SoeraAI AppEnvironmentExtra`).
   > **`SOERA_BASE_PATH` harus SAMA persis saat build dan saat service berjalan.** Salah satu beda → aplikasi 404 di semua rute atau aset `_next` 404.
   > Port: bila 3000 dipakai SIAS, installer otomatis memilih 3100–3120 — ikuti baris `[SOERA] ... port ...` di output (contoh di bawah pakai 3100).
2. Di vhost SIAS (`C:\xampp\apache\conf\extra\` yang memuat `<VirtualHost *:443>` untuk `sias.rsupsoeradji.id` — tanya pengelola SIAS), tambahkan di dalam `<VirtualHost>`:
   ```apache
   # === SOERA AI (sub-path, proxy ke Node loopback) ===
   ProxyPass        "/soera-ai"  "http://127.0.0.1:3100/soera-ai"
   ProxyPassReverse "/soera-ai"  "http://127.0.0.1:3100/soera-ai"
   ProxyPass        "/soera-ai/" "http://127.0.0.1:3100/soera-ai/"
   ProxyPassReverse "/soera-ai/" "http://127.0.0.1:3100/soera-ai/"
   <Location "/soera-ai">
       RequestHeader set X-Forwarded-Proto "https"
   </Location>
   ```
   Prasyarat: `mod_proxy` & `mod_proxy_http` aktif (lihat Opsi B langkah 1). Tidak perlu mematikan/mengubah apapun milik SIAS — blok ini hanya menambah rute.
3. Restart Apache, lalu uji:
   ```powershell
   Invoke-WebRequest https://sias.rsupsoeradji.id/soera-ai/api/health
   ```
4. **robots.txt / sitemap.xml**: crawler hanya membaca `/robots.txt` di root domain — `/soera-ai/robots.txt` **tidak efektif**. Minta pengelola SIAS menambahkan ke root `robots.txt` SIAS:
   ```
   Disallow: /soera-ai/admin
   Disallow: /soera-ai/api/
   ```
   Sitemap tersedia di `https://sias.rsupsoeradji.id/soera-ai/sitemap.xml` (daftarkan manual ke Google Search Console bila perlu).
5. Header keamanan aplikasi (nosniff, CSP, HSTS) tetap aktif dan same-origin — tidak bentrok dengan SIAS.

## 8. Backup database SQLite (harian)

Buat `C:\xampp\htdocs\soera-ai\backup.ps1`:
```powershell
$src  = "C:\xampp\htdocs\soera-ai\data"
$dest = "D:\backup-soera-ai\$(Get-Date -Format yyyy-MM-dd)"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item "$src\*.sqlite*" $dest -Force
# retensi 30 hari
Get-ChildItem "D:\backup-soera-ai" -Directory | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse -Force
```
Jadwalkan: **Task Scheduler → Create Basic Task → Daily 02:00** → Program `powershell.exe` → Arglemen `-ExecutionPolicy Bypass -File C:\xampp\htdocs\soera-ai\backup.ps1`. (Backup saat aplikasi berjalan aman untuk SQLite WAL.)
Uji restore: hentikan service → salin file `.sqlite` kembali ke folder `data\` → mulai service.

## 9. Monitoring & beban

- **Uptime**: daftarkan `https://sias.rsupsoeradji.id/soera-ai/api/health` di UptimeRobot / Better Stack / health-check bawaan RS (interval 5 menit, alert ke SI/Humas). Publik hanya melihat status dasar; detail provider AI & peringatan keamanan hanya untuk admin (login `/admin`).
- **Log aplikasi**: `C:\xampp\htdocs\soera-ai\logs\stdout.log` & `stderr.log` (rotasi otomatis NSSM).
- **Beban**: `Get-Counter` CPU/memori; SQLite cocok untuk ribuan chat/hari pada 1 instance. Skalakan vertikal (RAM/SSD) bila perlu; multi-instance butuh migrasi DB + rate-limit terdistribusi (di luar cakupan).

## 10. Update aplikasi — cara pull terbaru ke server

### 10.1 Repo & kredensial (sekali saja di server)

Repo **publik** (`github.com/turtrsst/sapa-soeradji`) → **tidak perlu login**; `git fetch/pull` langsung jalan anonim. Yang dibutuhkan hanya Git terpasang (`git --version`). Branch produksi = **`main`** (hasil merge PR di GitHub) — server selalu pull dari `main`, bukan branch fitur.

```powershell
cd C:\xampp\htdocs\soera-ai
git status          # harus bersih (nothing to commit) — data/*.sqlite & .env.local sudah di-.gitignore, aman
git remote -v       # origin → https://github.com/turtrsst/sapa-soeradji.git
```

> Bila repo nanti dijadikan privat: buat **Fine-grained PAT** (Contents: Read-only) di GitHub → Settings → Developer settings, lalu `git config credential.helper manager` dan saat `git pull` pertama masukkan PAT sebagai password (tersimpan di Windows Credential Manager). Alternatif: deploy key SSH khusus server (read-only). JANGAN pakai password akun GitHub biasa.

### 10.2 Cara otomatis (disarankan) — backup + pull + build + restart + rollback

```powershell
cd C:\xampp\htdocs\soera-ai
.\scripts\Update-SoeraAI.ps1            # dari origin/main
```
Skrip ini: (1) memastikan tree bersih, (2) **backup SQLite dulu** ke `D:\backup-soera-ai\<tanggal>`, (3) `git fetch` + `merge --ff-only origin/main`, (4) `npm ci`, (5) `npm run build`, (6) `nssm restart SoeraAI` + health-check. **Bila build/verifikasi gagal → rollback otomatis** ke commit sebelumnya (reset --hard + rebuild + restart) dan melaporkan gagalnya. `Install-SoeraAI.ps1 -Update` kini hanya memanggil skrip ini.

### 10.3 Cara manual (bila ingin langkah satu-satu)

```powershell
nssm stop SoeraAI
cd C:\xampp\htdocs\soera-ai
.\scripts\Backup-SoeraAI.ps1                 # backup dulu!
git fetch origin main
git status                                   # pastikan bersih
git merge --ff-only origin/main              # HANYA fast-forward; jika divergen → STOP, investigasi
npm ci
npm run build
nssm start SoeraAI
.\scripts\Verify-SoeraAI.ps1               # semua harus PASS
```

### 10.4 Aturan aman pull di server

- Jangan pernah edit kode langsung di server (`git status` harus bersih; perubahan konten → lewat PR di GitHub)
- Jangan `git pull` tanpa backup; jangan `--force`, jangan `reset --hard` kecuali sadar konsekuensinya
- Update konten tarif/jadwal/kampanye = perubahan repo → PR → merge → pull di server (§10.2)
- Setelah update: cek `stderr.log`, jalankan Verify, dan pantau `/api/health` 15 menit
- Komunikasikan ke Humas/SI sebelum update yang menyentuh tarif/jadwal/branding

Uji dulu alur ini di **PC staging** sebelum dipakai di server produksi.

## 11. AI opsional (setelah aplikasi stabil)

- Biarkan **mode Offline KB** (jawaban dari basis pengetahuan resmi; selalu tersedia, tanpa internet), atau
- Pasang **Ollama** sebagai Windows Service (lihat [`DEPLOYMENT-PUBLIK.md`](DEPLOYMENT-PUBLIK.md) §2C) — disarankan untuk server publik 24/7, atau
- **Jan** di PC petugas untuk demo/pilot (lihat [`PANDUAN-INSTALL-JAN.md`](PANDUAN-INSTALL-JAN.md)).
Aktifkan di `/admin → Pengaturan AI` → Uji Koneksi → simpan → aktifkan.

## 12. Checklist go-live (tanda tangani instrumen RS)

- [ ] `SOERA_ADMIN_USERNAME`/`SOERA_ADMIN_PASSWORD_HASH` diset (bcrypt), `SOERA_ADMIN_SECRET` acak 96-hex
- [ ] Login `/admin` → kartu peringatan hilang (tidak ada lagi warning di `stderr.log` saat start)
- [ ] HTTPS aktif (gembok di browser) + HSTS; `http://` redirect `https://`
- [ ] Firewall hanya 80/443 terbuka (Opsi A: tidak ada port yang dibuka sama sekali); port 3000 loopback saja
- [ ] `<Directory C:/xampp/htdocs/soera-ai> Require all denied` ada di httpd.conf (bila pakai Opsi B)
- [ ] Backup terjadwal + **diuji restore**
- [ ] Monitoring `/api/health` aktif + kontak eskalasi SI
- [ ] Konten: jadwal dokter & tarif sesuai SK terbaru; kontak PIC tiap halaman benar
- [ ] Kebijakan privasi/disclaimer “bukan rekomendasi/resep medis” tercantum (sudah ada) + pemberitahuan pemrosesan data (UU PDP No. 27/2022) disetujui SI & Humas/Hukum RS
- [ ] Percakapan pasien terisolasi per pengunjung (bawaan aplikasi — uji: buka /chat di 2 browser → riwayat tidak tercampur)
- [ ] Pilot internal staf RS minimal 2 minggu sebelum diumumkan publik

## 13. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Apache 403/404 dari domain | `Include conf/extra/soera-ai.conf` belum ada / salah modul; cek `httpd.exe -t` |
| Domain resolve tapi timeout | Tunnel belum jalan (`cloudflared service status`) atau DNS belum menunjuk; cek di Cloudflare |
| 502 Bad Gateway | Service `SoeraAI` mati → `nssm status SoeraAI` (`nssm restart SoeraAI`) |
| `/api/health` OK tapi halaman kosong/500 | Jalankan `npm run build` ulang; cek `stderr.log` |
| Chat selalu “Offline KB” | Endpoint AI belum aktif/benar di `/admin → Pengaturan AI`; klik Uji Koneksi |
| Semua pengunjung melihat “belum ada percakapan” | Itu perilaku benar (isolasi per pengunjung); riwayat hanya muncul di browser yang sama |
| Setelah update, error aneh | `npm ci` ulang (lock berubah) → `npm run build` → `nssm restart SoeraAI` |
| Disk penuh | Rotasi backup (langkah 8); bersihkan `logs\*.log` lama |

## 14. Rollback darurat

```powershell
nssm stop SoeraAI
# kembalikan data dari backup D:\backup-soera-ai\<tanggal>\ ke folder data\
Copy-Item D:\backup-soera-ai\<tanggal>\*.sqlite* "C:\xampp\htdocs\soera-ai\data\" -Force
# bila aplikasi baru bermasalah: git checkout <commit-stabil> && npm ci && npm run build
nssm start SoeraAI
```

---
Pertanyaan lanjutan: baca juga [`DEPLOYMENT-PUBLIK.md`](DEPLOYMENT-PUBLIK.md) (arsitektur, UU PDP, firewall) dan [`../README.md`](../README.md). Jika butuh skrip PowerShell lengkap (installer service + verifikasi otomatis), beri tahu tim SI.
