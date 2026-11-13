// Data Tarif Tindakan Pelayanan Home Care RSUP Dr. Soeradji Tirtonegoro Klaten
// Sumber: Keputusan Direktur Utama Nomor HK.02.03/D.XXVI/5441/2024
// tanggal 18 Maret 2024 (Lampiran), mencabut SK HK.02.03/D.XXVI/24514/2023.
// Hasil digitalisasi dari dokumen SK yang dipindai (scan) — cocokkan ke dokumen asli bila perlu.

export interface TarifItem {
  no: number;
  nama: string;
  sarana: number | null; // Jasa Sarana (Rp)
  pelayanan: number | null; // Jasa Pelayanan (Rp)
  jumlah: number | null; // Jumlah (Rp)
  ket?: string;
}
export interface TarifSection {
  id: string;
  judul: string;
  items: TarifItem[];
}

export const TARIF_SECTIONS: TarifSection[] = [
  {
    id: 'non-operatif',
    judul: 'Tindakan Medik Non Operatif & Pemeriksaan Laboratorium Sederhana',
    items: [
      { no: 1, nama: 'Pasang Catheter dan lepas Cateter', sarana: 50000, pelayanan: 100000, jumlah: 150000 },
      { no: 2, nama: 'Pasang NGT dan lepas NGT, sonde, Intubasi lambung', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 3, nama: 'Spoeling', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 4, nama: 'Spoeling dari suction telinga', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 5, nama: 'Spooling/irigasi', sarana: 5000, pelayanan: 100000, jumlah: 105000 },
      { no: 6, nama: 'Spooling bola mata', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 7, nama: 'Pasang Infus', sarana: 25000, pelayanan: 100000, jumlah: 125000 },
      { no: 8, nama: 'Injeksi Intra Muskuler / Sub Cutan', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 9, nama: 'Injeksi Intravena', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 10, nama: 'Nebuliser', sarana: 10000, pelayanan: 100000, jumlah: 110000 },
      { no: 11, nama: 'Perawatan luka kecil', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 12, nama: 'Perawatan luka / medikasi sedang', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 13, nama: 'Perawatan Luka / medikasi Besar', sarana: 80000, pelayanan: 100000, jumlah: 180000 },
      { no: 14, nama: 'Pijat bayi', sarana: 10000, pelayanan: 100000, jumlah: 110000, ket: 'Selama 30 menit' },
      { no: 15, nama: 'Kunjungan Rohaniwan (doa, buku panduan, motivasi dan bimbingan ibadah pasien)', sarana: 10000, pelayanan: 100000, jumlah: 110000 },
      { no: 16, nama: 'Pendampingan nazak/ sakratul maut', sarana: 10000, pelayanan: 100000, jumlah: 110000 },
      { no: 17, nama: "Ru'yah penyakit rohani", sarana: 10000, pelayanan: 100000, jumlah: 110000 },
      { no: 18, nama: 'Pengambilan Darah Vena', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 19, nama: 'Pengambilan darah arteri', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 20, nama: 'Tindik', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 21, nama: 'Memandikan bayi', sarana: 37000, pelayanan: 100000, jumlah: 137000 },
      { no: 22, nama: 'Perawatan tali pusat/medikasi ringan', sarana: 37000, pelayanan: 100000, jumlah: 137000 },
      { no: 23, nama: 'Breast care', sarana: 37000, pelayanan: 100000, jumlah: 137000 },
      { no: 24, nama: 'Perawatan perinium', sarana: 37000, pelayanan: 100000, jumlah: 137000 },
      { no: 25, nama: 'Jahit perineum (derajat 1)', sarana: 40000, pelayanan: 100000, jumlah: 140000 },
      { no: 26, nama: 'Jahit Perenium Derajat II', sarana: 50000, pelayanan: 100000, jumlah: 150000 },
      { no: 27, nama: 'Jahit perineum derajat III', sarana: 60000, pelayanan: 100000, jumlah: 160000 },
    ],
  },
  {
    id: 'laboratorium',
    judul: 'Pemeriksaan Laboratorium',
    items: [
      { no: 1, nama: 'GDS stik', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 2, nama: 'Uric Acid / Asam Urat', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 3, nama: 'Cholesterol Total', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 4, nama: 'Darah Rutin (3 diff)', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 5, nama: 'SGOT', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 6, nama: 'SGPT', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 7, nama: 'Kultur', sarana: 518000, pelayanan: 30000, jumlah: 548000 },
    ],
  },
  {
    id: 'rehab-medik',
    judul: 'Pelayanan/Tindakan Rehabilitasi Medik/Fisioterapi',
    items: [
      { no: 1, nama: 'Low Level Laser Therapy', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 2, nama: 'Injeksi Lokal Substansi Teurapeutik Ke Soft Tissue Lain (Dry Needling)', sarana: 70000, pelayanan: 100000, jumlah: 170000 },
      { no: 3, nama: 'Spray dan stretch', sarana: 50000, pelayanan: 100000, jumlah: 150000 },
      { no: 4, nama: 'Uji Keseimbangan', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 5, nama: 'Uji fungsi kekuatan otot kecil', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 6, nama: 'Uji Fungsi pada Pasien Geriatri dengan Fraility', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 7, nama: 'Uji Kondisi Psikologis Lansia', sarana: 35000, pelayanan: 100000, jumlah: 135000 },
      { no: 8, nama: 'Uji/Skrining Paliatif', sarana: 35000, pelayanan: 100000, jumlah: 135000 },
      { no: 9, nama: 'Uji Dekondisi', sarana: 30000, pelayanan: 100000, jumlah: 130000 },
      { no: 10, nama: 'Latihan ROM/stretching', sarana: 10000, pelayanan: 100000, jumlah: 110000 },
      { no: 11, nama: 'Latihan resistif/penguatan', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 12, nama: 'Latihan ambulasi & keseimbangan', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 13, nama: 'Latihan jalan dengan (orthosis crutches, tripod, walker)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 14, nama: 'Latihan pernafasan', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 15, nama: 'Chest therapy dan postural drainage', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 16, nama: 'Latihan koordinasi khusus (NDT, FRANKEL, dll)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 17, nama: 'Manual terapi', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 18, nama: 'Terapi latihan lain (skoliosis, pelvic floor, dll)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 19, nama: 'Terapi latihan lain (skoliosis, pelvic floor, dll)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 20, nama: 'Pasang Taping', sarana: 35000, pelayanan: 100000, jumlah: 135000 },
      { no: 21, nama: 'Cold pack', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 22, nama: 'Massage bayi & Massage local', sarana: 20000, pelayanan: 100000, jumlah: 120000 },
      { no: 23, nama: 'Latihan Koordinasi dan motoric', sarana: 10000, pelayanan: 100000, jumlah: 110000 },
      { no: 24, nama: 'Latihan gangguan kognisi & Persepsi', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 25, nama: 'Latihan Perawatan diri (Self Care) & ADL', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 26, nama: 'Terapi Perkembangan', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 27, nama: 'Energi Konservatif', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 28, nama: 'Rehabilitasi paliatif', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 29, nama: 'Alat-alat adaptive', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 30, nama: 'PBM (Proper Body Mechanic)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 31, nama: 'Asesment OT', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 32, nama: 'Psikoterapi Keluarga (Psikoterapi)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 33, nama: 'Psikoterapi Perilaku (Psikoterapi)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 34, nama: 'Psikoterapi Supportif (Psikoterapi)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 35, nama: 'Psikoterapi Terpadu (Psikoterapi)', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 36, nama: 'Psikoterapi Marital', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 37, nama: 'Asessment gangguan pada Lansia', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 38, nama: 'Asessment gangguan pada anak/Remaja', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 39, nama: 'TENS', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 40, nama: 'Infra Red', sarana: 15000, pelayanan: 100000, jumlah: 115000 },
      { no: 41, nama: 'Neuromuscular taping', sarana: 50000, pelayanan: 80000, jumlah: 130000 },
    ],
  },
  {
    id: 'kunjungan-dokter',
    judul: 'Kunjungan Dokter/Psikolog',
    items: [
      { no: 1, nama: 'Visite dokter Umum', sarana: 25000, pelayanan: 125000, jumlah: 150000 },
      { no: 2, nama: 'Dokter Spesialis', sarana: 25000, pelayanan: 200000, jumlah: 225000 },
      { no: 3, nama: 'Dokter Sub Spesialis', sarana: 25000, pelayanan: 250000, jumlah: 275000 },
      { no: 4, nama: 'Konsultasi Psikologi', sarana: 25000, pelayanan: 100000, jumlah: 125000 },
    ],
  },
  {
    id: 'sewa-alat',
    judul: 'Sewa Alat Medik',
    items: [
      { no: 1, nama: 'Sewa Tempat Tidur', sarana: 24000, pelayanan: null, jumlah: 24000, ket: 'Per Hari' },
      { no: 2, nama: 'Sewa Oksigen konsentrator', sarana: 12000, pelayanan: null, jumlah: 12000, ket: 'Per Hari' },
    ],
  },
];

