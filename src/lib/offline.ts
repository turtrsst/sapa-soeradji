// Penyusun jawaban offline (tanpa LLM) — deterministik, selalu tersedia, berjalan di server lokal.
import { detectIntent, retrieve, matchJadwal, matchTarif, formatJadwalLines, formatTarifLines, type Intent } from './rag';
import { KB_DOCS } from './kb';
import { formatRp, TARIF_META } from './tarif';

export interface OfflineAnswer {
  text: string;
  intent: Intent;
  sources: string[];
}

const FOOTER = '\n\n_Mode jawaban offline (basis pengetahuan lokal). Untuk jawaban lebih detail, aktifkan AI di menu Pengaturan Admin. Info resmi: (0272) 321020 atau WhatsApp 0816-9170-00._';

export function composeOfflineAnswer(message: string): OfflineAnswer {
  const intent = detectIntent(message);
  const hits = retrieve(message, 4);
  const sources = hits.map((h) => `${h.doc.title} — ${h.doc.source}`);
  const top = hits[0]?.doc;

  // Jawaban terstruktur berbasis intent
  if (intent === 'darurat') {
    const doc = KB_DOCS.find((d) => d.id === 'igd-darurat')!;
    return {
      intent,
      sources: [`${doc.title} — ${doc.source}`],
      text: `**⚠️ KONDISI DARURAT — JANGAN MENUNGGU**\n\n${doc.body.split('\n\n')[1]}\n\nSegera ke **IGD RSUP Dr. Soeradji Tirtonegoro**: **(0272) 321020 ext 200** (24 jam) atau hubungi **119**.${FOOTER}`,
    };
  }

  if (intent === 'jadwal') {
    const rows = matchJadwal(message, 8);
    if (rows.length) {
      return {
        intent,
        sources: ['Jadwal Praktik Dokter RST (update 12 Mei 2026) — dapat berubah; konfirmasi (0272) 321020'],
        text: `Berikut jadwal dokter yang cocok dengan pertanyaan Anda:\n\n${formatJadwalLines(rows)}\n\nJadwal dapat berubah sewaktu-waktu (libur nasional/dinas). Konfirmasi sebelum berkunjung ke **(0272) 321020** atau lihat halaman **Jadwal Dokter** di aplikasi ini. Pendaftaran online: WhatsApp **0816-9170-00** (H-7 s/d H-1).${FOOTER}`,
      };
    }
  }

  if (intent === 'homecare' || intent === 'tarif') {
    const isHomeCare = /home\s?care|go-?trah|visite|kunjungan rumah/i.test(message);
    const tariffRows = matchTarif(message, 10);
    const wantsPriceList = /daftar|list|semua|tabel/i.test(message);
    if (isHomeCare && !tariffRows.length) {
      const doc = KB_DOCS.find((d) => d.id === 'home-care')!;
      return { intent, sources: [`${doc.title} — ${doc.source}`], text: `${doc.body}\n\nLihat tabel tarif lengkap di halaman **Home Care**.${FOOTER}` };
    }
    if (tariffRows.length) {
      const sampleNote = TARIF_META.catatan;
      return {
        intent: 'tarif',
        sources: [`${TARIF_META.nomor} (${TARIF_META.tanggal})`],
        text: `Berikut tarif ${isHomeCare ? 'Home Care' : ''} RST yang paling sesuai:\n\n${formatTarifLines(tariffRows)}\n\n*${sampleNote}*\nSumber: SK Direktur Utama RST No. **${TARIF_META.nomor}** (${TARIF_META.tanggal}). Dokumen SK asli (PDF) dapat diunduh di halaman **Home Care**.${FOOTER}`,
      };
    }
    if (wantsPriceList || intent === 'tarif') {
      return {
        intent: 'tarif',
        sources: [`${TARIF_META.nomor} (${TARIF_META.tanggal})`],
        text: `Tarif Tindakan Home Care RST diatur dengan SK Direktur Utama No. **${TARIF_META.nomor}** (${TARIF_META.tanggal}). Contoh biaya populer:\n\n${formatTarifLines([
          { no: 7, nama: 'Pasang Infus', sarana: 25000, pelayanan: 100000, jumlah: 125000, section: 'Tindakan Medik Non Operatif' },
          { no: 11, nama: 'Perawatan luka kecil', sarana: 20000, pelayanan: 100000, jumlah: 120000, section: 'Tindakan Medik Non Operatif' },
          { no: 1, nama: 'Visite dokter Umum', sarana: 25000, pelayanan: 125000, jumlah: 150000, section: 'Kunjungan Dokter/Psikolog' },
          { no: 2, nama: 'Dokter Spesialis', sarana: 25000, pelayanan: 200000, jumlah: 225000, section: 'Kunjungan Dokter/Psikolog' },
        ])}\n\nLihat daftar lengkap (±80 tindakan, termasuk laboratorium, fisioterapi, sewa alat) di halaman **Home Care**. ${TARIF_META.catatan}${FOOTER}`,
      };
    }
  }

  if (intent === 'keluhan') {
    const doc = KB_DOCS.find((d) => d.id === 'keluhan-pengaduan')!;
    return {
      intent,
      sources: [`${doc.title} — ${doc.source}`],
      text: `Terima kasih telah menyampaikan masukan Anda — kritik & keluhan Anda penting bagi perbaikan layanan RST.\n\n**Cara menyampaikan keluhan:**\n1. **Menu "Keluhan" di aplikasi SAPA PASIEN** — buat tiket, dapatkan nomor tiket, dan lacak status penindakannya.\n2. Hotline pengaduan: **0851-7957-7302** (telepon/WhatsApp)\n3. Contact Center: **(0272) 321020**\n4. Email: rsupsoeradji_klaten@yahoo.com\n\nMohon sertakan nama, No. rekam medis/HP, unit pelayanan, dan kronologi agar cepat ditindaklanjuti.${FOOTER}`,
    };
  }

  if (intent === 'kampanye') {
    const doc = KB_DOCS.find((d) => d.id === 'kampanye-kesehatan')!;
    return {
      intent,
      sources: [`${doc.title} — ${doc.source}`],
      text: `${doc.body.split('\n\n')[1]}\n\nInfo kampanye terbaru & cara ikut serta: lihat menu **Kampanye** di aplikasi ini, Instagram **@rssoeradjitirtonegoro**, atau rsupsoeradji.id.${FOOTER}`,
    };
  }

  if (intent === 'daftar') {
    const doc = KB_DOCS.find((d) => d.id === 'pendaftaran-online')!;
    return {
      intent,
      sources: [`${doc.title} — ${doc.source}`],
      text: doc.body + `\n\nTersedia juga menu **Jadwal Dokter** untuk melihat jadwal poli.${FOOTER}`,
    };
  }

  if (intent === 'kontak') {
    const doc = KB_DOCS.find((d) => d.id === 'kontak')!;
    return {
      intent,
      sources: [`${doc.title} — ${doc.source}`],
      text: doc.body + FOOTER,
    };
  }

  // Jawaban dari dokumen terbaik — hanya bila relevan (confidence gate)
  const MIN_SCORE = 9;
  const topScore = hits[0]?.score ?? 0;
  if (top && topScore >= MIN_SCORE) {
    const body = top.body.length > 900 ? top.body.slice(0, 897) + '…' : top.body;
    return {
      intent,
      sources,
      text: `${body}\n\n*Sumber: ${top.source}*${FOOTER}`,
    };
  }

  // Di luar basis pengetahuan: JANGAN menebak / jangan tampilkan dokumen yang salah.
  const related = hits.filter((h) => h.score >= 3).slice(0, 3).map((h) => h.doc.title);
  const relatedLine = related.length ? `\n\nTopik terkait yang mungkin membantu:\n${related.map((t) => `- ${t}`).join('\n')}` : '';
  const excerpt = message.trim().length > 80 ? message.trim().slice(0, 77) + '…' : message.trim();
  return {
    intent: 'vitally_unknown',
    sources: [],
    text: `Mohon maaf, pertanyaan Anda ("${excerpt}") belum dapat saya jawab dari basis pengetahuan resmi RST — mencakup profil & kontak RS, pendaftaran, jadwal dokter, tarif, Home Care, kampanye, layanan unggulan, dan edukasi kesehatan umum. Saya tidak ingin memberi jawaban yang salah.\n\n**Yang bisa Anda lakukan:**\n1. Hubungi **Contact Center (0272) 321020** atau WhatsApp **0816-9170-00**\n2. Kunjungi **rsupsoeradji.id**\n3. Kondisi gawat darurat: **IGD 24 jam (0272) 321020 ext 200** atau **119**${relatedLine}\n\n💡 Jika **SAPA PASIEN-AI** (model offline PrivateLM / API cloud) diaktifkan petugas melalui Panel Admin → *Pengaturan AI*, pertanyaan umum seperti ini akan dijawab otomatis oleh AI — bukan template.${FOOTER.replace('\n\n_Mode jawaban offline', '\n\n_Anda juga bisa mencoba kata kunci lain, mis. "jadwal poli jantung", "cara daftar online", "tarif home care"._\n\n_Mode jawaban offline')}`,
  };
}
