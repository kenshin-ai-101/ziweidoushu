'use client';

import type { BirthFormState } from '@/components/BirthForm';
import type { HistoryEntry } from '@/lib/ziwei/history';

interface ChartMyHistoryProps {
  history: HistoryEntry[];
  remove: (id: string) => void;
  clearAll: () => void;
  onOpen: (form: BirthFormState) => void;
}

export default function ChartMyHistory({ history, remove, clearAll, onOpen }: ChartMyHistoryProps) {

  const handleClearAll = () => {
    if (!history.length) return;
    if (!confirm('清空全部命盘记录？\n\n此操作不可撤销。')) return;
    clearAll();
  };

  const openChart = (item: HistoryEntry) => {
    onOpen(item.form);
  };

  return (
    <section className="chart-my-history" aria-label="我的命盘">
      <div className="chart-my-history-head">
        <span>我的命盘</span>
        <div className="chart-my-history-divider" aria-hidden />
        <button type="button" onClick={handleClearAll} disabled={history.length === 0}>
          清空全部
        </button>
      </div>

      <p className="chart-my-history-note">※ 已保存到账号，换设备登录也能看</p>

      {history.length > 0 && (
        <div className="chart-my-history-list">
          {history.map(item => (
            <div
              key={item.id}
              className="chart-my-history-row"
              role="button"
              tabIndex={0}
              aria-label="载入此历史命盘"
              onClick={() => openChart(item)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openChart(item);
                }
              }}
            >
              <span className="chart-my-history-icon" aria-hidden>☯</span>
              <span className="chart-my-history-label">{item.label}</span>
              <button
                type="button"
                className="chart-my-history-remove"
                aria-label="删除"
                onClick={event => {
                  event.stopPropagation();
                  if (confirm('确定删除这条记录吗？')) remove(item.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
