# SOP Operasional SOERA AI — RSUP Dr. Soeradji Tirtonegoro Klaten

**Dokumen:** SOP-SI-001 · **Versi:** 1.0 · **Tanggal:** 13 November 2026  
**Perangkat:** aplikasi SOERA AI (teknis: Next.js + SQLite, Windows Service `SoeraAI`)  
**Pemilik dokumen:** Instalasi Sistem Informasi (SI) RSUP Dr. Soeradji Tirtonegoro Klaten — berkoordinasi dengan PKRS/Humas  
**Audiens:** petugas SI (L1/L2), admin konten, petugas pengaduan/keluhan  

> ⚠️ **Prinsip keselamatan pasien (wajib diingat):** SOERA AI **bukan alat triase medis**. Pertanyaan kondisi gawat darurat selalu diarahkan ke **IGD 24 Jam (0272) 321020 ext 200** atau **119** — tidak boleh "ditangani" oleh bot. Keluhan medis yang butuh diagnosis/resep **tidak dijawab** — rujuk ke fasilitas resmi.

---

## 1. Peran & Tanggung Jawab

| Peran | Lingkup |
|---|---|
| Petugas SI (L1) | Monitoring harian, restart service, backup check, lapor insiden ke L2 |
| Petugas SI (L2) / vendor | Update aplikasi, perbaikan DB, respons insiden keamanan, koordinasi server |
| Admin konten (Humas/PKRS) | Update kampanye, jadwal dokter, tarif (via repo/tiket SI) |
| Petugas Keluhan (Pengaduan) | Menjawab tiket keluhan & permintaan Soeradji Go Care di Panel Admin |
| Superuser/Kepala SI | Otorisasi perubahan besar (domain, migrasi, restore, rotasi password) |

## 2. Harian (±10 menit, pagi hari kerja)

1. **Health check:** buka `https://<domain>/api/health` → `status:"ok"`, `db:"ok"`. Alternatif: `scripts\Verify-SoeraAI.ps1`.
2. **Service:** `nssm status SoeraAI` → `SERVICE_RUNNING`. Jika tidak → `nssm restart SoeraAI`, lalu cek healthcheck; lapor L2 bila gagal 2×.
3. **Panel Admin** (`/admin`) → tab **Ringkasan**:
   - Tiket keluhan **baru** → balas (lihat alur §6). Target respons pertama: **≤ 1 hari kerja**.
   - Permintaan **Soeradji Go Care** baru → teruskan ke PIC Home Care.
   - Grafik volume chat; perhatikan lonjakan abnormal (indikasi spam → cek §7).
4. **Log error:** cek `C:\xampp\htdocs\soera-ai\logs\stderr.log` (baris ERROR/Exception). Nol-error = sehat; error berulang → lapor L2.
5. **Disk** drive `C:`/`D:` — tersisa ≥ 20% (SQLite & backup butuh ruang).

## 3. Mingguan (30 menit)

