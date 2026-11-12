// Uji basis pengetahuan & retrieval SAPA PASIEN (jalan lokal, tanpa server, tanpa jaringan).
// Jalankan: npm test
import assert from 'node:assert/strict';
import { KB_DOCS } from '../src/lib/kb.ts';
import { JADWAL_DOKTER, searchJadwal, POLI_LIST } from '../src/lib/jadwal.ts';
import { TARIF_SECTIONS, searchTarif, allTarifItems, formatRp } from '../src/lib/tarif.ts';
import { retrieve, detectIntent, matchTarif, matchJadwal } from '../src/lib/rag.ts';
import { composeOfflineAnswer } from '../src/lib/offline.ts';

let passed = 0;
const ok = (name, cond) => { assert.ok(cond, name); console.log('  ✓', name); passed++; };

console.log('SAPA PASIEN — uji basis pengetahuan & retrieval\n');

console.log('Database jadwal & tarif:');
ok('KB docs >= 15', KB_DOCS.length >= 15);
ok('KB docs punya sumber', KB_DOCS.every((d) => d.source && d.body.length > 80));
ok('Jadwal dokter terisi (>= 40 baris)', JADWAL_DOKTER.length >= 40);
ok('POLI_LIST tidak kosong', POLI_LIST.length >= 15);
ok('Total item tarif sesuai SK (>= 75)', allTarifItems().length >= 75);
ok('Sewa alat dibatasi 2 (tempat tidur & oksigen)', TARIF_SECTIONS.find((s) => s.id === 'sewa-alat').items.length === 2);
ok('Tarif visite dokter spesialis Rp225.000', allTarifItems().find((i) => i.nama === 'Dokter Spesialis')?.jumlah === 225000);
ok('Pasang Infus Rp125.000', allTarifItems().find((i) => i.nama === 'Pasang Infus')?.jumlah === 125000);
ok('formatRp format Indonesia', formatRp(125000) === 'Rp125.000');

console.log('\nPencarian terstruktur:');
ok('searchJadwal "jantung" menemukan Sp.JP', searchJadwal('jantung').some((j) => j.dokter.includes('Sp.JP')));
ok('searchJadwal poli filter', searchJadwal('', 'Poli Urologi').every((j) => j.poli === 'Poli Urologi'));
ok('searchTarif "nebuliser"', searchTarif('nebuliser').some((t) => t.jumlah === 110000));
ok('searchTarif "visite"', searchTarif('visite').length >= 1);

console.log('\nIntent detection:');
ok('darurat', detectIntent('saya nyeri dada hebat mau pingsan') === 'darurat');
ok('jadwal', detectIntent('kapan jadwal dokter gigi?') === 'jadwal');
ok('tarif', detectIntent('berapa biaya perawatan luka sedang?') === 'tarif');
ok('keluhan', detectIntent('saya ingin komplain pelayanan pendaftaran') === 'keluhan');
ok('daftar', detectIntent('cara daftar online lewat wa') === 'daftar');
ok('kontak', detectIntent('nomor telepon dan alamat rumah sakit') === 'kontak');
ok('IGD → darurat (aman)', detectIntent('nomor IGD 24 jam') === 'darurat');

console.log('\nRetrieval (RAG offline):');
const hits = retrieve('cara pendaftaran online whatsapp', 3);
ok('retrieval menemukan dokumen pendaftaran', hits.some((h) => h.doc.id === 'pendaftaran-online'));
ok('retrieval skor terurut', hits.every((h, i, a) => i === 0 || a[i - 1].score >= h.score));
ok('matchTarif visite spesialis', matchTarif('biaya visite dokter spesialis home care').some((t) => t.jumlah === 225000));
ok('matchJadwal jantung', matchJadwal('jadwal dokter poli jantung').some((j) => j.dokter.includes('Sp.JP')));

console.log('\nJawaban offline end-to-end:');
const darurat = composeOfflineAnswer('ayah saya sesak napas sekali');
ok('darurat → arahkan IGD ext 200', darurat.text.includes('321020') && darurat.intent === 'darurat');
const jadwal = composeOfflineAnswer('jadwal dokter poli jantung');
ok('jadwal → menyebut dr. Yulianto', /Yulianto|Donna Paramita/.test(jadwal.text));
const tarif = composeOfflineAnswer('berapa biaya pasang infus home care');
ok('tarif → Rp125.000', tarif.text.includes('125.000'));
const keluhan = composeOfflineAnswer('saya kecewa dengan pelayanan, ini komplain');
ok('keluhan → hotline/menu keluhan', /0851-7957-7302|tiket/i.test(keluhan.text));
const daftar = composeOfflineAnswer('bagaimana cara daftar online');
ok('daftar → WA 0816-9170-00', daftar.text.includes('0816-9170-00'));

console.log('\nBatuk & pertanyaan di luar KB (regresi template keliru):');
const batuk = composeOfflineAnswer('apakah batuk berdahak itu bahaya?');
ok('batuk berdahak → edukasi batuk (bukan FAQ sembarangan)', !batuk.text.includes('Bawa apa saat berobat') && /batuk/i.test(batuk.text) && /(2 minggu|TB|Paru)/i.test(batuk.text));
const topBatuk = retrieve('apakah batuk berdahak itu bahaya?', 1)[0];
ok('retrieval batuk → dokumen edukasi-batuk', topBatuk?.doc.id === 'edukasi-batuk');
const outside = composeOfflineAnswer('siapa presiden pertama Indonesia?');
ok('di luar KB → jawaban jujur + hotline, bukan dokumen acak', outside.text.includes('321020') && outside.text.includes('basis pengetahuan') && !outside.text.includes('T: Bawa apa'));

console.log(`\n${passed} pengujian lulus ✓`);
