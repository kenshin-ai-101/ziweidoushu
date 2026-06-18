'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formToSearchParams } from '@/lib/ziwei/share';
import type { BirthFormState } from '@/components/BirthForm';

type HistoryEntry = {
  id: string;
  label: string;
  form: BirthFormState;
  savedAt: number;
};

const STORAGE_KEY = 'ziwei_history';

function formatTime(value: number) {
  try {
    return new Date(value).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function HistoryClient() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed.filter(item => item?.form));
    } catch {
      setItems([]);
    }
  }, []);

  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setItems([]);
  };

  if (items.length === 0) {
    return (
      <section className="metis-history-empty">
        <div>暂无历史命盘</div>
        <p>完成一次起盘后，记录会自动出现在这里。</p>
        <Link href="/chart">立即起盘 →</Link>
      </section>
    );
  }

  return (
    <section className="metis-history-panel">
      <div className="metis-history-head">
        <span>{items.length} records</span>
        <button type="button" onClick={clear}>清空全部</button>
      </div>
      <div className="metis-history-list">
        {items.map(item => {
          const params = formToSearchParams(item.form).toString();
          return (
            <Link key={item.id} className="metis-history-row" href={`/chart?${params}`}>
              <span>☯</span>
              <strong>{item.label}</strong>
              <em>{formatTime(item.savedAt)}</em>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
