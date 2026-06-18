'use client';

import type { ZiweiChart } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { getTemporalGanzhiInfo } from '@/lib/ziwei/sihua';

const LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];
const SHICHEN = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'];

interface ChartTimeDrillProps {
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
}

function virtualAge(birthYear: number, year: number) {
  return year - birthYear + 1;
}

function daxianGanzhi(chart: ZiweiChart, dx: ZiweiChart['daXians'][number]) {
  const palace = chart.palaces.find(p => p.branch === dx.palaceBranch);
  const stem = dx.stemName
    ?? (dx.stemIndex != null ? STEMS[dx.stemIndex] : undefined)
    ?? (palace ? STEMS[palace.stem] : '');
  return `${stem}${BRANCHES[dx.palaceBranch]}`;
}

function liunianYearsForDaxian(chart: ZiweiChart) {
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (!dx) return [];
  const years: number[] = [];
  for (let age = dx.startAge; age <= dx.endAge; age++) {
    years.push(chart.birthInfo.year + age - 1);
  }
  return years;
}

function DrillSection({
  title,
  hint,
  tone = 'default',
  first = false,
  children,
}: {
  title: string;
  hint: string;
  tone?: 'default' | 'purple';
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`chart-time-section${first ? '' : ' chart-time-section--spaced'}`}>
      <div className="chart-time-section-head">
        <span className={`chart-time-section-title chart-time-section-title--${tone}`}>{title}</span>
        <span className="chart-time-section-hint">{hint}</span>
      </div>
      <div className="chart-time-scroll">
        <div className="chart-time-row-inner">{children}</div>
      </div>
    </div>
  );
}

function DrillCard({
  active,
  tone = 'default',
  minWidth = 70,
  ariaLabel,
  onClick,
  children,
}: {
  active: boolean;
  tone?: 'default' | 'purple';
  minWidth?: number;
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={`chart-time-card${active ? ` chart-time-card--active chart-time-card--active-${tone}` : ''}`}
      style={{ flex: `1 0 ${minWidth}px` }}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

export default function ChartTimeDrill({
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
}: ChartTimeDrillProps) {
  const yearOptions = liunianYearsForDaxian(chart);
  const currentYear = new Date().getFullYear();

  return (
    <div className="chart-time-drill">
      <DrillSection title="大限" hint="金色为当前大限 · 点击切换" first>
        {chart.daXians.map((dx, i) => (
          <DrillCard
            key={`${dx.startAge}-${dx.palaceBranch}`}
            active={view === 'daxian' && i === chart.currentDaXianIndex}
            ariaLabel={`大限 ${dx.startAge}~${dx.endAge}岁 ${daxianGanzhi(chart, dx)} ${dx.palaceName}`}
            onClick={() => onViewChange('daxian')}
          >
            <div className="chart-time-card-age">{dx.startAge}~{dx.endAge}岁</div>
            <div className="chart-time-card-ganzhi">{daxianGanzhi(chart, dx)}</div>
            <div className="chart-time-card-palace">{dx.palaceName}</div>
          </DrillCard>
        ))}
      </DrillSection>

      <DrillSection title="流年" hint="紫色为当前流年 · 点击任一年切换" tone="purple">
        {(yearOptions.length > 0 ? yearOptions : Array.from({ length: 10 }, (_, i) => currentYear - 4 + i)).map(y => {
          const ganzhi = getTemporalGanzhiInfo(y, 6, 1);
          const age = virtualAge(chart.birthInfo.year, y);
          return (
            <DrillCard
              key={y}
              active={view === 'liunian' && liunianYear === y}
              tone="purple"
              minWidth={58}
              ariaLabel={`切换到 ${y} 年流年`}
              onClick={() => {
                onViewChange('liunian');
                onYearChange(y);
              }}
            >
              <div className="chart-time-card-year">{y}</div>
              <div className="chart-time-card-age">{age}岁</div>
              <div className="chart-time-card-ganzhi chart-time-card-ganzhi--bold">
                {STEMS[ganzhi.yearStem]}{BRANCHES[ganzhi.yearBranch]}
              </div>
            </DrillCard>
          );
        })}
      </DrillSection>

      <DrillSection title="流月" hint="精细到每月运势 · 点击切换">
        {LUNAR_MONTHS.map((label, i) => (
          <DrillCard
            key={label}
            active={view === 'liuyue' && liuyueMonth === i + 1}
            minWidth={50}
            ariaLabel={`流月 ${label}`}
            onClick={() => {
              onViewChange('liuyue');
              onMonthChange(i + 1);
            }}
          >
            <div className="chart-time-card-month">{label}</div>
          </DrillCard>
        ))}
      </DrillSection>

      <DrillSection title="流日" hint="精细到每日运势 · 点击切换">
        {LUNAR_DAYS.map((label, i) => (
          <DrillCard
            key={label}
            active={view === 'liuri' && liuriDay === i + 1}
            minWidth={44}
            ariaLabel={`流日 ${label}`}
            onClick={() => {
              onViewChange('liuri');
              onDayChange(i + 1);
            }}
          >
            <div className="chart-time-card-month">{label}</div>
          </DrillCard>
        ))}
      </DrillSection>

      <DrillSection title="流时" hint="精细到每个时辰 · 点击切换">
        {SHICHEN.map((label, i) => (
          <DrillCard
            key={label}
            active={view === 'liushi' && liushiHour === i}
            minWidth={44}
            ariaLabel={`流时 ${label}`}
            onClick={() => {
              onViewChange('liushi');
              onHourChange(i);
            }}
          >
            <div className="chart-time-card-month">{label}</div>
          </DrillCard>
        ))}
      </DrillSection>
    </div>
  );
}
