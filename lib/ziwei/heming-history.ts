import type { BirthFormState } from '@/components/BirthForm';

const STORAGE_KEY = 'heming_history_v1';
const MAX_ENTRIES = 10;

export interface HemingHistoryEntry {
  id: string;
  labelA: string;
  labelB: string;
  formA: BirthFormState;
  formB: BirthFormState;
  savedAt: number;
}

function buildLabel(form: BirthFormState) {
  return [
    form.name,
    `${form.year}-${form.month}-${form.day}`,
    form.gender === 'male' ? '男' : '女',
  ].filter(Boolean).join('·');
}

export function loadHemingHistory(): HemingHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as HemingHistoryEntry[] : [];
  } catch {
    return [];
  }
}

export function saveHemingHistory(formA: BirthFormState, formB: BirthFormState) {
  if (typeof window === 'undefined') return;
  try {
    const prev = loadHemingHistory();
    const entry: HemingHistoryEntry = {
      id: Date.now().toString(),
      labelA: buildLabel(formA),
      labelB: buildLabel(formB),
      formA,
      formB,
      savedAt: Date.now(),
    };
    const next = [
      entry,
      ...prev.filter(item =>
        !(
          item.formA.year === formA.year &&
          item.formA.month === formA.month &&
          item.formA.day === formA.day &&
          item.formA.gender === formA.gender &&
          item.formB.year === formB.year &&
          item.formB.month === formB.month &&
          item.formB.day === formB.day &&
          item.formB.gender === formB.gender
        ),
      ),
    ].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function removeHemingHistory(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const next = loadHemingHistory().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function clearHemingHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
