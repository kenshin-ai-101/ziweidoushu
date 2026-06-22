import {
  parseQuotaState,
  rollbackQuota,
  type ConsumeQuotaResult,
  type QuotaState,
} from '@/lib/ai/quota';
import { HEMING_QUOTA_COOKIE_NAME } from '@/lib/ai/heming-quota';
import { QUOTA_COOKIE_NAME } from '@/lib/ai/quota';
import { FREE_DAILY_INTERPRET_QUOTA } from '@/lib/subscription/plans';

export type SharedQuotaBucket = 'interpret' | 'heming';

export interface SharedQuotaSnapshot {
  interpret: QuotaState;
  heming: QuotaState;
  totalUsed: number;
  totalBonus: number;
  /** Daily pool remaining (resets at Beijing midnight). */
  dailyRemaining: number;
  /** Total usable asks today: dailyRemaining + totalBonus. */
  remaining: number;
}

export function snapshotSharedQuota(
  interpretRaw: string | undefined,
  hemingRaw: string | undefined,
  dailyLimit = FREE_DAILY_INTERPRET_QUOTA,
): SharedQuotaSnapshot {
  const interpret = parseQuotaState(interpretRaw);
  const heming = parseQuotaState(hemingRaw);
  const totalUsed = interpret.used + heming.used;
  const totalBonus = interpret.bonus + heming.bonus;
  const dailyRemaining = Math.max(0, dailyLimit - totalUsed);
  const remaining = dailyRemaining + totalBonus;
  return { interpret, heming, totalUsed, totalBonus, dailyRemaining, remaining };
}

export function consumeSharedQuota(
  interpretRaw: string | undefined,
  hemingRaw: string | undefined,
  bucket: SharedQuotaBucket,
  preferBonus: boolean,
  dailyLimit = FREE_DAILY_INTERPRET_QUOTA,
): ConsumeQuotaResult & { interpret: QuotaState; heming: QuotaState } {
  const snapshot = snapshotSharedQuota(interpretRaw, hemingRaw, dailyLimit);
  const interpret = snapshot.interpret;
  const heming = snapshot.heming;

  if (preferBonus && snapshot.totalBonus > 0) {
    if (interpret.bonus > 0) {
      const nextInterpret: QuotaState = { ...interpret, bonus: interpret.bonus - 1 };
      return {
        ok: true,
        remaining: remainingFor(nextInterpret, heming, dailyLimit),
        state: nextInterpret,
        usedBonus: true,
        interpret: nextInterpret,
        heming,
      };
    }
    const nextHeming: QuotaState = { ...heming, bonus: heming.bonus - 1 };
    return {
      ok: true,
      remaining: remainingFor(interpret, nextHeming, dailyLimit),
      state: nextHeming,
      usedBonus: true,
      interpret,
      heming: nextHeming,
    };
  }

  if (snapshot.totalUsed >= dailyLimit) {
    return {
      ok: false,
      remaining: 0,
      message: `今日免费次数（${dailyLimit} 次）已用完，明日 0 点（北京时间）重置`,
      interpret,
      heming,
    };
  }

  if (bucket === 'interpret') {
    const nextInterpret: QuotaState = { ...interpret, used: interpret.used + 1 };
    return {
      ok: true,
      remaining: remainingFor(nextInterpret, heming, dailyLimit),
      state: nextInterpret,
      usedBonus: false,
      interpret: nextInterpret,
      heming,
    };
  }

  const nextHeming: QuotaState = { ...heming, used: heming.used + 1 };
  return {
    ok: true,
    remaining: remainingFor(interpret, nextHeming, dailyLimit),
    state: nextHeming,
    usedBonus: false,
    interpret,
    heming: nextHeming,
  };
}

function remainingFor(interpret: QuotaState, heming: QuotaState, dailyLimit: number): number {
  const totalUsed = interpret.used + heming.used;
  const totalBonus = interpret.bonus + heming.bonus;
  return Math.max(0, dailyLimit - totalUsed) + totalBonus;
}

export function rollbackSharedQuota(
  interpret: QuotaState,
  heming: QuotaState,
  bucket: SharedQuotaBucket,
  usedBonus: boolean,
): { interpret: QuotaState; heming: QuotaState } {
  if (usedBonus) {
    if (interpret.bonus < heming.bonus || heming.bonus === 0) {
      return { interpret: { ...interpret, bonus: interpret.bonus + 1 }, heming };
    }
    return { interpret, heming: { ...heming, bonus: heming.bonus + 1 } };
  }
  if (bucket === 'interpret') {
    return { interpret: rollbackQuota(interpret, false), heming };
  }
  return { interpret, heming: rollbackQuota(heming, false) };
}

export const SHARED_QUOTA_COOKIES = {
  interpret: QUOTA_COOKIE_NAME,
  heming: HEMING_QUOTA_COOKIE_NAME,
} as const;
