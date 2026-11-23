// Uji builder kartu Generative UI (jadwal/tarif/kampanye/info).
import assert from 'node:assert/strict';
import { buildJadwalCard, buildTarifCard, buildKampanyeCard, buildInfoCard } from '../src/lib/genui.ts';

let passed = 0;
const ok = (name, cond) => { assert.ok(cond, name); console.log('  ✓', name); passed++; };

console.log('SOERA AI — uji kartu generative UI\n');

const jd = buildJadwalCard([
  { poli: 'Poli Penyakit Dalam', dokter: 'dr. Taufik Hidayat, Sp.PD', spesialis: 'Penyakit Dalam', hari: 'Selasa', jam: '12.00–14.00 WIB' },
  { poli: 'Poli Jantung', dokter: 'dr. Suharso, Sp.JP', spesialis: 'Jantung', hari: 'Senin', jam: '08.00–10.00 WIB', catatan: 'Non reguler' },
]);
ok('jadwal: kind & item', jd.kind === 'jadwal' && jd.items.length === 2);
ok('jadwal: field wajib', jd.items[0].dokter.includes('Taufik') && jd.items[0].hari === 'Selasa');
ok('jadwal: catatan opsional ikut', jd.items[1].catatan === 'Non reguler');

const tf = buildTarifCard(Array.from({ length: 12 }, (_, i) => ({ nama: 'Item ' + (i + 1), jumlah: 1000 * (i + 1), section: 'HC' })));
ok('tarif: maks 8 item', tf.kind === 'tarif' && tf.items.length === 8);
ok('tarif: membawa nomor SK', typeof tf.nomorSK === 'string' && tf.nomorSK.length > 0);

const kp = buildKampanyeCard([{ title: 'CERDIK', summary: 'Edukasi cerdik', location: 'RST', start_date: '2026-11-01', end_date: '2026-11-30' }]);
ok('kampanye: item terisi', kp.items[0].title === 'CERDIK' && kp.items[0].start === '2026-11-01');

const inf = buildInfoCard([
  { doc: { title: 'Cara Daftar Online', source: 'info-rst.md' } },
  { doc: { title: 'Cara Daftar Online', source: 'info-rst.md' } },
  { doc: { title: 'Home Care', source: 'homecare.md' } },
]);
ok('info: judul duplikat dibuang', inf.items.length === 2);
ok('info: sumber ikut', inf.items[0].source === 'info-rst.md');
ok('buildInfoCard aman utk input kosong', buildInfoCard([]).items.length === 0 && buildInfoCard(undefined).items.length === 0);

console.log(`\n${passed} lolos`);