1. **Backup:** cek folder backup terbaru (`D:\backup-soera-ai\<tanggal>\`) — file `.sqlite` ada & ukuran > 0 untuk 7 hari terakhir.
2. **Uji restore ringkas:** salin 1 file backup ke folder sementara, buka dengan DB Browser for SQLite → tabel `messages` terhitung. (Jangan restore ke live!)
3. **Feedback pengguna:** di admin statistik, periksa rasio 👍/👎; unfeedback negatif direspons via pembaruan konten KB (lihat §8).
4. **Kuota AI:** perhatikan pengguna yang sering mentok 5/hari (pertanyaan bebas) — biasanya pertanyaan layanan yang belum terakomodasi template → usulkan penambahan KB.
5. **Konten:** cek kampanye kedaluwarsa → nonaktifkan (toggle di admin); usulkan kampanye baru ke Humas.

## 4. Bulanan

1. **Uji restore penuh:** ke mesin staging — restore backup terakhir → aplikasi jalan → chat & tiket terbaca. Catat hasil (lampiran berita acara).
2. **Audit akses admin:** siapa yang punya kredensial `/admin`; cabut yang tidak berwenang; cek `logs\stdout.log` — upaya login gagal beruntun (>20/jam dari IP sama) → lapor L2, pertimbangkan tambah rule firewall/Cloudflare.
3. **Rotasi password admin** (lihat §5) — minimal **setiap 3 bulan** atau segera setelah petugas berwenang pindah tugas.
4. **Dependensi:** `npm audit` di mesin staging — bila ada temuan **high/critical**, jadwalkan update (lihat §9).
5. **UU PDP:** tinjau apakah percakapan tersimpan lebih dari kebutuhan — diskusikan retensi (disarankan 90 hari) & pemusnahan berkala dengan Humas/Hukum.

## 5. Prosedur Rotasi Password Admin

1. Buat password baru kuat (≥ 14 karakter, acak).
2. Buat hash bcrypt: `node -e "console.log(require('bcryptjs').hashSync('PASSWORD-BARU', 12))"` di folder aplikasi.
3. Update environment service: `nssm set SoeraAI AppEnvironmentExtra "SOERA_ADMIN_SECRET=<secret-lama-atau-baru>" "SOERA_ADMIN_PASSWORD_HASH=<hash-baru>" "SAPA_DATA_DIR=C:\xampp\htdocs\soera-ai\data" "SOERA_PUBLIC_URL=<url>" "NODE_ENV=production"` (gunakan `nssm edit SoeraAI` untuk UI) — password plain-text **tidak pernah** ditulis di mana pun.
4. `nssm restart SoeraAI` → login `/admin` dengan password baru → pastikan jalan.
5. Catat rotasi di buku log SI (tanggal, oleh siapa).

## 6. Alur Penanganan Tiket Pasien (Keluhan & Soeradji Go Care)

```
Pasien kirim → tiket SKT-YYYYMMDD-XXXXXX / pengajuan Go Care masuk Panel Admin
  → L1 triage harian:
      • Kegawatdaruratan/triase medis   → JANGAN diproses bot/admin; arahkan IGD (0272) 321020 ext 200 / 119. Telepon balik bila identitas jelas.
      • Pertanyaan faktual (jadwal/tarif/pendaftaran) → balas dengan template resmi + tautan portal.
      • Keluhan layanan (antrean, sikap petugas, billing) → teruskan ke unit terkait; tanggapan awal ≤ 1 hari kerja; SLA penyelesaian sesuai kebijakan RS (disarankan ≤ 7 hari kerja).
      • Permintaan Home Care → koordinator Go Care (perawat/penjaminan) — verifikasi kelengkapan (identitas, lokasi, jenis layanan, ketersediaan jadwal).
  → Catat jawaban di panel (berkirim via admin); perubahan status: baru → diproses → selesai/ditolak
  → Balasan terekam di tiket (pasien bisa cek status via /keluhan dengan nomor tiket)
```
**Dilarang:** memberikan diagnosis, rekomendasi obat/dosis, kepastian biaya di luar tarif SK, atau data pribadi pasien lain.

## 7. Insiden & Eskalasi

| Insiden | Tindakan L1 | Eskalasi |
|---|---|---|
| Aplikasi mati total | `nssm restart SoeraAI`; cek log; cek disk; cek port 3000 | L2 bila > 15 menit down |
| Spam/penyalahgunaan chat | Catat IP/waktu; aktifkan rule rate-limit Cloudflare | L2 (blok IP/WAF) |
| Indikasi kebocoran data / akses tidak sah `/admin` | **Segera**: ganti password admin (§5), kumpulkan log, informasikan Kepala SI & Humas | L2 + Kepala SI + Keamanan RS |
| Dugaan pelanggaran UU PDP | Hentikan ekspor/penyebaran data; amankan bukti; lapor Kepala SI | Resmi ke Kepala RS & Pejabat Pelindung Data (bila ditunjuk) |
| Konten salah (jadwal/tarif) dilaporkan | Nonaktifkan jawaban? → lapor Humas/SI untuk koreksi repo | L2 (perbaikan + deploy ulang) |
| Bencana (server rusak/hilang) | Restore dari backup terakhir ke server pengganti (§PANDUAN §14) | Kepala SI |

## 8. Perubahan Konten & Rilis

1. Semua perubahan konten/kode lewat **GitHub (pull request)** — reviewer minimal 1 orang (SI).
2. Tarif hanya valid sesuai **SK Dirut RST No. HK.02.03/D.XXVI/5441/2024**; jadwal dokter mengikuti pembaruan Kemenkes RI/RS — Humas wajib memberi stempel "sesuai SK" sebelum rilis.
3. Prosedur rilis: PC staging → `git pull && npm ci && npm run build && npm test` → RDP ke server → `scripts\Install-SoeraAI.ps1 -Update` → `scripts\Verify-SoeraAI.ps1` → umumkan ke Humas.
4. Tag rilis di Git (`v1.x.y`) + catat di Changelog (buat `CHANGELOG.md` saat rilis pertama publik).

## 9. Patch & Pembaruan Dependensi

- Jadwal: `npm audit` bulanan (§4.4). Update **hanya** lewat staging; jangan `npm audit fix --force` di server.
- Node.js: ikuti LTS; validasi ulang jadwal dokter/tarif setiap rilis besar Next.js.
- Backup sebelum setiap update (jalankan `Backup-SoeraAI.ps1` manual).

## 10. Checklist Audit Triwulan (untuk Kepala SI)

- [ ] §2–§4 log pelaksanaan terisi 3 bulan terakhir
- [ ] Restore test terakhir berhasil (berita acara terlampir)
- [ ] Password admin & secret dirotasi ≤ 3 bulan lalu; tidak ada kredensial default
- [ ] Akses /admin hanya petugas berwenang (daftar user cocok dengan SK tugas)
- [ ] Inventaris domain/DNS/sertifikat HTTPS valid ≥ 30 hari ke depan
- [ ] Tidak ada PII pasien di log aplikasi (`logs\*.log` — spot check 50 baris)
- [ ] Backup off-site/drive lain (bukan hanya volume yang sama) tersedia
- [ ] Daftar kontak vendor/eskalasi (SI, NSSM, Cloudflare, hosting domain) terbarui

## 11. Lampiran — Perintah Cepat

```powershell
nssm status SoeraAI                       # status service
nssm restart SoeraAI                      # restart
Get-Content logs\stderr.log -Tail 50      # log error terakhir
scripts\Verify-SoeraAI.ps1                 # health-check ringkas
scripts\Backup-SoeraAI.ps1                 # backup manual sekarang
schtasks /run /tn "SoeraAI Backup SQLite"  # picu backup terjadwal
sqlite3 (opsional): .\data\soera-ai.sqlite
```

**Kontak (sesuaikan dengan RS):** SI duty officer · Humas/PKRS (0272) 321020 · Keamanan RS · vendor hosting domain.
