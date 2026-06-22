import {
  HEMING_FREE_DAILY_QUOTA,
  HEMING_QUOTA_COOKIE_NAME,
  getHemingQuotaRemaining,
} from '@/lib/ai/heming-quota';
import { getBeijingDateKey, parseQuotaState, readBrowserCookie } from '@/lib/ai/quota';

const MIRROR_KEY = 'heming_quota_mirror';
export const HEMING_QUOTA_UPDATE_EVENT = 'ziwei-heming-quota-update';

interface QuotaMirror {
  date: string;
  remaining: number;
}

/** Resolve remaining from encoded cookie value (or fresh quota when absent). */
export function resolveHemingQuotaRemaining(cookieRaw?: string): number {
  return getHemingQuotaRemaining(parseQuotaState(cookieRaw));
}

/** Client quota: cookie is source of truth; localStorage mirror is display cache only. */
export function getClientHemingQuotaRemaining(): number {
  if (typeof window === 'undefined') return HEMING_FREE_DAILY_QUOTA;
  return resolveHemingQuotaRemaining(readBrowserCookie(HEMING_QUOTA_COOKIE_NAME));
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
