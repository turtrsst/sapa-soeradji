// Base-path deploy (mis. sias.rsupsoeradji.id/soera-ai/).
// Nilai di-set saat BUILD via SOERA_BASE_PATH (next.config.mjs -> NEXT_PUBLIC_BASE_PATH).
// Default '' (root) — tidak ada perubahan perilaku untuk instalasi root.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const bp = (path: string): string => `${basePath}${path}`;
