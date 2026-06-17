import { useEffect, useState, useCallback } from 'react';
import type { BirthFormState } from '@/components/BirthForm';

const STORAGE_KEY = 'ziwei_history';
const MAX_ENTRIES = 10;

export interface HistoryEntry {
  id: string;
  label: string;
  form: BirthFormState;
  savedAt: number;
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* localStorage 不可用时静默失败 */ }
  }, []);

  const save = useCallback((form: BirthFormState) => {
    const label = [
      form.name,
      `${form.year}年${form.month}月${form.day}日`,
      form.city || form.province || '',
      form.gender === 'male' ? '男' : '女',
    ].filter(Boolean).join(' · ');

    const entry: HistoryEntry = {
      id: Date.now().toString(),
      label,
      form,
      savedAt: Date.now(),
    };

    setHistory(prev => {
      // 去重：相同出生年月日+性别+时辰视为同一条记录
      const deduped = prev.filter(e =>
        !(e.form.year === form.year &&
          e.form.month === form.month &&
          e.form.day === form.day &&
          e.form.gender === form.gender &&
          e.form.clockHour === form.clockHour &&
          e.form.clockMinute === form.clockMinute)
      );
      const updated = [entry, ...deduped].slice(0, MAX_ENTRIES);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  /** 尝试同步云端（生产 /api/history/charts）；失败则仅本地 */
  const syncCloud = useCallback(async (form: BirthFormState) => {
    try {
      await fetch('/api/history/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, savedAt: Date.now() }),
      });
    } catch { /* 离线或未登录 */ }
  }, []);

  const fetchCloud = useCallback(async (): Promise<HistoryEntry[]> => {
    try {
      const res = await fetch('/api/history/charts');
      if (!res.ok) return [];
      const data = await res.json();
      if (data.loggedIn && Array.isArray(data.charts)) {
        return data.charts as HistoryEntry[];
      }
    } catch { /* ignore */ }
    return [];
  }, []);

  return { history, save, remove, syncCloud, fetchCloud };
}
