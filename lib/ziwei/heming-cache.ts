import type { BirthFormState } from '@/components/BirthForm';
import { hashString } from './chart-token';

const CACHE_TTL_MS = 2_592_000_000; // 30 days — 与生产一致

function birthKey(form: BirthFormState): string {
  return [
    form.year,
    form.month,
    form.day,
    form.clockHour,
    form.clockMinute,
    form.unknownTime ? 'u' : '',
    form.gender,
    form.province,
    form.city,
    form.longitude,
  ].join('|');
}

export function buildHemingCacheKey(
  formA: BirthFormState,
  formB: BirthFormState,
  question?: string,
): string {
  const payload = JSON.stringify({
    a: birthKey(formA),
    b: birthKey(formB),
    q: question?.trim() || '',
  });
  return `heming_${hashString(payload)}`;
}

export function readHemingCache(key: string): string | null {
  if (typeof window === 'undefined' || !key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { text?: string; savedAt?: number };
    if (!parsed.text || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt >= CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.text;
  } catch {
    return null;
  }
}

export function writeHemingCache(key: string, text: string) {
  if (typeof window === 'undefined' || !key || !text) return;
  try {
    localStorage.setItem(key, JSON.stringify({ text, savedAt: Date.now() }));
  } catch {
    /* ignore quota errors */
  }
}

export function clearHemingAnalysisCaches() {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('heming_') && key !== 'heming_history_v1') keys.push(key);
    }
    keys.forEach(key => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
