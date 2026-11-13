// Uji renderer Markdown: link internal → pill ke halaman aplikasi; link eksternal → tab baru;
// skema berbahaya (javascript:) tidak pernah menjadi <a href>.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from '../src/components/Markdown';

let passed = 0, failed = 0;
const ok = (name: string, cond: boolean) => {
  if (cond) { passed++; console.log('  ✓', name); } else { failed++; console.error('  ✗', name); }
};

console.log('SOERA AI — uji renderer link markdown\n');

const sample = [
  'Buka [halaman Jadwal Dokter](/jadwal) untuk detail.',
  '',
  '- [Home Care](/home-care) juga tersedia',
  '',
  'Pemesanan online: [Soeradji GOCARE](https://sias.rsupsoeradji.id/homecare/)',
  '',
  'Berbahaya: [klik](javascript:alert(1)) tidak boleh jadi link',
].join('\n');

const html = renderToStaticMarkup(React.createElement(Markdown, { text: sample }));

ok('link internal /jadwal dirender sebagai <a href="/jadwal">', html.includes('href="/jadwal"'));
ok('label link internal tampil', html.includes('halaman Jadwal Dokter'));
ok('link internal berupa pill (rounded-full)', html.includes('rounded-full'));
ok('link internal /home-care (di bullet list) dirender', html.includes('href="/home-care"'));
ok('link eksternal GOCARE dirender', html.includes('href="https://sias.rsupsoeradji.id/homecare/"'));
ok('link eksternal dibuka di tab baru + noopener', html.includes('target="_blank"') && html.includes('noopener'));
ok('skema javascript: TIDAK menjadi href', !/href="javascript:/i.test(html));
ok('link internal SPA pakai navigasi client-side (bukan target _blank)', !/<a[^>]*href="\/jadwal"[^>]*target="_blank"/.test(html));

console.log(`\n${passed} lolos, ${failed} gagal`);
process.exit(failed ? 1 : 0);
