import { getDb } from './db';
import { sanitizeKeyArray } from './keyPool';

export type ThinkingEffort = 'low' | 'medium' | 'high';

export interface LlmConfig {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  apiKey: string;   // SELALU = apiKeys[0] (back-compat); gunakan apiKeys untuk pool
  apiKeys: string[]; // pool mentah — HANYA untuk sisi server, jangan pernah dikirim ke klien
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  thinkingEffort: ThinkingEffort; // dikirim sebagai `reasoning` hanya ke Google Gemini
}

const DEFAULT_CONFIG: LlmConfig = {
  enabled: false,
  provider: 'Jan (janhq/jan) Local API Server — Mode Offline',
  baseUrl: 'http://127.0.0.1:1337/v1',
  apiKey: '',
  model: 'qwen2.5-3b-instruct',
  temperature: 0.5,
  maxTokens: 900,
  timeoutMs: 60000,
  apiKeys: [],
  thinkingEffort: 'low',
};

export function getLlmConfig(): LlmConfig {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_config') as { value: string } | undefined;
    if (!row) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(row.value);
    return normalizeConfig({ ...DEFAULT_CONFIG, ...parsed });
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function normalizeConfig(cfg: LlmConfig): LlmConfig {
  let apiKeys = sanitizeKeyArray(cfg.apiKeys);
  // Migrasi lembut: bila pool kosong tapi apiKey tunggal tersimpan (format lama) → jadi anggota pool
  if (!apiKeys.length && typeof cfg.apiKey === 'string' && cfg.apiKey.trim() && !cfg.apiKey.startsWith('••••')) {
    apiKeys = [cfg.apiKey.trim()];
  }
  const thinkingEffort: ThinkingEffort = (['low', 'medium', 'high'] as const).includes(cfg.thinkingEffort) ? cfg.thinkingEffort : 'low';
  return { ...cfg, apiKeys, apiKey: apiKeys[0] ?? '', thinkingEffort };
}

export function saveLlmConfig(cfg: Partial<LlmConfig>): LlmConfig {
  const db = getDb();
  const current = getLlmConfig();
  const merged: LlmConfig = {
    ...current,
    ...cfg,
    enabled: cfg.enabled ?? current.enabled,
    temperature: Number.isFinite(Number(cfg.temperature)) ? Math.min(2, Math.max(0, Number(cfg.temperature))) : current.temperature,
    maxTokens: Number.isFinite(Number(cfg.maxTokens)) ? Math.min(4096, Math.max(16, Math.round(Number(cfg.maxTokens)))) : current.maxTokens,
    timeoutMs: Number.isFinite(Number(cfg.timeoutMs)) ? Math.min(300000, Math.max(3000, Math.round(Number(cfg.timeoutMs)))) : current.timeoutMs,
  };
  merged.baseUrl = (merged.baseUrl || '').replace(/\/+$/, '');
  // Pool: bila apiKeys disertakan di payload → dipakai (sudah di-sanitize); bila tidak → pakai yang tersimpan
  const pool = cfg.apiKeys !== undefined ? sanitizeKeyArray(cfg.apiKeys) : current.apiKeys;
  merged.apiKeys = pool;
  merged.apiKey = pool[0] ?? '';
  merged.thinkingEffort = (['low', 'medium', 'high'] as const).includes(cfg.thinkingEffort as ThinkingEffort) ? (cfg.thinkingEffort as ThinkingEffort) : current.thinkingEffort;
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('llm_config', JSON.stringify(merged));
  return merged;
}

export function publicLlmConfig(cfg: LlmConfig) {
  // JANGAN pernah kirim apiKeys mentah ke klien — hanya hint 4 digit terakhir, berurutan.
  const { apiKeys, apiKey: _raw, ...rest } = cfg;
  return {
    ...rest,
    apiKey: apiKeys.length ? '••••••' + apiKeys[0].slice(-4) : '',
    hasApiKey: apiKeys.length > 0,
    apiKeys: apiKeys.map((k) => '••••••' + k.slice(-4)),
    apiKeyCount: apiKeys.length,
  };
}
