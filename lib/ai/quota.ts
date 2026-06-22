export const QUOTA_COOKIE_NAME = 'ziwei_ai_quota';

export const FREE_DAILY_QUOTA = Number.parseInt(
  process.env.AI_FREE_DAILY_QUOTA ?? '10',
  10,
);

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

export function parseQuotaState(raw: string | undefined): QuotaState {
  const today = getBeijingDateKey();
  if (!raw) return { date: today, used: 0, bonus: 0 };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<QuotaState>;
    if (parsed.date !== today) return { date: today, used: 0, bonus: 0 };
    return {
      date: today,
      used: Math.max(0, parsed.used ?? 0),
      bonus: Math.max(0, parsed.bonus ?? 0),
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

export function getQuotaRemaining(state: QuotaState): number {
  return Math.max(0, FREE_DAILY_QUOTA - state.used) + state.bonus;
}

export type ConsumeQuotaResult =
  | { ok: true; remaining: number; state: QuotaState; usedBonus: boolean }
  | { ok: false; remaining: 0; message: string };

export function consumeQuota(
  rawCookie: string | undefined,
  preferBonus: boolean,
): ConsumeQuotaResult {
  const state = parseQuotaState(rawCookie);

  if (preferBonus && state.bonus > 0) {
    const next: QuotaState = { ...state, bonus: state.bonus - 1 };
    return {
      ok: true,
      remaining: getQuotaRemaining(next),
      state: next,
      usedBonus: true,
    };
  }

  if (state.used >= FREE_DAILY_QUOTA) {
    return {
      ok: false,
      remaining: 0,
      message: `今日免费次数（${FREE_DAILY_QUOTA} 次）已用完，明日 0 点（北京时间）重置`,
    };
  }

  const next: QuotaState = { ...state, used: state.used + 1 };
  return {
    ok: true,
    remaining: getQuotaRemaining(next),
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

export function quotaExhaustedMessage(): string {
  return `今日免费次数（${FREE_DAILY_QUOTA} 次）已用完，明日 0 点（北京时间）重置`;
}
