import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BirthFormState } from '@/components/BirthForm';

export interface StoredChartEntry {
  id: string;
  form: BirthFormState;
  savedAt: number;
}

interface ChartHistoryStore {
  users: Record<string, StoredChartEntry[]>;
}

const STORE_PATH = path.join(process.cwd(), '.data', 'chart-history.json');
const MAX_ENTRIES = 50;

let cache: ChartHistoryStore | null = null;

function emptyStore(): ChartHistoryStore {
  return { users: {} };
}

async function loadStore(): Promise<ChartHistoryStore> {
  if (cache) return cache;
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(raw) as ChartHistoryStore;
    return cache;
  } catch {
    cache = emptyStore();
    return cache;
  }
}

async function persistStore(data: ChartHistoryStore): Promise<void> {
  cache = data;
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function sameForm(a: BirthFormState, b: BirthFormState) {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.gender === b.gender &&
    a.clockHour === b.clockHour &&
    a.clockMinute === b.clockMinute
  );
}

function buildLabel(form: BirthFormState) {
  return [
    form.name,
    `${form.year}年${form.month}月${form.day}日`,
    form.city || form.province || '',
    form.gender === 'male' ? '男' : '女',
  ].filter(Boolean).join(' · ');
}

export async function listCharts(userId: string): Promise<StoredChartEntry[]> {
  const store = await loadStore();
  return [...(store.users[userId] ?? [])].sort((a, b) => b.savedAt - a.savedAt);
}

export async function addChart(userId: string, form: BirthFormState): Promise<StoredChartEntry> {
  const store = await loadStore();
  const prev = store.users[userId] ?? [];
  const entry: StoredChartEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    form,
    savedAt: Date.now(),
  };
  const next = [entry, ...prev.filter(item => !sameForm(item.form, form))].slice(0, MAX_ENTRIES);
  store.users[userId] = next;
  await persistStore(store);
  return entry;
}

export async function claimCharts(userId: string, forms: BirthFormState[]): Promise<void> {
  if (!forms.length) return;
  const store = await loadStore();
  const prev = store.users[userId] ?? [];
  const claimed = forms.map(form => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    form,
    savedAt: Date.now(),
  }));
  const merged = [...claimed, ...prev].filter((item, index, arr) =>
    arr.findIndex(other => sameForm(other.form, item.form)) === index,
  ).slice(0, MAX_ENTRIES);
  store.users[userId] = merged;
  await persistStore(store);
}

export async function removeChart(userId: string, id: string): Promise<boolean> {
  const store = await loadStore();
  const prev = store.users[userId] ?? [];
  const next = prev.filter(item => item.id !== id);
  if (next.length === prev.length) return false;
  store.users[userId] = next;
  await persistStore(store);
  return true;
}

export async function clearCharts(userId: string): Promise<void> {
  const store = await loadStore();
  store.users[userId] = [];
  await persistStore(store);
}

export function toHistoryEntry(entry: StoredChartEntry) {
  return {
    id: entry.id,
    label: buildLabel(entry.form),
    form: entry.form,
    savedAt: entry.savedAt,
  };
}
