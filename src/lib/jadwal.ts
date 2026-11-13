// Jadwal praktik dokter RSUP Dr. Soeradji Tirtonegoro Klaten (Poliklinik Reguler)
// Diolah dari situs resmi (rsupsoeradji.id / rssoeradji.go.id) & direktori jadwal publik, update 12 Mei 2026.
// CATATAN: jadwal dapat berubah sewaktu-waktu (libur nasional, tugas dinas, dll).
// Konfirmasi selalu ke Contact Center (0272) 321020 / WhatsApp 0816-9170-00.

export interface JadwalDokter {
  poli: string;
  dokter: string;
  spesialis: string;
  hari: string;
  jam: string;
  catatan?: string;
}

export const JADWAL_UPDATE = '12 Mei 2026';

export const JADWAL_DOKTER: JadwalDokter[] = [
  // Penyakit Dalam
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Taufik Hidayat, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Selasa', jam: '12.00–14.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Taufik Hidayat, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Rabu & Jumat', jam: '09.00–12.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Dendy Raharjo, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Selasa', jam: '09.00–12.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Dendy Raharjo, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Jumat', jam: '13.00–14.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Dendy Raharjo, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Senin & Rabu', jam: '15.00–15.30 WIB', catatan: 'Non reguler' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Tri Widodo, Sp.PD-KGH, FINASIM', spesialis: 'Penyakit Dalam – Ginjal Hipertensi', hari: 'Senin & Rabu', jam: '07.30–12.30 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Tri Widodo, Sp.PD-KGH, FINASIM', spesialis: 'Penyakit Dalam – Ginjal Hipertensi', hari: 'Jumat & Sabtu', jam: '07.30–13.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Fredie Irijanto, Ph.D, Sp.PD, K-GH, FINASIM', spesialis: 'Penyakit Dalam – Ginjal Hipertensi', hari: 'Selasa & Kamis', jam: '08.00–10.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Siswi Oktariani, Sp.PD-KHOM', spesialis: 'Penyakit Dalam – Hematologi Onkologi Medik', hari: 'Senin s.d. Jumat', jam: '08.30–12.30 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Meita Uchee, Sp.PD, Subsp.H.Onk.M(K), FINASIM', spesialis: 'Penyakit Dalam – Hematologi Onkologi', hari: 'Senin s.d. Jumat', jam: '09.30–14.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Achmad Thabrani, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Senin & Rabu', jam: '13.00–16.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Ahmad Syahri, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Senin & Kamis', jam: '09.00–12.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Nindya Putri Permata Risadayu, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Selasa', jam: '12.00–13.00 WIB' },
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Nindya Putri Permata Risadayu, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Rabu & Jumat', jam: '09.00–11.00 WIB' },
  // VCT
  { poli: 'Poli VCT', dokter: 'dr. Ahmad Syahri, Sp.PD', spesialis: 'VCT / HIV', hari: 'Selasa & Rabu', jam: '09.00–16.00 WIB' },
  { poli: 'Poli VCT', dokter: 'dr. Nindya Putri Permata Risadayu, Sp.PD', spesialis: 'VCT / HIV', hari: 'Senin & Kamis', jam: '09.00–16.00 WIB' },
  // Tumbuh Kembang Anak
  { poli: 'Poli Tumbuh Kembang Anak', dokter: 'dr. Desi Fajar Susanti, Sp.A(K)', spesialis: 'Anak – Tumbuh Kembang', hari: 'Senin s.d. Jumat', jam: '09.30–13.00 WIB' },
  { poli: 'Poli Tumbuh Kembang Anak', dokter: 'dr. Febricilla Citra Pratiwi, Sp.A', spesialis: 'Anak', hari: 'Selasa & Kamis', jam: '09.30–13.00 WIB' },
  // Kulit & Kelamin
  { poli: 'Poli Kulit & Kelamin', dokter: 'dr. Arsi Noviana Sari, Sp.DVE', spesialis: 'Kulit & Kelamin', hari: 'Senin & Kamis', jam: '09.00–15.30 WIB' },
  { poli: 'Poli Kulit & Kelamin', dokter: 'dr. Arsi Noviana Sari, Sp.DVE', spesialis: 'Kulit & Kelamin', hari: 'Jumat', jam: '09.00–16.00 WIB' },
  // Mata
  { poli: 'Poli Mata', dokter: 'dr. Fitria Natliani, Sp.M', spesialis: 'Kesehatan Mata', hari: 'Selasa & Kamis', jam: '08.00–14.00 WIB' },
  // Paru / TB DOTS
  { poli: 'Poli Paru / TB DOTS', dokter: 'dr. Zakiah Novianti, Sp.P, M.Kes', spesialis: 'Paru', hari: 'Selasa & Jumat', jam: '09.00–13.00 WIB' },
  { poli: 'Poli Paru / TB DOTS', dokter: 'dr. Juli Purnomo, Sp.P, MPH', spesialis: 'Paru', hari: 'Selasa', jam: '09.00–13.00 WIB' },
  // Gigi & Mulut
  { poli: 'Poli Gigi & Mulut', dokter: 'drg. Kusumawati Sukadi, Sp.KG', spesialis: 'Gigi Konservasi', hari: 'Selasa, Kamis & Jumat', jam: '11.00–15.00 WIB' },
  { poli: 'Poli Gigi & Mulut', dokter: 'drg. Dimas Cahya Saputra', spesialis: 'Gigi & Mulut', hari: 'Senin s.d. Jumat', jam: '09.30–15.30 WIB' },
  { poli: 'Poli Gigi & Mulut', dokter: 'drg. Pandu Kridalaksana, MDSc', spesialis: 'Gigi & Mulut', hari: 'Senin s.d. Jumat', jam: '08.00–14.30 WIB' },
  { poli: 'Poli Gigi & Mulut', dokter: 'drg. Taufik Nur Alamsyah, Sp.Ort', spesialis: 'Ortodonti', hari: 'Senin & Rabu', jam: '12.00–15.00 WIB', catatan: 'Senin s.d. Kamis 07.30–16.00 WIB (poli gigi umum)' },
  // Rehabilitasi Medik
  { poli: 'Poli Rehabilitasi Medik', dokter: 'dr. Shinta Primasara, Sp.KFR', spesialis: 'Rehabilitasi Medik', hari: 'Selasa & Kamis', jam: '08.00–14.00 WIB' },
  { poli: 'Poli Rehabilitasi Medik', dokter: 'dr. Mayrovi Dewi Nyuyorike Djati, Sp.KFR', spesialis: 'Rehabilitasi Medik', hari: 'Senin, Rabu, Kamis & Jumat', jam: '08.00–14.00 WIB' },
  // Obstetri & Ginekologi (Kandungan)
  { poli: 'Poli Obstetri & Ginekologi', dokter: 'dr. Mochamad Munir, Sp.OG(K)', spesialis: 'Kandungan – Perinatologi', hari: 'Selasa & Kamis', jam: '09.30–14.30 WIB' },
  { poli: 'Poli Obstetri & Ginekologi', dokter: 'dr. Brian Prima Artha, Sp.OG', spesialis: 'Kandungan', hari: 'Senin & Jumat', jam: '09.30–14.30 WIB' },
  { poli: 'Poli Obstetri & Ginekologi', dokter: 'dr. Roy Jansen Sinaga, Sp.OG', spesialis: 'Kandungan', hari: 'Senin s.d. Jumat', jam: '10.00–14.30 WIB' },
  { poli: 'Poli Obstetri & Ginekologi', dokter: 'dr. Usman Arifin, Sp.OG', spesialis: 'Kandungan', hari: 'Rabu', jam: 'Pagi–siang WIB' },
  { poli: 'Poli Obstetri & Ginekologi', dokter: 'dr. Puska Primi Ardini, Sp.OG(K)', spesialis: 'Kandungan – Fertilitas', hari: 'Senin & Kamis', jam: 'Pagi–siang WIB' },
  // Bedah
  { poli: 'Poli Bedah Umum', dokter: 'dr. Agus Wiranto, Sp.B', spesialis: 'Bedah Umum', hari: 'Senin, Selasa & Kamis', jam: 'Mulai 10.00 WIB', catatan: 'Pemeriksaan mulai 10.00 WIB' },
  { poli: 'Poli Bedah Umum', dokter: 'dr. Hartolo Pringgo Handoko, Sp.B', spesialis: 'Bedah Umum', hari: 'Senin & Rabu', jam: 'Mulai 10.00 WIB' },
  { poli: 'Poli Bedah Digestif', dokter: 'dr. Wachid Faozi Rachmad, Sp.B-KBD', spesialis: 'Bedah Digestif (Kapabel Minimal Invasif)', hari: 'Senin & Kamis', jam: '08.30–11.00 WIB' },
  { poli: 'Poli Bedah Orthopedi', dokter: 'dr. Sholahuddin Rhatomy, Sp.OT(K)', spesialis: 'Orthopedi – Hip & Knee', hari: 'Selasa & Kamis', jam: '09.00–14.00 WIB' },
  { poli: 'Poli Bedah Orthopedi', dokter: 'dr. I. Dewa Nyoman Suci Anindya, Sp.OT', spesialis: 'Orthopedi', hari: 'Kamis & Jumat', jam: 'Pagi–siang WIB' },
  { poli: 'Poli Bedah Orthopedi', dokter: 'dr. Prahesta Adi Wibowo, Sp.OT', spesialis: 'Orthopedi', hari: 'Senin, Selasa & Jumat', jam: 'Pagi–siang WIB' },
  { poli: 'Poli Bedah Orthopedi', dokter: 'dr. Dadang R Sasetyo, Sp.OT(K)', spesialis: 'Orthopedi', hari: 'Senin & Rabu', jam: 'Pagi–siang WIB' },
  { poli: 'Poli Bedah Orthopedi', dokter: 'dr. Romaniyanto, Sp.BO, Spine(K)', spesialis: 'Bedah Orthopedi – Spine', hari: 'Kamis', jam: 'Pagi–siang WIB' },
  { poli: 'Poli Bedah Vaskuler & Endovaskuler', dokter: 'dr. Andrian Bimo Indriasmoro, Sp.B, Subsp.BVE(K)', spesialis: 'Bedah Vaskuler & Endovaskuler', hari: 'Senin, Rabu & Jumat', jam: '08.30–Selesai WIB' },
  { poli: 'Poli Bedah Vaskuler & Endovaskuler', dokter: 'dr. Andrian Bimo Indriasmoro, Sp.B, Subsp.BVE(K)', spesialis: 'Bedah Vaskuler & Endovaskuler', hari: 'Selasa & Kamis', jam: '13.00–Selesai WIB' },
  // Urologi
  { poli: 'Poli Urologi', dokter: 'dr. Fajar Sudarsono, Sp.U', spesialis: 'Urologi', hari: 'Senin, Rabu & Kamis', jam: 'Pagi–siang WIB' },
  { poli: 'Poli Urologi', dokter: 'dr. Adhika Restanto Purnomo, Sp.U', spesialis: 'Urologi', hari: 'Selasa & Jumat', jam: 'Pagi–siang WIB' },
  // Jantung & Pembuluh Darah
  { poli: 'Poliklinik Jantung & Pembuluh Darah', dokter: 'dr. Muhammad Yulianto SA, Sp.JP(K), FIHA', spesialis: 'Kardiologi', hari: 'Senin s.d. Jumat', jam: 'Pagi–siang WIB' },
  { poli: 'Poliklinik Jantung & Pembuluh Darah', dokter: 'dr. Donna Paramita, Sp.JP', spesialis: 'Kardiologi', hari: 'Senin s.d. Jumat', jam: 'Pagi–siang WIB' },
  // Saraf / Bedah Saraf
  { poli: 'Poli Bedah Saraf', dokter: 'dr. Andriyanto, Sp.BS', spesialis: 'Bedah Saraf', hari: 'Senin s.d. Jumat', jam: 'Pagi–siang WIB' },
  // THT
  { poli: 'Poli THT-KL', dokter: 'dr. M. Arief Purnanta, Sp.THT, M.Kes', spesialis: 'THT-KL', hari: 'Senin & Rabu', jam: '08.30–16.00 WIB' },
  { poli: 'Poli THT-KL', dokter: 'dr. Arif Budiwan, Sp.THT-KL', spesialis: 'THT-KL', hari: 'Selasa & Rabu', jam: '08.30–16.00 WIB' },
  { poli: 'Poli THT-KL', dokter: 'dr. Budi Santoso, Sp.THT-KL, MSc', spesialis: 'THT-KL', hari: 'Kamis', jam: '08.30–16.00 WIB' },
  // Kesehatan Jiwa / Psikologi
  { poli: 'Poli Psikologi', dokter: 'Dra. Karni', spesialis: 'Psikologi Klinis', hari: 'Senin s.d. Jumat', jam: '07.30–16.00 WIB' },
];

export const POLI_LIST = [...new Set(JADWAL_DOKTER.map((j) => j.poli))].sort();

export function searchJadwal(q: string, poli?: string, hari?: string): JadwalDokter[] {
  const STOP = new Set(['jadwal', 'praktek', 'praktik', 'jam', 'kapan', 'di', 'rst', 'rsup', 'soeradji', 'tirtonegoro', 'klaten', 'hari', 'tolong', 'carikan', 'siapa', 'yang', 'poli', 'dokter', 'spesialis', 'kedokteran']);
  const words = (q || '').toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) ?? [];
  const scored = JADWAL_DOKTER.map((j, order) => {
    const hay = `${j.poli} ${j.dokter} ${j.spesialis} ${j.hari} ${j.jam} ${j.catatan ?? ''}`.toLowerCase();
    let score = 0;
    if (!words.length) score = 1;
    else for (const w of words) if (hay.includes(w)) score++;
    return { j, score, order };
  }).filter(({ j, score }) => {
    if (poli && poli !== 'all' && j.poli !== poli) return false;
    if (hari && hari !== 'all' && !j.hari.toLowerCase().includes(hari.toLowerCase())) return false;
    return score > 0;
  });
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.map(({ j }) => j);
}