export const TARIF_META = {
  nomor: 'HK.02.03/D.XXVI/5441/2024',
  tanggal: '18 Maret 2024',
  ditetapkan: 'Klaten, 18 Maret 2024',
  penandatangan: 'Plt. Direktur Utama RSUP Dr. Soeradji Tirtonegoro Klaten — Sholahuddin Rhatomy',
  mencabut: 'Keputusan Direktur Utama Nomor HK.02.03/D.XXVI/24514/2023 tentang Tarif Pelayanan Home Care',
  catatan: 'Jika pelaksanaan Home Care lebih dari satu tindakan, maka jasa pelaksana (Jasa Pelayanan) hanya dihitung satu.',
  dokumen: '/documents/SK-Tarif-Home-Care-RST-2024.pdf',
};

export function allTarifItems(): (TarifItem & { section: string })[] {
  return TARIF_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.judul })));
}

export function formatRp(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return 'Rp' + n.toLocaleString('id-ID');
}

export function searchTarif(q: string): (TarifItem & { section: string })[] {
  const STOP = new Set(['tarif', 'biaya', 'harga', 'berapa', 'bayar', 'home', 'care', 'homecare', 'rst', 'rsup', 'soeradji', 'tolong', 'carikan', 'daftar', 'list', 'cek', 'sk', 'semua']);
  const words = (q || '').toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) ?? [];
  const items = allTarifItems();
  if (!words.length) return items;
  const scored = items.map((it, order) => {
    const hay = (it.nama + ' ' + it.section).toLowerCase();
    let score = 0;
    for (const w of words) if (hay.includes(w)) score++;
    return { it, score, order };
  }).filter(({ score }) => score > 0);
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.map(({ it }) => it);
}
