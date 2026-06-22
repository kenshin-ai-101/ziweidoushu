import {
  FREE_DAILY_HEMING_QUOTA,
  PRO_DAILY_HEMING_QUOTA,
} from '@/lib/subscription/plans';
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

/** @deprecated use FREE_DAILY_HEMING_QUOTA from lib/subscription/plans */
export const HEMING_FREE_DAILY_QUOTA = FREE_DAILY_HEMING_QUOTA;
export const HEMING_PRO_DAILY_QUOTA = PRO_DAILY_HEMING_QUOTA;

export function getHemingQuotaRemaining(
  state: QuotaState,
  dailyLimit = FREE_DAILY_HEMING_QUOTA,
): number {
  return Math.max(0, dailyLimit - state.used) + state.bonus;
}

export function consumeHemingQuota(
  rawCookie: string | undefined,
  preferBonus: boolean,
  dailyLimit = FREE_DAILY_HEMING_QUOTA,
): ConsumeQuotaResult {
  const state = parseQuotaState(rawCookie);
  const today = getBeijingDateKey();
  const normalized: QuotaState =
    state.date === today ? state : { date: today, used: 0, bonus: state.bonus };

  if (preferBonus && normalized.bonus > 0) {
    const next: QuotaState = { ...normalized, bonus: normalized.bonus - 1 };
    return {
      ok: true,
      remaining: getHemingQuotaRemaining(next, dailyLimit),
      state: next,
      usedBonus: true,
    };
  }

  if (normalized.used >= dailyLimit) {
    return {
      ok: false,
      remaining: 0,
      message: `合盘今日免费次数（${dailyLimit} 次）已用完，明日 0 点（北京时间）重置`,
    };
  }

  const next: QuotaState = { ...normalized, used: normalized.used + 1 };
  return {
    ok: true,
    remaining: getHemingQuotaRemaining(next, dailyLimit),
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
