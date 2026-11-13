// Uji kuota "pertanyaan bebas AI" (tanpa jaringan, tanpa DB — fungsi murni).
import { dayKeyJakarta, quotaRemaining, AI_DAILY_LIMIT } from '../src/lib/aiUsage.ts';

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log('  ✓', name); } else { failed++; console.error('  ✗', name); } };

console.log('SOERA AI — uji kuota AI harian\n');

// Reset 00.00 WIB (UTC+7): 16:59:59Z = 23:59:59 WIB hari yang sama; 17:00:00Z = 00:00 WIB besok
ok('16:59:59Z → tanggal WIB masih hari yang sama', dayKeyJakarta(new Date('2026-11-12T16:59:59Z')) === '2026-11-12');
ok('17:00:00Z → tanggal WIB sudah besok', dayKeyJakarta(new Date('2026-11-12T17:00:00Z')) === '2026-11-13');
ok('00:30:00Z → tanggal WIB pagi hari yang sama', dayKeyJakarta(new Date('2026-11-12T00:30:00Z')) === '2026-11-12');

// Aritmetika sisa kuota
ok('0 terpakai → sisa 5', quotaRemaining(0, 5) === 5);
ok('4 terpakai → sisa 1', quotaRemaining(4, 5) === 1);
ok('5 terpakai → sisa 0', quotaRemaining(5, 5) === 0);
ok('7 terpakai → sisa 0 (tidak negatif)', quotaRemaining(7, 5) === 0);
ok('custom max 10, 3 terpakai → sisa 7', quotaRemaining(3, 10) === 7);

// Batas default
ok('limit default = 5 pertanyaan bebas AI per hari', AI_DAILY_LIMIT === 5);

console.log(`\n${passed} lolos, ${failed} gagal`);
process.exit(failed ? 1 : 0);
