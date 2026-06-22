import { FREE_DAILY_QUOTA, getBeijingDateKey } from '@/lib/ai/quota';

const MIRROR_KEY = 'ai_quota_mirror';
export const QUOTA_UPDATE_EVENT = 'ziwei-quota-update';

interface QuotaMirror {
  date: string;
  remaining: number;
}

function readMirror(): QuotaMirror | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuotaMirror;
    if (typeof parsed.remaining !== 'number' || typeof parsed.date !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getClientQuotaRemaining(): number {
  const mirror = readMirror();
  const today = getBeijingDateKey();
  if (mirror?.date === today) return Math.max(0, mirror.remaining);
  return FREE_DAILY_QUOTA;
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
