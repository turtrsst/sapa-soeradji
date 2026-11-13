// Uji rate limiter (fixed window, in-memory) — tanpa jaringan.
import { rateLimit, recordFailure, tooManyFailures, clearFailures, rateLimitKey, clientIp } from '../src/lib/rateLimit.ts';

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log('  ✓', name); } else { failed++; console.error('  ✗', name); } };

console.log('SOERA AI — uji rate limiter\n');

// ---- fixed window dasar
const k = 'test:window:1';
ok('panggilan 1 ok, sisa 2/3', (() => { const r = rateLimit(k, 3, 1000, 1000); return r.ok && r.remaining === 2; })());
ok('panggilan 2 ok, sisa 1', (() => { const r = rateLimit(k, 3, 1000, 1100); return r.ok && r.remaining === 1; })());
ok('panggilan 3 ok, sisa 0', (() => { const r = rateLimit(k, 3, 1000, 1200); return r.ok && r.remaining === 0; })());
const blocked = rateLimit(k, 3, 1000, 1300);
ok('panggilan 4 diblokir (429)', !blocked.ok && blocked.remaining === 0);
ok('retryAfterSec ≥ 1', blocked.retryAfterSec >= 1);
ok('setelah window lewat, diizinkan lagi', (() => { const r = rateLimit(k, 3, 1000, 2101); return r.ok && r.remaining === 2; })());

// ---- kegagalan login
const lk = 'test:login:1';
ok('belum diblokir di awal', !tooManyFailures(lk, 3, 1000, 1000).blocked);
recordFailure(lk, 1000, 1000); recordFailure(lk, 1000, 1050); recordFailure(lk, 1000, 1100);
ok('3 kegagalan → diblokir', tooManyFailures(lk, 3, 1000, 1100).blocked);
clearFailures(lk);
ok('setelah clear (berhasil) → tidak diblokir', !tooManyFailures(lk, 3, 1000, 1150).blocked);
recordFailure(lk, 1000, 1200);
ok('kegagalan setelah clear dihitung dari awal', !tooManyFailures(lk, 3, 1000, 1250).blocked);

// ---- key hashing & clientIp
const h1 = { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' };
const h2 = { 'x-forwarded-for': '203.0.113.2' };
ok('clientIp ambil IP pertama dari x-forwarded-for', clientIp(new Headers(h1)) === '203.0.113.1');
const keyA = rateLimitKey('chat', new Headers(h1)), keyB = rateLimitKey('chat', new Headers(h2));
ok('IP berbeda → key berbeda', keyA !== keyB);
ok('key tidak mengandung IP mentah', !keyA.includes('203.0.113.1'));
ok('key stabil untuk IP sama', keyA === rateLimitKey('chat', new Headers(h1)));

console.log(`\n${passed} lolos, ${failed} gagal`);
process.exit(failed ? 1 : 0);
