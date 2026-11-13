# Panduan Install PrivateLM (cross-platform-llm-client) untuk SOERA AI

Tujuan: menjalankan model AI **100% offline di perangkat** (Android/iOS/iPad) sebagai mesin jawaban SOERA AI — pasien bertanya, model lokal menjawab; tanpa internet, data tidak keluar rumah sakit.

Sumber resmi: https://github.com/orailnoor/cross-platform-llm-client
Lisensi: MIT · Nama aplikasi: **PrivateLM**

> Ringkasan 3 langkah besar: (1) pasang PrivateLM + model GGUF di perangkat, (2) aktifkan API Server (port 8080 + API key), (3) arahkan SOERA AI `/admin → Pengaturan AI` ke endpoint itu.

---

## A. Kebutuhan Perangkat

| Perangkat | Minimal | Disarankan |
|---|---|---|
| Android | Android 9 (Pie) / arm64-v8a, RAM 4 GB | Android 11+, RAM 6–8 GB, Snapdragon/Dimensity dengan Vulkan |
| iOS | iPhone/iPad iOS 15+, RAM 4 GB | iPad M1/M2 (Metal GPU, RAM 8 GB) |
| Penyimpanan | APK ~40–135 MB + model 1–5 GB | SSD/flash lega ≥ 8 GB |
| Jaringan | LAN/WiFi yang sama dengan server SOERA AI | WiFi khusus/VLAN, tanpa "client/AP isolation" |

Pilih ukuran model sesuai RAM:
- RAM 4 GB → **Qwen2.5-1.5B-Instruct Q4_K_M** (~1,0 GB) atau **Llama-3.2-1B Q4_K_M**
- RAM 6 GB → **Qwen2.5-3B / Llama-3.2-3B Q4_K_M** (~2,0 GB)
- RAM 8 GB+ / iPad M1 → **Llama-3.1-8B Q4_K_M** (~4,7 GB) — kualitas jawaban jauh lebih baik

(Untuk klaster banyak HP: lihat fitur **Phone Cluster** di aplikasi; model 26B dapat dibagi di beberapa perangkat — di luar cakupan panduan dasar ini.)

## B. Instalasi di Android (termudah — via APK resmi)

1. Di HP, buka browser → halaman rilis: `https://github.com/orailnoor/cross-platform-llm-client/releases`
2. Unduh APK varian untuk perangkat (Android modern):
   - **PrivateLM-1.0.7.apk** (rilis terbaru 1.0.7-cluster, 135 MB, Android 9+, arm64+x86) — https://github.com/orailnoor/cross-platform-llm-client/releases/download/1.0.7-cluster/PrivateLM-1.0.7.apk
   - atau **app-arm64-v8a-release.apk** (84 MB, khusus HP modern 64-bit) — https://github.com/orailnoor/cross-platform-llm-client/releases/download/1.0.7/app-arm64-v8a-release.apk
   - atau **app-universal-release.apk** (134 MB, aman bila ragu) — https://github.com/orailnoor/cross-platform-llm-client/releases/download/1.0.7/app-universal-release.apk
3. Buka file APK → bila diminta, aktifkan **"Izinkan instal dari sumber ini"** (Settings → Apps → Chrome/Files → Install unknown apps) → **Install**.
4. Buka aplikasi **PrivateLM** → izinkan akses file/penyimpanan → aplikasi terbuka di halaman chat.
5. (Bila muncul Play Protect: pilih *Install anyway* — APK ini dari repo resmi GitHub; tetap waspada & hanya unduh dari link di atas.)

## C. Mengunduh & Memuat Model GGUF

