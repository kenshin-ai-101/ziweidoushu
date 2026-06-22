import { quotaExhaustedMessage } from '@/lib/ai/quota';
import { buildChatCacheKey, getChartToken, hashString } from './chart-token';
import { getClientQuotaRemaining, syncQuotaRemaining } from './quota-client';
import type { ZiweiChart } from './types';

export interface InterpretMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterpretRequestOptions {
  chart: ZiweiChart;
  messages: InterpretMessage[];
  forceFresh?: boolean;
  cacheKey?: string;
  signal?: AbortSignal;
  /** 跳过客户端配额预检（默认 false） */
  skipQuotaPrecheck?: boolean;
}

export type InterpretResult =
  | { ok: true; cached: true; text: string; quotaRemaining?: number }
  | {
      ok: true;
      cached: false;
      reader: ReadableStreamDefaultReader<Uint8Array>;
      quotaRemaining?: number;
      modelSource?: string;
      modelUsed?: string;
    }
  | { ok: false; error: string; quotaRemaining?: number };

/** 划词追问选区上限 — 与生产一致 */
export const SELECTION_FOLLOWUP_MAX_CHARS = 200;

const CACHE_TTL_MS = 2_592_000_000; // 30 days — 与生产一致
const REQUEST_TIMEOUT_MS = 65_000;

let activeAbort: AbortController | null = null;

function readCache(cacheKey: string): string | null {
  if (typeof window === 'undefined' || !cacheKey) return null;
  try {
    const raw = localStorage.getItem(`ai_cache_${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { text?: string; savedAt?: number };
    if (!parsed.text || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt >= CACHE_TTL_MS) {
      localStorage.removeItem(`ai_cache_${cacheKey}`);
      return null;
    }
    return parsed.text;
  } catch {
    return null;
  }
}

export function writeInterpretCache(cacheKey: string, text: string) {
  if (typeof window === 'undefined' || !cacheKey || !text) return;
  try {
    const payload = JSON.stringify({ text, savedAt: Date.now() });
    try {
      localStorage.setItem(`ai_cache_${cacheKey}`, payload);
    } catch {
      trimInterpretCaches(payload.length);
      localStorage.setItem(`ai_cache_${cacheKey}`, payload);
    }
  } catch {
    /* ignore storage errors */
  }
}

function trimInterpretCaches(incomingSize: number) {
  const now = Date.now();
  const entries: Array<{ key: string; savedAt: number; size: number }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('ai_cache_')) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { savedAt?: number };
      if (!parsed.savedAt || now - parsed.savedAt >= CACHE_TTL_MS) {
        localStorage.removeItem(key);
        continue;
      }
      entries.push({ key, savedAt: parsed.savedAt, size: raw.length });
    } catch {
      localStorage.removeItem(key);
    }
  }
  let total = entries.reduce((sum, item) => sum + item.size, 0) + incomingSize;
  entries.sort((a, b) => a.savedAt - b.savedAt);
  while (total > 4_194_304 && entries.length > 0) {
    const item = entries.shift();
    if (!item) break;
    localStorage.removeItem(item.key);
    total -= item.size;
  }
}

function mapInterpretError(status: number, fallbackBody?: string): string {
  if (status === 401) return '会话过期，请回到首页重新算盘';
  if (status === 402) {
    if (fallbackBody && !fallbackBody.startsWith('{') && !/invalid_request_error|insufficient|unknown_error/i.test(fallbackBody)) {
      return fallbackBody;
    }
    return quotaExhaustedMessage();
  }
  if (status === 403) return '请通过本平台访问';
  if (status === 429) return '请求过于频繁，请稍后再试';
  if (status >= 500) return 'AI 服务器繁忙，请稍后重试';
  return 'AI 暂时不可用，请稍后重试';
}

function applyQuotaHeader(header: string | null): number | undefined {
  if (header == null) return undefined;
  const remaining = Number.parseInt(header, 10);
  if (!Number.isFinite(remaining)) return undefined;
  syncQuotaRemaining(remaining);
  return remaining;
}

export function normalizeSelectionText(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length < 2) return null;
  if (text.length <= SELECTION_FOLLOWUP_MAX_CHARS) return text;
  return text.slice(0, SELECTION_FOLLOWUP_MAX_CHARS);
}

export function buildSelectionFollowUpPrompt(selected: string) {
  const text = normalizeSelectionText(selected) ?? selected.trim().slice(0, SELECTION_FOLLOWUP_MAX_CHARS);
  return `关于这段：「${text}」，请就此展开追问、深入解读。`;
}

export function buildFocusCacheKey(chartToken: string, prompt: string) {
  return `${chartToken}_focusv2_${hashString(prompt)}`;
}

export async function requestInterpret(options: InterpretRequestOptions): Promise<InterpretResult> {
  const chartToken = getChartToken(options.chart);
  const cacheKey = options.cacheKey ?? buildChatCacheKey(chartToken, options.messages);
  const mirrorRemaining = getClientQuotaRemaining();

  if (cacheKey && !options.forceFresh) {
    const cached = readCache(cacheKey);
    if (cached) {
      return { ok: true, cached: true, text: cached, quotaRemaining: mirrorRemaining };
    }
  }

  if (!options.skipQuotaPrecheck && getClientQuotaRemaining() <= 0) {
    syncQuotaRemaining(0);
    return { ok: false, error: quotaExhaustedMessage(), quotaRemaining: 0 };
  }

  activeAbort?.abort();
  const controller = new AbortController();
  activeAbort = controller;
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Quota-Prefer': 'bonus',
      },
      body: JSON.stringify({
        chart: options.chart,
        chartToken,
        messages: options.messages,
        forceFresh: !!options.forceFresh,
      }),
      signal: controller.signal,
    });

    window.clearTimeout(timeout);

    if (!res.ok) {
      let errorText = '';
      try {
        const data = await res.json();
        errorText = typeof data?.error === 'string' ? data.error.trim() : '';
      } catch {
        errorText = await res.text().catch(() => '');
      }
      const quotaRemaining = applyQuotaHeader(res.headers.get('X-Quota-Remaining'));
      return {
        ok: false,
        error: mapInterpretError(res.status, errorText),
        quotaRemaining,
      };
    }

    if (!res.body) return { ok: false, error: '无响应流' };

    const quotaRemaining = applyQuotaHeader(res.headers.get('X-Quota-Remaining'));
    return {
      ok: true,
      cached: false,
      reader: res.body.getReader(),
      quotaRemaining,
      modelSource: res.headers.get('X-Model-Source') ?? undefined,
      modelUsed: res.headers.get('X-Model-Used') ?? undefined,
    };
  } catch (err) {
    window.clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: '请求被取消' };
    }
    return { ok: false, error: '网络错误，请检查连接后重试' };
  } finally {
    if (activeAbort === controller) activeAbort = null;
  }
}

export async function readInterpretStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  let assistantText = '';
  let pending = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return assistantText;
      try {
        const delta = JSON.parse(data).delta?.text ?? '';
        if (!delta) continue;
        assistantText += delta;
        onDelta(assistantText);
      } catch { /* skip malformed chunk */ }
    }
  }

  if (pending.startsWith('data: ')) {
    const data = pending.slice(6).trim();
    if (data && data !== '[DONE]') {
      try {
        const delta = JSON.parse(data).delta?.text ?? '';
        if (delta) {
          assistantText += delta;
          onDelta(assistantText);
        }
      } catch { /* skip */ }
    }
  }

  return assistantText;
}
