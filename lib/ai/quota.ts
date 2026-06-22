import {
  FREE_DAILY_INTERPRET_QUOTA,
  PRO_DAILY_INTERPRET_QUOTA,
} from '@/lib/subscription/plans';

export const QUOTA_COOKIE_NAME = 'ziwei_ai_quota';

/** @deprecated use FREE_DAILY_INTERPRET_QUOTA from lib/subscription/plans */
export const FREE_DAILY_QUOTA = FREE_DAILY_INTERPRET_QUOTA;
export const PRO_DAILY_QUOTA = PRO_DAILY_INTERPRET_QUOTA;

export interface QuotaState {
  date: string;
  used: number;
  bonus: number;
}

export function getBeijingDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Read a non-HttpOnly cookie in the browser. */
export function readBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length);
  }
  return undefined;
}

export function parseQuotaState(raw: string | undefined): QuotaState {
  const today = getBeijingDateKey();
  if (!raw) return { date: today, used: 0, bonus: 0 };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<QuotaState>;
    const bonus = Math.max(0, parsed.bonus ?? 0);
    if (parsed.date !== today) {
      // Daily used resets at Beijing midnight; bonus credits persist until consumed.
      return { date: today, used: 0, bonus };
    }
    return {
      date: today,
      used: Math.max(0, parsed.used ?? 0),
      bonus,
    };
  } catch {
    return { date: today, used: 0, bonus: 0 };
  }
}

export function serializeQuotaState(state: QuotaState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function buildQuotaCookieValue(state: QuotaState): string {
  return serializeQuotaState(state);
}

export function getQuotaRemaining(state: QuotaState, dailyLimit = FREE_DAILY_INTERPRET_QUOTA): number {
  return Math.max(0, dailyLimit - state.used) + state.bonus;
}

export type ConsumeQuotaResult =
  | { ok: true; remaining: number; state: QuotaState; usedBonus: boolean }
  | { ok: false; remaining: 0; message: string };

export function consumeQuota(
  rawCookie: string | undefined,
  preferBonus: boolean,
  dailyLimit = FREE_DAILY_INTERPRET_QUOTA,
): ConsumeQuotaResult {
  const state = parseQuotaState(rawCookie);

  if (preferBonus && state.bonus > 0) {
    const next: QuotaState = { ...state, bonus: state.bonus - 1 };
    return {
      ok: true,
      remaining: getQuotaRemaining(next, dailyLimit),
      state: next,
      usedBonus: true,
    };
  }

  if (state.used >= dailyLimit) {
    return {
      ok: false,
      remaining: 0,
      message: `今日免费次数（${dailyLimit} 次）已用完，明日 0 点（北京时间）重置`,
    };
  }

  const next: QuotaState = { ...state, used: state.used + 1 };
  return {
    ok: true,
    remaining: getQuotaRemaining(next, dailyLimit),
    state: next,
    usedBonus: false,
  };
}

export function rollbackQuota(state: QuotaState, usedBonus: boolean): QuotaState {
  if (usedBonus) {
    return { ...state, bonus: state.bonus + 1 };
  }
  return { ...state, used: Math.max(0, state.used - 1) };
}

export function quotaExhaustedMessage(dailyLimit = FREE_DAILY_INTERPRET_QUOTA): string {
  return `今日免费次数（${dailyLimit} 次）已用完，明日 0 点（北京时间）重置`;
}
