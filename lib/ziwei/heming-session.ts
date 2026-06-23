import type { BirthFormState } from '@/components/BirthForm';
import type { ZiweiChart } from './types';

export const HEMING_SESSION_KEY = 'heming_session_v1';
const SESSION_TTL_MS = 6_048_000_000; // 7 days — 与生产一致

export interface HemingFollowUpEntry {
  question: string;
  answer: string;
}

export interface HemingSessionState {
  formA: BirthFormState;
  formB: BirthFormState;
  chartA?: ZiweiChart | null;
  chartB?: ZiweiChart | null;
  analysis: string;
  followUps?: HemingFollowUpEntry[];
  savedAt: number;
}

export function loadHemingSession(): HemingSessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(HEMING_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HemingSessionState;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > SESSION_TTL_MS) {
      localStorage.removeItem(HEMING_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveHemingSession(state: Omit<HemingSessionState, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: HemingSessionState = { ...state, savedAt: Date.now() };
    localStorage.setItem(HEMING_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearHemingSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HEMING_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
