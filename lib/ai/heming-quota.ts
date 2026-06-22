import {
  buildQuotaCookieValue,
  getBeijingDateKey,
  parseQuotaState,
  rollbackQuota as rollbackGenericQuota,
  serializeQuotaState,
  type ConsumeQuotaResult,
  type QuotaState,
} from './quota';

export const HEMING_QUOTA_COOKIE_NAME = 'ziwei_heming_quota';

export const HEMING_FREE_DAILY_QUOTA = Number.parseInt(
  process.env.HEMING_FREE_DAILY_QUOTA ?? '10',
  10,
);

export function getHemingQuotaRemaining(state: QuotaState): number {
  return Math.max(0, HEMING_FREE_DAILY_QUOTA - state.used) + state.bonus;
}

export function consumeHemingQuota(
  rawCookie: string | undefined,
  preferBonus: boolean,
): ConsumeQuotaResult {
  const state = parseQuotaState(rawCookie);
  const today = getBeijingDateKey();
  const normalized: QuotaState = state.date === today ? state : { date: today, used: 0, bonus: 0 };

  if (preferBonus && normalized.bonus > 0) {
    const next: QuotaState = { ...normalized, bonus: normalized.bonus - 1 };
    return {
      ok: true,
      remaining: getHemingQuotaRemaining(next),
      state: next,
      usedBonus: true,
    };
  }

  if (normalized.used >= HEMING_FREE_DAILY_QUOTA) {
    return {
      ok: false,
      remaining: 0,
      message: `合盘今日免费次数（${HEMING_FREE_DAILY_QUOTA} 次）已用完，明日 0 点（北京时间）重置`,
    };
  }

  const next: QuotaState = { ...normalized, used: normalized.used + 1 };
  return {
    ok: true,
    remaining: getHemingQuotaRemaining(next),
    state: next,
    usedBonus: false,
  };
}

export function rollbackHemingQuota(state: QuotaState, usedBonus: boolean): QuotaState {
  return rollbackGenericQuota(state, usedBonus);
}

export {
  buildQuotaCookieValue,
  serializeQuotaState,
};
