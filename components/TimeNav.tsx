'use client';
import { motion } from 'framer-motion';
import { BRANCHES, STEMS, SI_HUA_TABLE } from '@/lib/ziwei/constants';
import type { ZiweiChart } from '@/lib/ziwei/types';
import {
  buildTimeOverlay,
  getTimeOverlayLabel,
  getYearStemIndex,
  getDaysInSolarMonth,
  getTemporalGanzhiInfo,
  type TimeViewKey,
} from '@/lib/ziwei/sihua';

export type TimeView = TimeViewKey;

interface TimeNavProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth?: number;
  liuriDay?: number;
  liushiHour?: number;
  onViewChange: (view: TimeView) => void;
  onYearChange: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onDayChange?: (day: number) => void;
  onHourChange?: (hour: number) => void;
}

/** @deprecated use buildTimeOverlay from sihua */
export function buildSiHuaOverlay(stemIndex: number): Record<string, string> {
  const stars = SI_HUA_TABLE[stemIndex];
  if (!stars) return {};
  return {
    [stars[0]]: '禄',
    [stars[1]]: '权',
    [stars[2]]: '科',
    [stars[3]]: '忌',
  };
}

/** @deprecated use getYearStemIndex from sihua */
export function getYearStemIndexLegacy(year: number): number {
  return getYearStemIndex(year);
}

const SIHUA_COLORS: Record<string, string> = {
  '禄': '#4ade80',
  '权': '#60a5fa',
  '科': '#facc15',
  '忌': '#f87171',
};

