import { HEMING_QUOTA_COOKIE_NAME } from '@/lib/ai/heming-quota';
import { QUOTA_COOKIE_NAME, readBrowserCookie } from '@/lib/ai/quota';
import type { AccountQuotaResponse } from '@/lib/auth/account-quota';
import { FREE_DAILY_INTERPRET_QUOTA } from '@/lib/subscription/plans';
import { snapshotSharedQuota, type SharedQuotaSnapshot } from '@/lib/subscription/shared-quota';

export const SHARED_QUOTA_UPDATE_EVENT = 'ziwei-shared-quota-update';

export function resolveSharedQuotaSnapshot(
  interpretRaw: string | undefined,
  hemingRaw: string | undefined,
  dailyLimit = FREE_DAILY_INTERPRET_QUOTA,
): SharedQuotaSnapshot {
  return snapshotSharedQuota(interpretRaw, hemingRaw, dailyLimit);
}

export function getClientSharedQuotaSnapshot(
  dailyLimit = FREE_DAILY_INTERPRET_QUOTA,
): SharedQuotaSnapshot {
  if (typeof window === 'undefined') {
    return resolveSharedQuotaSnapshot(undefined, undefined, dailyLimit);
  }
  return resolveSharedQuotaSnapshot(
    readBrowserCookie(QUOTA_COOKIE_NAME),
    readBrowserCookie(HEMING_QUOTA_COOKIE_NAME),
    dailyLimit,
  );
}

export function getClientSharedQuotaRemaining(dailyLimit = FREE_DAILY_INTERPRET_QUOTA): number {
  return getClientSharedQuotaSnapshot(dailyLimit).remaining;
}

export function toAccountQuotaResponse(
  snapshot: SharedQuotaSnapshot,
  max: number,
  unlimited = false,
): AccountQuotaResponse {
  return {
    remaining: snapshot.remaining,
    dailyRemaining: snapshot.dailyRemaining,
    max,
    bonusCredits: snapshot.totalBonus,
    unlimited,
  };
}

export function notifySharedQuotaStoreChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SHARED_QUOTA_UPDATE_EVENT));
}

export function subscribeSharedQuotaStore(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(SHARED_QUOTA_UPDATE_EVENT, handler);
  window.addEventListener('ziwei-quota-update', handler);
  window.addEventListener('ziwei-heming-quota-update', handler);
  return () => {
    window.removeEventListener(SHARED_QUOTA_UPDATE_EVENT, handler);
    window.removeEventListener('ziwei-quota-update', handler);
    window.removeEventListener('ziwei-heming-quota-update', handler);
  };
}
