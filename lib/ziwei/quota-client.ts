import {
  FREE_DAILY_QUOTA,
  QUOTA_COOKIE_NAME,
  getBeijingDateKey,
  getQuotaRemaining,
  parseQuotaState,
  readBrowserCookie,
} from '@/lib/ai/quota';

const MIRROR_KEY = 'ai_quota_mirror';
export const QUOTA_UPDATE_EVENT = 'ziwei-quota-update';

interface QuotaMirror {
  date: string;
  remaining: number;
}

export function resolveQuotaRemaining(cookieRaw?: string): number {
  return getQuotaRemaining(parseQuotaState(cookieRaw));
}

export function getClientQuotaRemaining(): number {
  if (typeof window === 'undefined') return FREE_DAILY_QUOTA;
  return resolveQuotaRemaining(readBrowserCookie(QUOTA_COOKIE_NAME));
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
