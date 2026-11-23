// Uji pool API key & logika failover (murni, tanpa jaringan).
import assert from 'node:assert/strict';
import { sanitizeKeyArray, isFailoverReason, isKeyCoolingDown, markKeyCooldown, clearKeyCooldowns, keyHint } from '../src/lib/keyPool.ts';

let passed = 0;
const ok = (name, cond) => { assert.ok(cond, name); console.log('  ✓', name); passed++; };

console.log('SOERA AI — uji pool API key & fallback\n');

console.log('Sanitasi pool:');
ok('trim + buang kosong', JSON.stringify(sanitizeKeyArray(['  a  ', '', 'b'])) === '["a","b"]');
ok('dedupe', JSON.stringify(sanitizeKeyArray(['k1', 'k1', 'k2'])) === '["k1","k2"]');
ok('hint •••• tidak disimpan jadi key', JSON.stringify(sanitizeKeyArray(['••••••414c', 'real-key'])) === '["real-key"]');
ok('maks 8 key', sanitizeKeyArray(Array.from({ length: 12 }, (_, i) => 'key-' + i)).length === 8);
ok('bukan array → []', JSON.stringify(sanitizeKeyArray('nope')) === '[]');

console.log('Aturan failover:');
ok('401 failover', isFailoverReason('HTTP 401 — invalid key'));
ok('402 failover', isFailoverReason('HTTP 402 Payment Required'));
ok('403 failover', isFailoverReason('HTTP 403 forbidden'));
ok('429 failover', isFailoverReason('HTTP 429 rate limit'));
ok('500 failover', isFailoverReason('HTTP 500'));
ok('timeout failover', isFailoverReason('timeout'));
ok('fetch failed failover', isFailoverReason('fetch failed'));
ok('rate limit tanpa status failover', isFailoverReason('rate limit exceeded'));
ok('400 TIDAK failover (deterministik)', !isFailoverReason('HTTP 400 — invalid request'));
ok('404 TIDAK failover (deterministik)', !isFailoverReason('HTTP 404 model not found'));
ok('error biasa TIDAK failover', !isFailoverReason('Agent tidak mengembalikan teks'));
ok('pesan AI SDK "invalid api key" → failover', isFailoverReason('HTTP 401 — invalid api key'));
ok('pesan AI SDK tanpa status tetap failover', isFailoverReason('invalid api key'));
ok('key dicabut → failover', isFailoverReason('HTTP 401 — API key revoked'));

console.log('Cooldown:');
clearKeyCooldowns();
const now = 1_000_000;
ok('belum pernah di-cooldown', !isKeyCoolingDown('key-a', now));
markKeyCooldown('key-a', now, 60_000);
ok('langsung setelah gagal → cooldown', isKeyCoolingDown('key-a', now + 1_000));
ok('setelah masa cooldown habis', !isKeyCoolingDown('key-a', now + 61_000));
clearKeyCooldowns();
ok('clearKeyCooldowns menghapus semua', !isKeyCoolingDown('key-a', now + 1_000));

console.log('Hint key:');
ok('hint 4 digit terakhir', keyHint('sk-or-v1-abcdef1234567890abcd') === '••••abcd');
ok('key kosong → —', keyHint('') === '—');

console.log(`\n${passed} lolos`);
