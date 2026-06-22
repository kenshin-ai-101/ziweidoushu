import { HEMING_FREE_DAILY_QUOTA } from '@/lib/ai/heming-quota';
import { getBeijingDateKey } from '@/lib/ai/quota';
import {
  getClientSharedQuotaRemaining,
  notifySharedQuotaStoreChange,
  resolveSharedQuotaSnapshot,
} from '@/lib/subscription/shared-quota-client';

const MIRROR_KEY = 'heming_quota_mirror';
export const HEMING_QUOTA_UPDATE_EVENT = 'ziwei-heming-quota-update';

interface QuotaMirror {
  date: string;
  remaining: number;
}

/** Resolve shared-pool remaining from both quota cookies (server / SSR). */
export function resolveHemingQuotaRemaining(
  interpretRaw?: string,
  hemingRaw?: string,
  dailyLimit = HEMING_FREE_DAILY_QUOTA,
): number {
  return resolveSharedQuotaSnapshot(interpretRaw, hemingRaw, dailyLimit).remaining;
}

/** Client quota: shared pool across interpret + heming cookies. */
export function getClientHemingQuotaRemaining(): number {
  return getClientSharedQuotaRemaining(HEMING_FREE_DAILY_QUOTA);
}

export function syncHemingQuotaRemaining(remaining: number) {
  if (typeof window === 'undefined' || !Number.isFinite(remaining)) return;
  const payload: QuotaMirror = {
    date: getBeijingDateKey(),
    remaining: Math.max(0, remaining),
  };
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(HEMING_QUOTA_UPDATE_EVENT, { detail: payload.remaining }));
  notifySharedQuotaStoreChange();
}

export function subscribeHemingQuotaRemaining(onChange: (remaining: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<number>).detail;
    if (typeof detail === 'number') onChange(detail);
  };
  window.addEventListener(HEMING_QUOTA_UPDATE_EVENT, handler);
  return () => window.removeEventListener(HEMING_QUOTA_UPDATE_EVENT, handler);
}

/** For useSyncExternalStore — notify when mirror changes without passing the value. */
export function subscribeHemingQuotaStore(onStoreChange: () => void): () => void {
  return subscribeHemingQuotaRemaining(() => onStoreChange());
}
