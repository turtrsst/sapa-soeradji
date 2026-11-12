// Basis pengetahuan SAPA PASIEN — dokumen referensi RSUP Dr. Soeradji Tirtonegoro Klaten
// Setiap dokumen diberi tag kata kunci untuk pencarian offline (RAG).

export interface KbDoc {
  id: string;
  title: string;
  tags: string[];
  body: string;
  source: string;
  updated: string;
}

export const KB_DOCS: KbDoc[] = [
  {
    id: 'profil',
    title: 'Profil RSUP Dr. Soeradji Tirtonegoro Klaten',
    tags: ['profil', 'tentang', 'rsc', 'rsup', 'rst', 'rumah sakit', 'kelas a', 'sejarah', 'vertikal', 'kemenkes', 'akreditasi', 'soeradji', 'tirtonegoro'],
    updated: '2026-11',
    source: 'rsupsoeradji.id / rssoeradji.go.id',
    body: `RSUP Dr. Soeradji Tirtonegoro Klaten (sering disebut RST / RS Soeradji) adalah Rumah Sakit Umum Pusat Kelas A milik Pemerintah Republik Indonesia di bawah Kementerian Kesehatan RI (RS vertikal), berbentuk Badan Layanan Umum (BLU). Alamat: Jalan KRT Dr. Soeradji Tirtonegoro No. 1, Kelurahan/Desa Tegalyoso, Kecamatan Klaten Selatan, Kabupaten Klaten, Jawa Tengah 57424.

Sejarah singkat: didirikan tahun 1927 oleh perkebunan milik Pemerintah Hindia Belanda dengan nama Rumah Sakit Dr. Scheurer. Tahun 1946 ditunjuk sebagai pusat pendidikan kedokteran Fakultas Kedokteran Universitas Gadjah Mada (UGM). Pada tahun 1997 nama berubah menjadi RSUP Dr. Soeradji Tirtonegoro.

RST merupakan rumah sakit rujukan utama di kawasan Jawa Tengah bagian selatan dengan penekanan pada pelayanan kardiologi dan pembuluh darah, hematologi-onkologi, bedah digestif, bedah saraf, dan orthopedi. RST terakreditasi dan bekerja sama dengan UGM dalam pendidikan, pelatihan, dan penelitian. Slogan resmi: "Bersih. Nyaman. Akurat". RST juga menyelenggarakan program SPELING (Spesialis Keliling) untuk mendekatkan layanan spesialistik ke kecamatan-kecamatan di Kabupaten Klaten.`,
  },
  {
    id: 'kontak',
    title: 'Kontak dan Alamat Resmi',
    tags: ['kontak', 'telepon', 'nomor', 'alamat', 'lokasi', 'maps', 'fax', 'email', 'telpon', 'hubungi', 'call center', 'hotline', 'pengaduan'],
    updated: '2026-11',
    source: 'rsupsoeradji.id',
    body: `Kontak resmi RSUP Dr. Soeradji Tirtonegoro Klaten:
- Alamat: Jalan KRT Dr. Soeradji Tirtonegoro No. 1, Tegalyoso, Klaten Selatan, Kabupaten Klaten, Jawa Tengah 57424
- Contact Center / Informasi: (0272) 321020
- IGD / SPGDT: (0272) 321020 ekstensi 200 (24 jam)
- Faksimile: (0272) 321104
- Email: rsupsoeradji_klaten@yahoo.com
- WhatsApp pendaftaran rawat jalan: 0816-9170-00 (wa.me/62816917000)
- Hotline pengaduan/perlindungan: +62 851-7957-7302 (telepon/WhatsApp)
- Instagram: @rssoeradjitirtonegoro
- Website: https://rsupsoeradji.id (portal resmi dua bahasa)
- Google Maps: maps.app.goo.gl/Dg4VaQR88kVLfsS36 (buka "KRT Dr. Soeradji Tirtonegoro No. 1 Tegalyoso" di Google Maps)
- Aplikasi mobile resmi: E-Yang Soeradji

Untuk keadaan DARURAT (gawat darurat) segera hubungi IGD di (0272) 321020 ext 200 atau datang langsung ke IGD — tidak perlu mendaftar lebih dulu.`,
  },
  {
    id: 'jam-layanan',
    title: 'Jam Layanan dan Operasional',
    tags: ['jam', 'buka', 'tutup', 'operasional', 'besuk', 'kunjung', 'jam besuk', 'jam praktik', 'jam pelayanan', 'pendaftaran jam', 'sabtu', 'minggu', 'libur'],
    updated: '2026-11',
    source: 'rsupsoeradji.id / sippn.menpan.go.id',
    body: `Jam operasional RSUP Dr. Soeradji Tirtonegoro Klaten:
- IGD: 24 jam setiap hari (termasuk Minggu dan hari libur nasional)
- Pendaftaran rawat jalan (loket): Senin–Kamis 07.30–14.00 WIB; Jumat 07.30–14.30 WIB
- Pelayanan poliklinik: Senin–Kamis 07.30–16.00 WIB; Jumat 07.30–16.30 WIB
- Pendaftaran online (H-7 s/d H-1): Senin–Jumat 07.30–14.00 WIB
- Jam berkunjung (besuk): 17.00–19.00 WIB
- Hari Sabtu/Minggu/libur nasional: poliklinik tutup, IGD dan rawat inap tetap berjalan

Catatan: jadwal poli dapat berubah sewaktu-waktu. Konfirmasi ke Contact Center (0272) 321020 sebelum berkunjung.`,
  },
  {
    id: 'pendaftaran-online',
    title: 'Cara Pendaftaran Online Rawat Jalan (WhatsApp)',
    tags: ['daftar online', 'pendaftaran online', 'wa', 'whatsapp', 'antrian', 'registrasi online', 'h-7', 'h-1', 'booking', 'daftar'],
    updated: '2026-11',
    source: 'rsupsoeradji.id / jadwalpraktek.com',
    body: `Pendaftaran online rawat jalan RST dapat dilakukan melalui WhatsApp ke 0816-9170-00.

Format pesan (sesuai ketentuan): ketik Daftar (spasi) Nomor Rekam Medik (spasi) Nama Pasien (spasi) Klinik/Poli Tujuan (spasi) Tanggal Pemeriksaan. Contoh: Daftar 1234567 Budi Santoso Poli Penyakit Dalam 20-11-2026

Ketentuan penting:
- Pendaftaran online dibuka H-7 sampai maksimal H-1 sebelum hari pemeriksaan, pukul 07.30–14.00 WIB (Sabtu/Minggu/libur nasional tidak dihitung).
- Siapkan: Kartu BPJS (bila pasien BPJS) atau KTP, serta surat rujukan atau perintah kontrol.
- Lampirkan persyaratan registrasi sesuai permintaan admin.
- Setelah admin menyetujui, datang 30 menit sebelum jadwal dan lakukan daftar ulang (check-in) dengan menunjukkan nomor antrian dari admin.
- Pasien baru/konsul dari klinik lain dapat membuat perjanjian lewat WhatsApp Center atau datang langsung.
- Saat tiba: konfirmasi kehadiran, check-in dan sidik jari (fingerprint) di meja Administrasi IRM, lalu daftar di loket (bila tanpa perjanjian). Petugas memverifikasi identitas dengan nama lengkap dan tanggal lahir; berkas asuransi diverifikasi oleh petugas; pembayaran di kasir untuk pasien umum; pasien BPJS diverifikasi rujukan.

Alternatif: datang langsung ke loket pendaftaran pada jam layanan.`,
  },
  {
    id: 'igd-darurat',
    title: 'Instalasi Gawat Darurat (IGD) dan Kondisi Darurat',
    tags: ['igd', 'gawat darurat', 'darurat', 'spgdt', '119', 'ambulan', 'kejadian', 'kecelakaan', 'sesak', 'nyeri dada', 'stroke', 'henti jantung', 'pendarahan'],
    updated: '2026-11',
    source: 'rsupsoeradji.id',
    body: `IGD RSUP Dr. Soeradji Tirtonegoro buka 24 JAM, termasuk hari raya dan libur nasional. Telepon: (0272) 321020 ext 200. Untuk darurat medis mengancam jiwa (nyeri dada hebat/curiga serangan jantung, sesak napas berat, stroke — mulut mencong/lemas sebelah/pelo, kecelakaan, perdarahan hebat, kejang, penurunan kesadaran, henti napas/henti jantung): SEGERA ke IGD terdekat atau hubungi 119 (layanan gawat darurat nasional) / (0272) 321020 ext 200. Jangan menunggu antrean online.

Petunjuk pertolongan pertama sambil menuju IGD:
- Henti napas/henti jantung: lakukan CPR bila terlatih, hubungi 119.
- Nyeri dada: istirahat, duduk tegak, jangan menyetir sendiri ke RS.
- Stroke: catat jam muncul gejala, jangan beri makan/minum.
- Kecelakaan: hentikan perdarahan dengan penekanan kain bersih, jangan pindahkan korban dengan leher/punggung cedera kecuali terancam bahaya langsung.

SPGDT (Sistem Penanggulangan Gawat Darurat Terpadu) RST dapat dihubungi di ext 200 untuk koordinasi tanggap darurat.`,
  },
  {
    id: 'layanan-unggulan',
    title: 'Layanan Unggulan RST',
    tags: ['layanan unggulan', 'unggulan', 'pci', 'kardiologi', 'jantung', 'bedah digestif', 'laparoskopi', 'evla', 'vaskuler', 'orthopedi', 'hip', 'knee', 'bedah saraf', 'hematologi', 'onkologi', 'kanker', 'darah'],
    updated: '2026-11',
    source: 'rsupsoeradji.id (Layanan Unggulan)',
    body: `Layanan unggulan RSUP Dr. Soeradji Tirtonegoro Klaten:
1. Kardiologi Intervensi — PCI (Percutaneous Coronary Intervention) dan Rotablator untuk penyakit jantung koroner.
2. Bedah Digestif — Digestive Laparoscopic Surgery (bedah minimal invasif saluran cerna).
3. Bedah Vaskuler & Endovaskuler — EVLA (Endovenous Laser Ablation) untuk varises/penyakit pembuluh vena.
4. Orthopedi — Hip & Knee (sendi pinggul dan lutut), termasuk layanan spine (tulang belakang).
5. Bedah Saraf.
6. Hematologi Onkologi Medik — penatalaksanaan kelainan darah paripurna, bertaraf level Asia.
7. Bedah Jantung Anak (poli bedah jantung anak).
8. Penatalaksanaan Kelainan Darah Paripurna — fokus utama rumah sakit (trombofilia, thalassemia, hemofilia, leukemia, dll).
9. Layanan kanker & kemoterapi, hemodialisa, serta pelayanan darah (Unit Pengelola Darah/UTD) terintegrasi.

Layanan dilakukan oleh dokter spesialis dan subspesialis dengan fasilitas penunjang modern (laboratorium, radiologi/pencitraan, kateterisasi jantung, kamar bedah sentral, ICU/NICU/PICU, rehabilitasi medik).`,
  },
  {
    id: 'mcu',
    title: 'Medical Check Up (MCU) dan Poli Eksekutif',
    tags: ['mcu', 'medical check up', 'check up', 'executive', 'eksekutif', 'paket', 'screening', 'skrining', 'kesehatan berkala'],
    updated: '2026-11',
    source: 'rsupsoeradji.id (Poli Eksekutif & MCU)',
    body: `RST menyediakan Paket Medical Check Up (lihat dokumen resmi di situs RS: "paket medical check up.pdf", diperbarui Juni 2026) dan Layanan Eksekutif:
- Poliklinik Eksekutif: fasilitas eksklusif, waktu fleksibel, pendampingan medis penuh.
- MCU Eksekutif: waktu tunggu lebih singkat dengan sistem layanan prioritas.
- Paket konsultasi jantung eksekutif: konsultasi jantung fokus, nyaman, profesional.
- Paket tindak lanjut perawatan jantung.

Informasi paket & biaya MCU: hubungi Contact Center (0272) 321020 atau WhatsApp 0816-9170-00, atau datang ke loket Informasi/IRM. Tarif tindakan mengacu pada Peraturan Menteri Kesehatan/tarif BLU RST yang berlaku.`,
  },
  {
    id: 'home-care',
    title: 'Home Care Go-Trah (Pelayanan di Rumah)',
    tags: ['home care', 'homecare', 'go-trah', 'kunjung rumah', 'perawatan rumah', 'visite', 'dokter visit', 'layanan rumah'],
    updated: '2026-11',
    source: 'sias.rsupsoeradji.id (Soeradji GOCARE) / rsupsoeradji.id',
    body: `Home Care Go-Trah adalah layanan kesehatan RSUP Dr. Soeradji Tirtonegoro yang mengantarkan pelayanan medis dan keperawatan langsung ke rumah pasien (rawat jalan di rumah), antara lain untuk pasien pasca rawat inap, lansia, disabilitas, atau yang sulit bepergian ke rumah sakit.

Layanan mencakup (sesuai SK Direktur Utama HK.02.03/D.XXVI/5441/2024): tindakan medik non operatif (pemasangan NGT/cateter, infus, injeksi, nebuliser, perawatan luka, pengambilan darah), pemeriksaan laboratorium sederhana (GDS, asam urat, kolesterol, darah rutin), rehabilitasi medik/fisioterapi di rumah, kunjungan dokter umum/spesialis/subspesialis, konsultasi psikologi, serta sewa alat medik (tempat tidur & oksigen konsentrator).

Pemesanan online resmi tersedia di Soeradji GOCARE: https://sias.rsupsoeradji.id/homecare/ — ketik/ucapkan kebutuhan ke asisten "Sora" (mis. "perawatan luka untuk ibu, besok pagi di Klaten"), lalu pesanan langsung masuk antrean verifikasi dengan kode pesanan & notifikasi tiap tahap (verifikasi, kunjungan, selesai). Katalog 80+ layanan: Tindakan Medik & Perawatan, Pemeriksaan Laboratorium, Rehabilitasi & Fisioterapi, Kunjungan Dokter & Psikolog, Sewa Alat Medik. Tarif sesuai SK Direktur ditampilkan sebelum memesan; pemesanan minimal H-1; perlu akun (pendaftaran gratis).

Cara lain mengajukan: hubungi Contact Center (0272) 321020 atau WhatsApp 0816-9170-00 / datang ke bagian pelayanan (IRM) dengan membawa rekam medis/ringkasan pulang. Petugas akan menjadwalkan kunjungan. Tarif tindakan Home Care sesuai SK terbaru (berlaku sejak 18 Maret 2024); bila lebih dari satu tindakan dilakukan, jasa pelaksana hanya dihitung satu kali.

Rincian tarif lengkap dapat ditanyakan ke SAPA PASIEN (misal: "berapa tarif pasang infus home care?") atau lihat tabel di halaman Home Care aplikasi ini.`,
  },
  {
    id: 'tarif-home-care',
    title: 'SK Tarif Tindakan Home Care 2024 (Ringkasan)',
    tags: ['tarif', 'biaya', 'harga', 'sk', 'keputusan direktur', 'tarif home care', 'jasa sarana', 'jasa pelayanan', 'bayar', 'pembayaran home care'],
    updated: '2024-03-18',
    source: 'SK Dirut RST No. HK.02.03/D.XXVI/5441/2024 (18 Maret 2024)',
    body: `Dasar tarif Home Care: Keputusan Direktur Utama RSUP Dr. Soeradji Tirtonegoro Klaten Nomor HK.02.03/D.XXVI/5441/2024 tanggal 18 Maret 2024 tentang Tarif Tindakan Pelayanan Home Care (mencabut SK No. HK.02.03/D.XXVI/24514/2023). Ditandatangani Plt. Direktur Utama Sholahuddin Rhatomy.

Struktur tarif = Jasa Sarana + Jasa Pelayanan. Contoh: Perawatan luka kecil Rp120.000; Pasang infus Rp125.000; Injeksi Rp120.000; Nebuliser Rp110.000; Perawatan luka sedang Rp130.000; luka besar Rp180.000; Pijat bayi Rp110.000 (30 menit); Kunjungan dokter umum Rp150.000; dokter spesialis Rp225.000; sub spesialis Rp275.000; konsultasi psikologi Rp125.000; visite = belum termasuk obat/BMHP di luar paket tindakan.

Laboratorium: GDS stik Rp120.000; Asam urat Rp120.000; Kolesterol total Rp120.000; Darah rutin Rp120.000; SGOT/SGPT Rp130.000; Kultur Rp548.000. Rehabilitasi medik umumnya Rp110.000–Rp170.000 per tindakan (TENS/Infra Red Rp115.000).

Sewa alat per hari: Tempat tidur Rp24.000; Oksigen konsentrator Rp12.000.

Catatan penting: Jika pelaksanaan Home Care lebih dari satu tindakan, jasa pelaksana (Jasa Pelayanan) hanya dihitung satu kali. Biaya dapat berbeda bila ada tindakan di luar lampiran SK; konfirmasi ke kasir/bagian pelayanan. Dokumen SK resmi terlampir di aplikasi SAPA PASIEN pada halaman Home Care.`,
  },
  {
    id: 'keluhan-pengaduan',
    title: 'Cara Menyampaikan Keluhan, Kritik, dan Saran',
    tags: ['keluhan', 'komplain', 'kritik', 'saran', 'pengaduan', 'lapor', 'kecewa', 'kurang puas', 'hotline', 'kotak saran', 'feedback'],
    updated: '2026-11',
    source: 'rsupsoeradji.id / rssoeradji.go.id',
    body: `Saluran resmi pengaduan dan saran RSUP Dr. Soeradji Tirtonegoro:
- Hotline pengaduan: +62 851-7957-7302 (telepon/WhatsApp) — "Hubungi hotline (telepon atau WhatsApp)" untuk perlindungan/pengaduan
- Kotak saran/kritik tersedia di area rumah sakit
- Contact Center: (0272) 321020
- Email: rsupsoeradji_klaten@yahoo.com
- Aplikasi SAPA PASIEN: gunakan menu Keluhan untuk membuat tiket pengaduan tercatat & dapat dilacak statusnya
- Survei Kepuasan Masyarakat (IKM) periode September 2026 tersedia daring/luring — partisipasi Anda membantu peningkatan mutu layanan

Setiap pengaduan akan ditindaklanjuti bagian terkait; sertakan nama, nomor rekam medis/nomor telepon, unit pelayanan, dan kronologi singkat agar penanganan lebih cepat.`,
  },
  {
    id: 'bpjs-asuransi',
    title: 'BPJS Kesehatan dan Asuransi yang Diterima',
    tags: ['bpjs', 'kis', 'asuransi', 'jaminan', 'rujukan', 'surat rujukan', 'umum', 'perusahaan', 'jaminan kesehatan', 'ina-cbg', 'klaim'],
    updated: '2026-11',
    source: 'rsupsoeradji.id / sippn.menpan.go.id',
    body: `RST menerima pasien dengan berbagai skema pembiayaan:
- BPJS Kesehatan/KIS: wajib membawa kartu BPJS (fisik/digital) dan surat rujukan dari FKTP (puskesmas/klinik) atau perintah kontrol dari RST; tanpa rujukan, pasien BPJS pada kondisi tertentu dapat dikenakan biaya umum.
- Perusahaan/asuransi swasta: verifikasi berkas (kartu, surat jaminan/guarantee letter) di bagian pendaftaran/IRM.
- Pasien umum (mandiri): pembayaran di kasir setelah pendaftaran/pelayanan.

Alur pasien BPJS rawat jalan: daftar di FKTP → dapat rujukan → daftar online (H-7..H-1) atau loket → check-in IRM + fingerprint → poli. Untuk layanan IGD: langsung ke IGD, berkas menyusul.

Tarif untuk pasien umum mengacu pada tarif BLU RST yang ditetapkan dengan Peraturan/Keputusan Direksi; tarif BPJS mengikuti INA-CBGs.`,
  },
  {
    id: 'fasilitas',
    title: 'Fasilitas dan Penunjang Medis',
    tags: ['fasilitas', 'radiologi', 'laboratorium', 'farmasi', 'apotek', 'icu', 'nicu', 'picu', 'hemodialisa', 'fisioterapi', 'rehabilitasi', 'ambulans', 'gizi', 'kantin', 'parkir', 'atm', 'mushola'],
    updated: '2026-11',
    source: 'rsupsoeradji.id',
    body: `Fasilitas RSUP Dr. Soeradji Tirtonegoro antara lain: Instalasi Gawat Darurat 24 jam; rawat inap (kelas VIP s.d. kelas 3, ruang isolasi, ICU/NICU/PICU); poliklinik rawat jalan & poliklinik eksekutif; kamar bedah sentral; kateterisasi jantung; laboratorium; radiologi/pencitraan (rontgen, USG, CT-scan, MRI sesuai ketersediaan); farmasi/apotek; rehabilitasi medik & fisioterapi; hemodialisa; unit transfusi darah/pengelolaan darah; instalasi gizi; ambulans; pemulasaran jenazah; ATM center; kantin; mushola; area parkir luas; ruang tunggu ber-AC; WiFi area publik.

Jam berkunjung: 17.00–19.00 WIB. Anak di bawah usia tertentu tidak dianjurkan membesuk; patuhi protokol kunjungan terutama di ruang intensif.`,
  },
  {
    id: 'maklumat-gratifikasi',
    title: 'Maklumat Pelayanan dan Stop Gratifikasi',
    tags: ['maklumat', 'gratifikasi', 'stop gratifikasi', 'korupsi', 'pungli', 'layanan gratis', 'anti pungli', 'pengaduan pungli', 'suap'],
    updated: '2026-11',
    source: 'rsupsoeradji.id',
    body: `MAKLUMAT PELAYANAN RST: komitmen memberikan pelayanan yang berkualitas, profesional, transparan, dan berorientasi pada kepuasan serta keselamatan masyarakat sesuai standar yang ditetapkan.

STOP GRATIFIKASI: RST berkomitmen mewujudkan zona integritas menuju WBK/WBBM. Pegawai RST DILARANG menerima gratifikasi dalam bentuk apapun (uang, barang, fasilitas) yang berhubungan dengan jabatan dan berlawanan dengan kewajiban. Masyarakat diminta TIDAK memberi uang/imbalan apapun kepada petugas. Laporkan indikasi gratifikasi/pungli ke Unit Pengendalian Gratifikasi (UPG) RST melalui hotline (0272) 321020 atau email resmi rumah sakit.

Layanan tidak dipungut biaya di luar tarif resmi; minta bukti pembayaran (kuitansi) setiap transaksi di kasir.`,
  },
  {
    id: 'kampanye-kesehatan',
    title: 'Kampanye dan Promosi Kesehatan Daring',
    tags: ['kampanye', 'promosi kesehatan', 'penyuluhan', 'imunisasi', 'skrining', 'germas', 'cerdik', 'cuci tangan', 'gizi', 'stunting', 'hiv', 'tb', 'rokok', 'hipertensi', 'diabetes', 'kegiatan'],
    updated: '2026-11',
    source: 'rsupsoeradji.id / Kemenkes RI',
    body: `Kampanye kesehatan RST & Kemenkes RI yang relevan untuk masyarakat Klaten dan sekitarnya:
- GERMAS — Gerakan Masyarakat Hidup Sehat: aktivitas fisik 30 menit/hari, perbanyak sayur & buah, cek kesehatan berkala.
- CERDIK — Cek kesehatan berkala, Enyahkan asap rokok, Rajin aktivitas fisik, Diet seimbang, Istirahat cukup, Kelola stres — pencegahan PTM (penyakit tidak menular: hipertensi, diabetes, stroke, jantung).
- SPELING — Spesialis Keliling RST: dokter spesialis turun langsung ke kecamatan (mis. Gantiwarno) melayani 110+ pasien per kegiatan.
- Bakti Sosial & Khitanan Massal RST (Nov 2026): 99 anak turut serta.
- Imunisasi Dasar Lengkap & Bulan Imunisasi Anak Sekolah (BIAS) — tanyakan jadwal ke puskesmas/poli anak RST.
- Skrining PTM gratis pada kegiatan tertentu (tekanan darah, gula darah, kolesterol, BMI).
- Hari Kesehatan Nasional, Hari Jantung Sedunia, Pekan ASI, dll — diikuti RST dengan penyuluhan & layanan konsultasi.
- Berhenti merokok — Klinik berhenti merokok tersedia di RST (konsultasi dokter).
- Deteksi dini TB (DOTS) dan HIV (VCT) — layanan tersedia di poli terkait.

Ikuti akun resmi @rssoeradjitirtonegoro (Instagram) dan rsupsoeradji.id untuk jadwal kampanye terkini, atau aktifkan notifikasi kampanye di aplikasi SAPA PASIEN (menu Kampanye).`,
  },
  {
    id: 'speling',
    title: 'Program SPELING — Spesialis Keliling',
    tags: ['speling', 'spesialis keliling', 'keliling', 'kecamatan', 'gantiwarno', 'jemput bola', 'posyandu'],
    updated: '2026-11',
    source: 'rsupsoeradji.id',
    body: `SPELING (Spesialis Keliling) adalah program RSUP Dr. Soeradji Tirtonegoro untuk mendekatkan layanan dokter spesialis kepada masyarakat di kecamatan-kecamatan Kabupaten Klaten dan sekitarnya. Pada salah satu kegiatan di Kecamatan Gantiwarno, tercatat 110 pasien terlayani. Kegiatan umumnya meliputi pemeriksaan dokter spesialis, konsultasi, dan edukasi kesehatan, bekerja sama dengan puskesmas setempat. Jadwal SPELING diumumkan melalui kanal resmi RST dan pemerintah daerah; tanyakan ke puskesmas terdekat atau Contact Center (0272) 321020.`,
  },
  {
    id: 'tiket-antrian',
    title: 'Antrian dan Daftar Ulang (Check-in)',
    tags: ['antrian', 'nomor antrian', 'check in', 'daftar ulang', 'fingerprint', 'sidik jari', 'loket', 'irm', 'verifikasi', 'tunggu'],
    updated: '2026-11',
    source: 'sippn.menpan.go.id / rsupsoeradji.id',
    body: `Alur kunjungan rawat jalan RST:
1. Buat janji (WhatsApp 0816-9170-00 H-7..H-1) atau datang langsung.
2. Tiba 30 menit sebelum jadwal; tunjukkan nomor/bukti pendaftaran ke petugas IRM.
3. Check-in + sidik jari (fingerprint) di meja Administrasi IRM.
4. Loket pendaftaran (bila belum mendaftar): verifikasi nama lengkap + tanggal lahir; verifikasi berkas asuransi; pembayaran kasir (umum).
5. Ambil nomor antrean poli; tunggu di ruang tunggu poli sesuai nomor.

Waktu penyelesaian pendaftaran umumnya < 5 menit. Jam pendaftaran Senin–Kamis 07.30–14.00, Jumat 07.30–14.30.`,
  },
  {
    id: 'pendidikan-penelitian',
    title: 'Pendidikan, Pelatihan, dan Penelitian',
    tags: ['pendidikan', 'penelitian', 'diklat', 'ugm', 'universitas', 'koas', 'residen', 'pelatihan', 'pkm', 'magang'],
    updated: '2026-11',
    source: 'rsupsoeradji.id',
    body: `RST adalah rumah sakit pendidikan bekerja sama dengan Fakultas Kedokteran UGM (sejak 1946) dan berbagai universitas. RST menjadi lokasi pendidikan dokter (koas), program residensi, PPDS, penelitian biomedis, serta pelatihan/diklat tenaga kesehatan. RST juga aktif studi banding dari rumah sakit lain (mis. studi banding pengelolaan darah / SIM Unit Pengelola Darah). Informasi kerjasama pendidikan: bagian Diklat/Penelitian RST melalui (0272) 321020 atau email rsupsoeradji_klaten@yahoo.com.`,
  },
  {
    id: 'faq',
    title: 'FAQ — Pertanyaan yang Sering Diajukan',
    tags: ['faq', 'tanya jawab', 'pertanyaan', 'bawa apa', 'parkir', 'atm', 'wali', 'rekam medis', 'surat keterangan', 'sehat walafiat', 'antar jemput', 'jenazah'],
    updated: '2026-11',
    source: 'himpunan FAQ RST',
    body: `T: Bawa apa saat berobat? J: KTP, kartu BPJS/asuransi, surat rujukan/perintah kontrol, hasil pemeriksaan sebelumnya, obat rutin.
T: Apakah bisa antar-jemput pasien? J: Tersedia layanan ambulans; hubungi (0272) 321020 ext 200 untuk informasi biaya/ketersediaan.
T: Bagaimana urus rekam medis/surat keterangan? J: Ajukan ke IRM (Informasi Rekam Medik) dengan identitas dan surat pengantar; pengambilan sesuai ketentuan.
T: Jam besuk? J: 17.00–19.00 WIB.
T: Apakah RST menerima pasien rujukan dari luar Klaten? J: Ya, RST RS rujukan nasional — rujukan dari RS/klinik seluruh Indonesia diterima.
T: Nomor darurat? J: IGD 24 jam (0272) 321020 ext 200 atau 119.
T: Pendaftaran online? J: WhatsApp 0816-9170-00, H-7 s/d H-1 07.30–14.00 WIB.
T: Bagaimana menyampaikan keluhan? J: Menu Keluhan di SAPA PASIEN, atau hotline 0851-7957-7302.
T: Apakah ada layanan home care? J: Ada — Home Care Go-Trah; tarif sesuai SK HK.02.03/D.XXVI/5441/2024.
T: Apakah RST melayani hari Sabtu? J: Poliklinik tutup Sabtu–Ahad/libur; IGD & rawat inap 24 jam tetap buka. (Poli penyakit dalam tertentu praktik Sabtu pagi 07.30–13.00 — konfirmasi ke Contact Center.)`,
  },
  {
    id: 'keselamatan-pasien',
    title: 'Keselamatan Pasien dan Hak Pasien',
    tags: ['keselamatan', 'pasien', 'hak', 'kewajiban', 'sasaran keselamatan', 'identifikasi', 'informed consent', 'privasi', 'kerahasiaan'],
    updated: '2026-11',
    source: 'rsupsoeradji.id / standar akreditasi KARS',
    body: `RST menerapkan standar keselamatan pasien (akreditasi KARS penuh): identifikasi pasien dengan minimal dua identitas (nama & tanggal lahir), komunikasi efektif (SBAR), keamanan obat, kepastian sisi/lokasi operasi, pencegahan infeksi, dan pencegahan pasien jatuh. Pasien berhak atas informasi lengkap diagnosis & rencana tindakan, menolak/menyetujui tindakan (informed consent), privasi dan kerahasiaan data medis, serta menyampaikan keluhan tanpa takut diperlakukan buruk. Kewajiban pasien: memberikan informasi yang jujur dan lengkap, mematuhi tata tertib & instruksi medis, serta menghormati hak pasien lain dan petugas.`,
  },
  {
    id: 'e-yang',
    title: 'E-Yang Soeradji (Aplikasi Mobile Resmi)',
    tags: ['e-yang', 'eyang', 'aplikasi', 'mobile', 'android', 'playstore', 'app store', 'antrian online'],
    updated: '2026-11',
    source: 'X/Twitter resmi @RSSoeradji',
    body: `RST memiliki aplikasi mobile resmi "E-Yang Soeradji" untuk mempermudah akses layanan (informasi & pendaftaran) bagi pengguna Android/iOS. Cari "E-Yang Soeradji" di Play Store/App Store, atau tanyakan tautan unduhan ke Contact Center (0272) 321020. Aplikasi SAPA PASIEN ini melengkapi E-Yang Soeradji sebagai kanal tanya-jawab cerdas (chatbot), keluhan, dan kampanye kesehatan.`,
  },
  {
    id: 'edukasi-batuk',
    title: 'Batuk Berdahak — Edukasi Umum (Bukan Diagnosis)',
    tags: ['batuk', 'berdahak', 'pilek', 'flu', 'ispa', 'tenggorokan', 'dahak', 'batuk kronis', 'tb'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Batuk berdahak adalah refleks alami tubuh untuk membersihkan saluran napas dari mukus/dahak. Pada umumnya tidak berbahaya dan sering menyertai ISPA (infeksi saluran napas akut, mis. pilek/flu) dan sembuh 1–3 minggu.

Waspada & SEGERA periksa ke dokter bila: batuk lebih dari 2 minggu; dahak bercampur darah; batuk disertai sesak napas berat, nyeri dada, atau napas berbunyi; demam tinggi lebih dari 3 hari; berat badan turun tanpa sebab; keringat malam; pembengkakan kelenjar leher. Batuk > 2 minggu + keringat malam + BB turun wajib disaring TB — poli TB DOTS RST (dr. Zakiah Novianti, Sp.P — Selasa & Jumat 09.00–13.00). Dahak hijau/kuning pekat disertai sesak → curiga infeksi bakteri (pneumonia/bronkitis) → perlu pemeriksaan dokter & kemungkinan rontgen.

Pertolongan awal di rumah: perbanyak minum air hangat, istirahat, hindari asap rokok & polusi, jangan sembarangan minum antibiotik tanpa resep (antibiotik hanya untuk infeksi bakteri atas anjuran dokter). Anak di bawah 5 tahun, lansia, dan penderita penyakit jantung/paru kronik sebaiknya langsung diperiksa.

Ini edukasi umum, BUKAN diagnosis. Untuk kepastian dan penanganan yang tepat, konsultasikan ke dokter RST: poli Paru/TB DOTS, poli Penyakit Dalam, atau IGD bila sesak. SAPA PASIEN tidak dapat mendiagnosis penyakit.`,
  },
  {
    id: 'edukasi-demam',
    title: 'Demam — Edukasi Umum (Bukan Diagnosis)',
    tags: ['demam', 'panas', 'meriang', 'suhu', 'demam tinggi', 'penurun panas'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Demam adalah respons tubuh melawan infeksi — umumnya tidak berbahaya bila di bawah 38,5°C dan singkat. Pertolongan awal: istirahat cukup, minum air putih/air hangat yang banyak, kompres hangat, pakaian tipis, ukur suhu berkala.

SEGERA ke IGD bila: demam disertai sesak napas, kaku kuduk, kejang, penurunan kesadaran/bingung, ruam ungu yang tidak hilang saat ditekan, atau nyeri dada hebat. Periksa ke dokter bila: demam > 38,5°C lebih dari 3 hari, demam naik-turun > 7 hari, disertai ruam, muntah terus-menerus, atau diare berat; anak dengan demam disertai rewel berat/tidak mau minum/mata cekung. Demam berdarah perlu diwaspadai saat musim hujan: demam tinggi mendadak + bintik merah + nyeri ulu hati + mimisan → periksa darah segera (poli Anak/Penyakit Dalam).

Obat penurun panas (parasetamol) hanya pereda gejala — bukan penyembuh. Jangan berikan aspirin pada anak tanpa anjuran dokter.

Ini edukasi umum, BUKAN diagnosis. Konsultasikan ke dokter RST untuk penanganan tepat (poli Penyakit Dalam/Anak, atau IGD 24 jam: (0272) 321020 ext 200).`,
  },
  {
    id: 'edukasi-hipertensi',
    title: 'Hipertensi (Tekanan Darah Tinggi) — Edukasi Umum',
    tags: ['hipertensi', 'darah tinggi', 'tensi', 'tekanan darah', 'sistole', 'diastole', 'amlodipin'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Hipertensi = tekanan darah ≥ 140/90 mmHg pada pengukuran berulang. Sering TANPA gejala ("pembunuh diam-diam") dan dapat menimbulkan stroke, serangan jantung, dan gagal ginjal. Faktor risiko: garam berlebih, obesitas, kurang olahraga, merokok, stres, riwayat keluarga.

Pencegahan & pengendalian: kurangi garam (< 5 g/hari), diet DASH (banyak sayur-buah-serat, kurangi lemak jenuh), olahraga 30 menit/hari, berat badan ideal, berhenti merokok, kelola stres, patuh minum obat dari dokter (jangan berhenti sendiri meski merasa baik-baik saja), cek tensi rutin (minimal 1×/bulan bila berisiko).

SEGERA ke IGD bila: tensi sangat tinggi (≥ 180/120) disertai nyeri dada, sesak, sakit kepala hebat, gangguan penglihatan, lemas sebelah/wajah mencong (gejala stroke), atau penurunan kesadaran.

Skrining gratis tekanan darah tersedia di MCU RST & kegiatan SPELING/bakti sosial. Ini edukasi umum, BUKAN diagnosis — konsultasikan ke dokter (poli Penyakit Dalam, dr. Tri Widodo, Sp.PD-KGH / poli Jantung).`,
  },
  {
    id: 'edukasi-diabetes',
    title: 'Diabetes / Kencing Manis — Edukasi Umum',
    tags: ['diabetes', 'gula darah', 'kencing manis', 'dm', 'gula', 'insulin', 'metformin'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Diabetes melitus ditandai gula darah puasa ≥ 126 mg/dL atau sewaktu ≥ 200 mg/dL (pemeriksaan laboratorium). Gejala khas: sering haus & sering berkemih (terutama malam), lapar terus, berat badan turun, luka sulit sembuh, kesemutan.

Pengendalian: diet rendah gula & karbohidrat sederhana (hindari minuman manis, gorengan, nasi berlebih), makan teratur dengan porsi kecil & sering, olahraga rutin (jalan kaki 30 menit), jaga berat badan, cek gula darah & HbA1c berkala, patuh obat/insulin sesuai anjuran dokter, periksa kaki & mata rutin.

SEGERA ke IGD bila: gula darah sangat tinggi disertai muntah hebat, nyeri perut, napas cepat/dalam (curiga ketoasidosis), atau gula darah sangat rendah (gemetar, keringat dingin, bingung, kejang) — segera minum manis & hubungi IGD (0272) 321020 ext 200.

Ini edukasi umum, BUKAN diagnosis. Konsultasi ke dokter (poli Penyakit Dalam) & cek GDS/GDP di laboratorium RST atau Home Care RST (GDS stik Rp120.000).`,
  },
  {
    id: 'edukasi-maag',
    title: 'Maag / Nyeri Ulu Hati / GERD — Edukasi Umum',
    tags: ['maag', 'asam lambung', 'gerd', 'ulu hati', 'perut perih', 'mual', 'muntah', 'kembung'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Nyeri ulu hati & perih lambung umumnya akibat gastritis/dispepsia fungsional atau GERD (asam lambung naik). Pemicu: makan tidak teratur, pedas/asam/kopi/alkohol/soda, stres, obat anti-nyeri (NSAID) tanpa pelindung lambung.

Pertolongan awal: makan kecil tapi sering (jangan kosong > 3–4 jam), hindari pemicu (pedas, asam, kopi, soda, alkohol), jangan langsung berbaring setelah makan (tunggu 2 jam), tidur dengan kepala lebih tinggi, kurangi stres, berhenti merokok. Antasida bisa membantu gejala ringan sesekali — bukan solusi jangka panjang.

SEGERA ke IGD/dokter bila: nyeri ulu hati disertai muntah darah/BAB hitam (curiga perdarahan lambung), nyeri dada (bedakan dengan jantung — bila ragu, anggap gawat darurat), sulit menelan, berat badan turun, atau muntah terus-menerus.

Ini edukasi umum, BUKAN diagnosis. Konsultasikan ke dokter (poli Penyakit Dalam) — nyeri dada harus dipastikan bukan dari jantung terlebih dahulu.`,
  },
  {
    id: 'edukasi-nyeri-dada',
    title: 'Nyeri Dada — Edukasi Umum & Tanda BAHAYA',
    tags: ['nyeri dada', 'dada sakit', 'dada terasa', 'dada sesak', 'jantung', 'serangan jantung'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Nyeri dada bisa dari otot/tulang, lambung (GERD), cemas, atau JANTUNG (angina/serangan jantung). Nyeri dada akibat jantung biasanya: terasa berat/tertindih/terbakar di tengah dada, menjalar ke lengan kiri, rahang, leher, atau punggung, disertai keringat dingin, sesak, mual — muncul saat aktivitas/stres dan membaik saat istirahat (angina), atau menetap > 15 menit (curiga serangan jantung).

Bila ragu antara lambung vs jantung: ANGGAP GAWAT DARURAT. Segera ke IGD RST — (0272) 321020 ext 200 — atau hubungi 119. Jangan menyetir sendiri. Duduk tegak & istirahat sambil menunggu pertolongan; bila ada aspirin dan tidak alergi serta sadar penuh, kunyah 1 tablet atas petunjuk petugas 119 — jangan memberi makan/minum pada orang yang menurun kesadarannya.

Nyeri dada berulang saat aktivitas adalah TANDA PERINGATAN penyakit jantung koroner → periksa ke poli Jantung (dr. Muhammad Yulianto SA, Sp.JP / dr. Donna Paramita, Sp.JP) atau poli Penyakit Dalam; RST memiliki fasilitas kateterisasi jantung (PCI) bila diperlukan.

Ini edukasi umum, BUKAN diagnosis. Nyeri dada hebat = kondisi gawat darurat, bukan untuk tanya-jawab chatbot.`,
  },
  {
    id: 'edukasi-diare',
    title: 'Diare — Edukasi Umum (Bukan Diagnosis)',
    tags: ['diare', 'mencret', 'perut mules', 'muntaber', 'bab encer', 'dehidrasi'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Diare = BAB encer ≥ 3× sehari. Penyebab tersering: infeksi virus/bakteri (makanan/minuman tercemar), intoleransi laktosa, efek obat. Bahaya utama adalah DEHIDRASI, terutama pada anak & lansia.

Pertolongan utama: minum oralit (larutan gula-garam) sering sedikit-sedikit — jangan hanya air putih; makan lunak (bubur, pisang, nasi); jaga kebersihan makanan & cuci tangan; hindari susu & santan sementara.

SEGERA ke dokter/IGD bila: BAB berdarah, diare disertai demam tinggi, muntah hebat & tidak bisa minum, tanda dehidrasi (mulut kering, mata cekung, lemas, jarang BAK, sangat haus), atau diare > 3 hari. Anak < 5 tahun dengan diare harus segera diperiksa.

Ini edukasi umum, BUKAN diagnosis. Konsultasikan ke dokter (poli Anak/Penyakit Dalam); kasus berat ditangani IGD 24 jam (0272) 321020 ext 200.`,
  },
  {
    id: 'edukasi-pusing',
    title: 'Pusing / Sakit Kepala — Edukasi Umum (Bukan Diagnosis)',
    tags: ['pusing', 'sakit kepala', 'migrain', 'vertigo', 'pening', 'kepala nyeri', 'berputar'],
    updated: '2026-11',
    source: 'Edukasi kesehatan Kemenkes RI / RST (bukan pengganti konsultasi dokter)',
    body: `Pusing/sakit kepala paling sering: tegang (otot leher & kepala), migrain (berdenyut sebelah, mual, sensitif cahaya), kurang tidur, dehidrasi, telat makan, mata lelah, atau tekanan darah tidak terkontrol. Vertigo = rasa berputar, sering karena gangguan keseimbangan telinga dalam.

Pertolongan awal: istirahat di ruangan gelap & tenang, minum air, makan teratur, kompres dingin (migrain) atau hangat (tegang), kurangi layar & stres, tidur cukup.

SEGERA ke IGD bila sakit kepala: muncul mendadak & sangat hebat ("terburuk seumur hidup"), disertai kaku kuduk & demam, gangguan bicara/penglihatan/kelumpuhan sebelah, penurunan kesadaran, atau setelah benturan kepala. Ini bisa tanda perdarahan otak/stroke — DARURAT, bukan untuk dipantau di rumah.

Ini edukasi umum, BUKAN diagnosis. Konsultasi ke dokter (poli Saraf/Bedah Saraf, poli THT bila berputar, atau poli Penyakit Dalam bila terkait tensi).`,
  },

  {
    id: 'titik-lokasi',
    title: 'Lokasi dan Rute Menuju RST',
    tags: ['rute', 'lokasi', 'peta', 'google maps', 'jalan', 'tegalyoso', 'klaten selatan', 'transportasi', 'angkot', 'kereta', 'stasiun', 'terminal'],
    updated: '2026-11',
    source: 'rsupsoeradji.id',
    body: `RSUP Dr. Soeradji Tirtonegoro terletak di Jl. KRT Dr. Soeradji Tirtonegoro No. 1, Tegalyoso, Klaten Selatan, Kabupaten Klaten, Jawa Tengah 57424 — sekitar 3 km selatan Alun-alun Klaten, mudah dijangkau dari Solo (±45 km) dan Yogyakarta (±35 km). Gunakan Google Maps: "RSUP Dr. Soeradji Tirtonegoro" atau maps.app.goo.gl/Dg4VaQR88kVLfsS36. Dari Stasiun Klaten/Terminal Ir. Soekarno, lanjutkan dengan angkot/ojek daring/taksi menuju arah Tegalyoso. Tersedia parkir mobil & motor di dalam area rumah sakit (gratis/sesuai ketentuan parkir).`,
  },
];
