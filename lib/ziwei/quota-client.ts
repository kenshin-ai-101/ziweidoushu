import { getBeijingDateKey } from '@/lib/ai/quota';
import { FREE_DAILY_INTERPRET_QUOTA } from '@/lib/subscription/plans';
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

export function getClientQuotaRemaining(dailyLimit = FREE_DAILY_INTERPRET_QUOTA): number {
  return getClientSharedQuotaRemaining(dailyLimit);
}

export function syncQuotaRemaining(remaining: number): boolean {
  if (typeof window === 'undefined' || !Number.isFinite(remaining)) return false;
  const date = getBeijingDateKey();
  const nextRemaining = Math.max(0, remaining);
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (raw) {
      const prev = JSON.parse(raw) as QuotaMirror;
      if (prev.date === date && prev.remaining === nextRemaining) return false;
    }
  } catch {
    /* continue */
  }
  const payload: QuotaMirror = { date, remaining: nextRemaining };
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(QUOTA_UPDATE_EVENT, { detail: payload.remaining }));
  notifySharedQuotaStoreChange();
  return true;
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
