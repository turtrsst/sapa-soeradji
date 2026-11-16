// Node.js runtime only — peringatan konfigurasi saat server start (bukan di build).
// Next.js 15: instrumentation.ts otomatis dimuat (experimental.instrumentationHook tidak lagi diperlukan).
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { adminAuthWeaknesses } = await import('./lib/auth');
  const issues = adminAuthWeaknesses();
  for (const i of issues) {
    console.warn(`\n⚠️  [KEAMANAN] ${i}\n`);
  }
  if (process.env.NODE_ENV === 'production' && issues.length) {
    console.warn('⚠️  [KEAMANAN] Jangan publish ke internet sebelum masalah di atas diperbaiki (lihat docs/DEPLOYMENT-PUBLIK.md).\n');
  }
}