const SHICHEN_LABELS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export default function TimeNav({
  chart,
  view,
  liunianYear,
  liuyueMonth = new Date().getMonth() + 1,
  liuriDay = new Date().getDate(),
  liushiHour = chart.birthInfo.hour,
  onViewChange,
  onYearChange,
  onMonthChange,
  onDayChange,
  onHourChange,
}: TimeNavProps) {
  const currentDx = chart.daXians[chart.currentDaXianIndex];

  const tabs: { key: TimeView; label: string }[] = [
    { key: 'mingpan', label: '本命' },
    { key: 'daxian', label: currentDx ? `大限 ${currentDx.startAge}–${currentDx.endAge}` : '大限' },
    { key: 'liunian', label: '流年' },
    { key: 'liuyue', label: '流月' },
    { key: 'liuri', label: '流日' },
    { key: 'liushi', label: '流时' },
  ];

  const overlayMap = buildTimeOverlay({
    view,
    chart,
    liunianYear,
    liuyueMonth,
    liuriDay,
    liushiHour,
  });
  const dateInfo = getTemporalGanzhiInfo(liunianYear, liuyueMonth, liuriDay, liushiHour);
  const maxDay = getDaysInSolarMonth(liunianYear, liuyueMonth);

  const changeYear = (year: number) => {
    onYearChange(year);
    if (onDayChange) onDayChange(Math.min(liuriDay, getDaysInSolarMonth(year, liuyueMonth)));
  };

  const changeMonth = (month: number) => {
    const nextMonth = Math.min(12, Math.max(1, month));
    onMonthChange?.(nextMonth);
    if (onDayChange) onDayChange(Math.min(liuriDay, getDaysInSolarMonth(liunianYear, nextMonth)));
  };

  const overlayStemName = (() => {
    if (view === 'mingpan') return '';
    if (view === 'daxian' && currentDx) {
      const dxPalace = chart.palaces.find(p => p.branch === currentDx.palaceBranch);
      return dxPalace ? STEMS[dxPalace.stem] : '';
    }
    if (view === 'liunian') return STEMS[dateInfo.yearStem];
    if (view === 'liuyue') return STEMS[dateInfo.monthStem];
    if (view === 'liuri') return STEMS[dateInfo.dayStem];
    if (view === 'liushi') return STEMS[dateInfo.hourStem];
    return '';
  })();

  const showDateControls = view === 'liunian' || view === 'liuyue' || view === 'liuri' || view === 'liushi';

  return (
    <div className="mb-3">
      <div
        className="flex items-center rounded-xl p-1 gap-0.5 flex-wrap"
        style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
      >
        {tabs.map(tab => (
          <TabButton
            key={tab.key}
            active={view === tab.key}
            onClick={() => onViewChange(tab.key)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      {showDateControls && (
        <div className="flex items-center gap-2 mt-2 px-1 flex-wrap">
          <div className="flex items-center gap-1">
            <button type="button" className="time-nav-step" onClick={() => changeYear(liunianYear - 1)}>‹</button>
            <span className="text-[10px] font-mono min-w-[36px] text-center" style={{ color: 'var(--t-gold)' }}>{liunianYear}</span>
            <button type="button" className="time-nav-step" onClick={() => changeYear(liunianYear + 1)}>›</button>
          </div>
          {(view === 'liuyue' || view === 'liuri' || view === 'liushi') && onMonthChange && (
            <div className="flex items-center gap-1">
              <span className="text-[9px]" style={{ color: 'var(--t-faint)' }}>月</span>
              <button type="button" className="time-nav-step" onClick={() => changeMonth(liuyueMonth - 1)}>‹</button>
              <span className="text-[10px] font-mono min-w-[20px] text-center" style={{ color: 'var(--t-gold)' }}>{liuyueMonth}</span>
              <button type="button" className="time-nav-step" onClick={() => changeMonth(liuyueMonth + 1)}>›</button>
            </div>
          )}
          {(view === 'liuri' || view === 'liushi') && onDayChange && (
            <div className="flex items-center gap-1">
              <span className="text-[9px]" style={{ color: 'var(--t-faint)' }}>日</span>
              <button type="button" className="time-nav-step" onClick={() => onDayChange(Math.max(1, liuriDay - 1))}>‹</button>
              <span className="text-[10px] font-mono min-w-[20px] text-center" style={{ color: 'var(--t-gold)' }}>{liuriDay}</span>
              <button type="button" className="time-nav-step" onClick={() => onDayChange(Math.min(maxDay, liuriDay + 1))}>›</button>
            </div>
          )}
          {view === 'liushi' && onHourChange && (
            <div className="flex items-center gap-1">
              <span className="text-[9px]" style={{ color: 'var(--t-faint)' }}>时</span>
              <button type="button" className="time-nav-step" onClick={() => onHourChange((liushiHour + 11) % 12)}>‹</button>
              <span className="text-[10px] font-mono min-w-[20px] text-center" style={{ color: 'var(--t-gold)' }}>{SHICHEN_LABELS[liushiHour]}</span>
              <button type="button" className="time-nav-step" onClick={() => onHourChange((liushiHour + 1) % 12)}>›</button>
            </div>
          )}
          <span className="text-[9px]" style={{ color: 'var(--t-faint)' }}>
            农历{dateInfo.isLeapMonth ? '闰' : ''}{dateInfo.lunarMonth}月{dateInfo.lunarDay}日 ·
            {STEMS[dateInfo.yearStem]}{BRANCHES[dateInfo.yearBranch]}年
            {view !== 'liunian' && ` · ${STEMS[dateInfo.monthStem]}${BRANCHES[dateInfo.monthBranch]}月`}
            {(view === 'liuri' || view === 'liushi') && ` · ${STEMS[dateInfo.dayStem]}${BRANCHES[dateInfo.dayBranch]}日`}
            {view === 'liushi' && ` · ${STEMS[dateInfo.hourStem]}${BRANCHES[dateInfo.hourBranch]}时`}
          </span>
        </div>
      )}

      {view !== 'mingpan' && overlayStemName && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 mt-1.5 px-1 flex-wrap"
        >
          <span className="text-[9px]" style={{ color: 'var(--t-faint)' }}>
            {getTimeOverlayLabel(view)}·{overlayStemName}干四化：
          </span>
          {(['禄', '权', '科', '忌'] as const).map(sh => {
            const starName = Object.keys(overlayMap).find(k => overlayMap[k] === sh);
            if (!starName) return null;
            return (
              <span key={sh} className="text-[9px] font-medium" style={{ color: SIHUA_COLORS[sh] }}>
                {starName}化{sh}
              </span>
            );
          })}
        </motion.div>
      )}

      <style jsx>{`
        .time-nav-step {
          font-size: 9px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          color: var(--t-faint);
          background: transparent;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 min-w-[44px] py-1.5 text-[10px] font-medium rounded-lg transition-all duration-200"
      style={{
        background: active ? 'rgba(212,168,67,0.12)' : 'transparent',
        color: active ? 'var(--t-gold)' : 'var(--t-faint)',
        border: active ? '1px solid rgba(212,168,67,0.25)' : '1px solid transparent',
      }}
    >
      {children}
    </button>
  );
}
