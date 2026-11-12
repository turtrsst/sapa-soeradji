import { getDb } from './db';

export interface LlmConfig {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: LlmConfig = {
  enabled: false,
  provider: 'PrivateLM (cross-platform-llm-client) API Server — Mode Offline',
  baseUrl: 'http://localhost:8080/v1',
  apiKey: '',
  model: 'model-lokal-privatelm',
  temperature: 0.4,
  maxTokens: 900,
  timeoutMs: 60000,
};

export function getLlmConfig(): LlmConfig {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_config') as { value: string } | undefined;
    if (!row) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(row.value);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
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
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('llm_config', JSON.stringify(merged));
  return merged;
}

export function publicLlmConfig(cfg: LlmConfig) {
  return { ...cfg, apiKey: cfg.apiKey ? '••••••' + cfg.apiKey.slice(-4) : '' , hasApiKey: Boolean(cfg.apiKey) };
}
