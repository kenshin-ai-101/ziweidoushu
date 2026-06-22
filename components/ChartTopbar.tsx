'use client';

import type { CSSProperties } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { getDaysInSolarMonth } from '@/lib/ziwei/sihua';
import RightDrawer from '@/components/RightDrawer';
import HistoryPanel from '@/components/HistoryPanel';
import { ChartFeedbackButton } from '@/components/ChartFeedbackModal';
import { useState } from 'react';

const SHICHEN_LABELS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

interface ChartTopbarProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth: number;
  liuriDay: number;
  liushiHour: number;
  onViewChange: (view: TimeView) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onDayChange: (day: number) => void;
  onHourChange: (hour: number) => void;
  onBack: () => void;
  onShare?: () => void;
  onOpenSchool?: () => void;
}

const pillWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  background: 'var(--bg-card)',
  border: '1px solid var(--bdr-med)',
  borderRadius: 'var(--r-pill)',
  padding: '3px 8px',
  boxShadow: 'var(--sh-xs)',
};

const stepBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--tx-3)',
  fontSize: '14px',
  padding: '0 4px',
  lineHeight: 1,
};

const slidersIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="8" x2="21" y2="8" />
    <line x1="3" y1="16" x2="21" y2="16" />
    <circle cx="9" cy="8" r="2.2" fill="var(--bg-card)" />
    <circle cx="15" cy="16" r="2.2" fill="var(--bg-card)" />
  </svg>
);

const clockIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

function HistoryDrawerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="chart-topbar-toolbtn"
        title="查看我的历史记录(命盘 / 合盘 / AI 对话)"
        onClick={event => {
          setOpen(true);
          event.currentTarget.blur();
        }}
      >
        {clockIcon}
        历史
      </button>
      <RightDrawer open={open} onClose={() => setOpen(false)} title="历史记录" width={520}>
        <HistoryPanel embedded />
      </RightDrawer>
    </>
  );
}

export default function ChartTopbar({
  chart,
  view,
  liunianYear,
  liuyueMonth,
  liuriDay,
  liushiHour,
  onViewChange,
  onYearChange,
  onMonthChange,
  onDayChange,
  onHourChange,
  onBack,
  onOpenSchool,
}: ChartTopbarProps) {
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const maxDay = getDaysInSolarMonth(liunianYear, liuyueMonth);

  const tabs: { key: TimeView; label: string }[] = [
    { key: 'mingpan', label: '本命' },
    { key: 'daxian', label: currentDx ? `大限 ${currentDx.startAge}–${currentDx.endAge}` : '大限' },
    { key: 'liunian', label: '流年' },
    { key: 'liuyue', label: '流月' },
    { key: 'liuri', label: '流日' },
    { key: 'liushi', label: '流时' },
  ];

  const changeYear = (year: number) => {
    onYearChange(year);
    onDayChange(Math.min(liuriDay, getDaysInSolarMonth(year, liuyueMonth)));
  };

  const changeMonth = (month: number) => {
    const next = month <= 0 ? 12 : month > 12 ? 1 : month;
    onMonthChange(next);
    onDayChange(Math.min(liuriDay, getDaysInSolarMonth(liunianYear, next)));
  };

  const showDate = view === 'liunian' || view === 'liuyue' || view === 'liuri' || view === 'liushi';

  return (
    <header className="chart-topbar">
      <button type="button" className="chart-topbar-back" onClick={onBack}>
        <span style={{ fontSize: '16px' }}>‹</span>
        <span>返回</span>
      </button>
      <div className="chart-topbar-back-sep" aria-hidden />

      <div className="chart-topbar-tabs">
        <div className="chart-topbar-seg" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={view === tab.key}
              className={view === tab.key ? 'is-active' : ''}
              onClick={() => onViewChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showDate && (
          <div style={{ ...pillWrap, marginLeft: '4px' }}>
            <button type="button" style={stepBtn} onClick={() => changeYear(liunianYear - 1)}>‹</button>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--tx-0)', minWidth: '36px', textAlign: 'center', fontWeight: 500 }}>
              {liunianYear}
            </span>
            <button type="button" style={stepBtn} onClick={() => changeYear(liunianYear + 1)}>›</button>
          </div>
        )}

        {(view === 'liuyue' || view === 'liuri' || view === 'liushi') && (
          <div style={pillWrap}>
            <button type="button" style={stepBtn} onClick={() => changeMonth(liuyueMonth - 1)}>‹</button>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--tx-0)', minWidth: '28px', textAlign: 'center', fontWeight: 500 }}>
              {liuyueMonth}月
            </span>
            <button type="button" style={stepBtn} onClick={() => changeMonth(liuyueMonth + 1)}>›</button>
          </div>
        )}

        {(view === 'liuri' || view === 'liushi') && (
          <div style={pillWrap}>
            <button type="button" style={stepBtn} onClick={() => onDayChange(Math.max(1, liuriDay - 1))}>‹</button>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--tx-0)', minWidth: '28px', textAlign: 'center', fontWeight: 500 }}>
              {liuriDay}日
            </span>
            <button type="button" style={stepBtn} onClick={() => onDayChange(Math.min(maxDay, liuriDay + 1))}>›</button>
          </div>
        )}

        {view === 'liushi' && (
          <div style={pillWrap}>
            <button type="button" style={stepBtn} onClick={() => onHourChange((liushiHour + 11) % 12)}>‹</button>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--tx-0)', minWidth: '28px', textAlign: 'center', fontWeight: 500 }}>
              {SHICHEN_LABELS[liushiHour]}时
            </span>
            <button type="button" style={stepBtn} onClick={() => onHourChange((liushiHour + 1) % 12)}>›</button>
          </div>
        )}
      </div>

      <div className="chart-topbar-tools">
        {onOpenSchool && (
          <button
            type="button"
            className="chart-topbar-toolbtn"
            title="切换排盘流派（文墨同款 9 类开关）"
            onClick={event => {
              onOpenSchool();
              event.currentTarget.blur();
            }}
          >
            {slidersIcon}
            流派
          </button>
        )}
        <HistoryDrawerButton />
        <ChartFeedbackButton />
      </div>
    </header>
  );
}
