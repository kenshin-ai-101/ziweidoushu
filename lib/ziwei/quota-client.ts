import { FREE_DAILY_QUOTA, getBeijingDateKey } from '@/lib/ai/quota';
import {
  getClientSharedQuotaRemaining,
  notifySharedQuotaStoreChange,
} from '@/lib/subscription/shared-quota-client';

const MIRROR_KEY = 'ai_quota_mirror';
export const QUOTA_UPDATE_EVENT = 'ziwei-quota-update';

interface QuotaMirror {
  date: string;
  remaining: number;
}

export function getClientQuotaRemaining(): number {
  return getClientSharedQuotaRemaining(FREE_DAILY_QUOTA);
}

export function syncQuotaRemaining(remaining: number) {
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
  window.dispatchEvent(new CustomEvent(QUOTA_UPDATE_EVENT, { detail: payload.remaining }));
  notifySharedQuotaStoreChange();
}

export function subscribeQuotaRemaining(onChange: (remaining: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<number>).detail;
    if (typeof detail === 'number') onChange(detail);
  };
  window.addEventListener(QUOTA_UPDATE_EVENT, handler);
  return () => window.removeEventListener(QUOTA_UPDATE_EVENT, handler);
}

/** For useSyncExternalStore — notify when mirror changes without passing the value. */
export function subscribeQuotaStore(onStoreChange: () => void): () => void {
  return subscribeQuotaRemaining(() => onStoreChange());
}