1. Di PrivateLM buka menu model (ikon chat/**Models**) → pilih model dari katalog (mis. Qwen2.5-1.5B/3B Instruct Q4_K_M) → **Download** (unduhan via Hugging Face, butuh sekali saja koneksi internet).
   - Alternatif manual: unduh file `.gguf` dari huggingface.co, lalu *Import* melalui file picker di aplikasi.
2. Setelah unduh selesai → pilih model → **Load Model** → tunggu status **"Loaded"** (pertama kali 30–90 detik; indikator persentase tampil).
3. Coba chat di dalam PrivateLM — pastikan menjawab dengan wajar. Jika berhasil, model lokal siap dipakai jaringan.

## D. Mengaktifkan API Server (inti integrasi)

1. PrivateLM → **Settings → API Server** (panel server bawaan).
2. Aktifkan server (toggle **ON**) — berjalan di **port 8080**.
3. Aktifkan **Allow network access** (agar bisa diakses dari PC/server SOERA AI, bukan hanya loopback HP).
4. Isi **API Key** (buat kata sandi acak, mis. 20 karakter) — **wajib** untuk akses jaringan; tanpa ini server menolak permintaan dari perangkat lain.
5. Catat **alamat IP HP** yang tampil di layar server (mis. `http://192.168.1.10:8080`).
6. Uji dari PC/server SOERA AI (browser/terminal):
   ```bash
   curl http://192.168.1.10:8080/health      # {"status":"ok"}
   curl http://192.168.1.10:8080/v1/models   # menampilkan model yang sedang dimuat
   curl -X POST http://192.168.1.10:8080/v1/chat/completions \
     -H "Authorization: Bearer API_KEY_ANDA" -H "Content-Type: application/json" \
     -d '{"model":"apa-saja","messages":[{"role":"user","content":"Halo"}],"max_tokens":32}'
   ```
   (Server melayani model apa pun namanya — SOERA AI boleh mengirim `model: model-lokal-privatelm`.)
7. **Stabilkan IP HP**: di router/access point SOERA AI set **DHCP reservation/MAC binding** untuk MAC HP (mis. selalu 192.168.1.10), atau gunakan WiFi khusus. Aktifkan *keep screen on/app in foreground* sesuai panduan aplikasi (HP berjalan lebih cepat saat aplikasi tampil — fitur bawaan PrivateLM).

## E. Menghubungkan ke SOERA AI

1. Login `http://<server-soera-ai>:3000/admin` → tab **Pengaturan AI (Offline)**.
2. Pilih preset **PrivateLM API Server (Offline — perangkat ini/LAN)** atau **PrivateLM di perangkat lain (LAN/WiFi)**.
3. Isi:
   - Base URL: `http://<IP-HP>:8080/v1`
   - API Key: sama dengan langkah D4 (tersimpan aman di server, tidak bocor ke browser)
   - Model: `model-lokal-privatelm` (boleh nama apa pun — server menyajikan model yang dimuat)
   - Temperature 0.4, Max Tokens 900 (default cukup)
4. Klik **Uji Koneksi Sekarang** → harus tampil ✓ dengan nama model.
5. Aktifkan toggle mesin AI → **Simpan Pengaturan**.
6. Uji dari pasien: tanyakan *"apakah batuk berdahak itu bahaya?"* — jika jawaban berlabel **AI Lokal/Online** (bukan "Offline KB"), integrasi berhasil.

## F. Instalasi di iOS / iPad

- Cara termudah: **AltStore + AltServer** (butuh Mac/PC, Apple ID):
  1. Pasang AltServer di komputer (altstore.io) → sambungkan iPhone/iPad → pasang **AltStore** di perangkat.
  2. Unduh **PrivateLM.ipa.zip** dari halaman rilis (rilis 1.0.3) → ekstrak jadi `.ipa` → buka di AltStore (Share → AltStore) / "+" di My Apps.
  3. iOS 16+: Settings → Privacy & Security → **Developer Mode: ON** → restart → buka PrivateLM.
  4. Sideload berlaku 7 hari (AltStore auto-refresh bila perangkat se-WiFi dengan AltServer).
- iPad M1/M2 sangat direkomendasikan (Metal GPU). iPhone RAM besar juga bisa, model ≤ 3B.
- Alternatif: build sendiri dengan Flutter (lihat G) lalu pasang via TestFlight/Ad Hoc (butuh Apple Developer Program US$99/th).

## G. Build dari Source (Developer)

Prasyarat: **Flutter SDK ≥ 3.3** (proyek kompatibel Flutter 3.38), **Android SDK API 26+ (minSdk 28)**, **JDK 17**, **NDK** (bundled), untuk iOS: macOS + Xcode + CocoaPods.

```bash
git clone https://github.com/orailnoor/cross-platform-llm-client.git
cd cross-platform-llm-client
flutter pub get
flutter build apk --release --split-per-abi   # hasil: build/app/outputs/flutter-apk/*.apk
# iOS: cd ios && pod install && flutter build ios
```

Web (`flutter build web`) hanya bisa cloud API — **tidak** mendukung inferensi lokal.

## H. Troubleshooting

| Gejala | Solusi |
|---|---|
| PC tidak bisa buka `http://IP:8080/health` | Pastikan HP & PC satu WiFi/VLAN; matikan **AP/client isolation** di access point; cek firewall Windows/Linux; IP HP berubah → cek DHCP lease/reservation |
| `401 Unauthorized` dari SOERA AI | API key tidak sama / kosong di salah satu sisi; samakan di Settings → API Server ↔ Pengaturan AI |
| `429 Model is busy` | Satu generasi jalan sekali; tunggu respons selesai atau hentikan dari aplikasi HP |
| Jawaban sangat lambat | Pakai model lebih kecil/Q4_K_M; tutup app lain; HP panas → istirahatkan (throttling) |
| SOERA AI masih "Offline KB" meski AI "aktif" | Endpoint tidak terjangkau/timeout/key salah → cek *Uji Koneksi* di panel admin; lihat log terminal `npm start` |
| Layar HP mati → server lamban | Aktifkan keep-screen-on di aplikasi / colok charger / jalankan di tablet khusus "AI server" |

**Keamanan:** jangan pernah mem-port-forward port 8080 ke internet; jangan taruh API key di tempat publik; ganti key berkala; perangkat khusus AI (tablet terpasang permanen + charger) paling andal untuk operasional 24/7.

---

> **Akan dipublikasikan di IP publik untuk pasien?** Baca [`DEPLOYMENT-PUBLIK.md`](DEPLOYMENT-PUBLIK.md) — di server web yang benar adalah llama-server (engine yang sama dengan PrivateLM), bukan APK mobile; ada juga checklist HTTPS, firewall, rate limit, dan kepatuhan UU PDP.
