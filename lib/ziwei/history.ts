import { useEffect, useState, useCallback, useRef } from 'react';
import type { BirthFormState } from '@/components/BirthForm';
import { useAuth } from '@/hooks/use-auth';

const STORAGE_KEY = 'ziwei_history';
const MAX_ENTRIES = 10;

export interface HistoryEntry {
  id: string;
  label: string;
  form: BirthFormState;
  savedAt: number;
}

function buildLabel(form: BirthFormState) {
  return [
    form.name,
    `${form.year}年${form.month}月${form.day}日`,
    form.city || form.province || '',
    form.gender === 'male' ? '男' : '女',
  ].filter(Boolean).join(' · ');
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

export function useHistory() {
  const { isLoggedIn, loading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const historyRef = useRef(history);
  const loggedInRef = useRef(isLoggedIn);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    loggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    void (async () => {
      if (!isLoggedIn) {
        if (!cancelled) setHistory([]);
        return;
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const localItems = raw ? JSON.parse(raw) as HistoryEntry[] : [];
        if (Array.isArray(localItems) && localItems.length > 0) {
          await fetch('/api/history/charts?claim=1', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ charts: localItems.map(item => ({ form: item.form })) }),
          }).catch(() => {});
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
      } catch {}

      try {
        const res = await fetch('/api/history/charts', { credentials: 'include' });
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.charts)) {
          setHistory(
            data.charts
              .filter((item: HistoryEntry) => item?.form)
              .map((item: HistoryEntry) => ({
                id: item.id,
                label: item.label || buildLabel(item.form),
                form: item.form,
                savedAt: item.savedAt,
              })),
          );
        }
      } catch {
        if (!cancelled) setHistory([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, loading]);

  const save = useCallback((form: BirthFormState) => {
    if (!loggedInRef.current) return;
    const latest = historyRef.current[0];
    if (latest && sameForm(latest.form, form)) return;

    const tempId = Date.now().toString();
    const entry: HistoryEntry = {
      id: tempId,
      label: buildLabel(form),
      form,
      savedAt: Date.now(),
    };

    setHistory(prev => [entry, ...prev.filter(item => !sameForm(item.form, form))].slice(0, MAX_ENTRIES));

    fetch('/api/history/charts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form }),
    })
      .then(res => res.json())
      .then(data => {
        if (data?.id) {
          setHistory(prev => prev.map(item => (item.id === tempId ? { ...item, id: data.id } : item)));
        }
      })
      .catch(() => {});
  }, []);

  const remove = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (loggedInRef.current) {
      fetch(`/api/history/charts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => {});
    }
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
    if (loggedInRef.current) {
      fetch('/api/history/charts', {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => {});
    }
  }, []);

  const syncCloud = save;

  const fetchCloud = useCallback(async (): Promise<HistoryEntry[]> => {
    if (!loggedInRef.current) return [];
    try {
      const res = await fetch('/api/history/charts', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      if (Array.isArray(data?.charts)) return data.charts as HistoryEntry[];
    } catch {}
    return [];
  }, []);

  return { history, save, remove, clearAll, syncCloud, fetchCloud, isLoggedIn };
}
