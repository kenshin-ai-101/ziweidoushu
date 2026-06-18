'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { getDaysInSolarMonth } from '@/lib/ziwei/sihua';
import { DEFAULT_WENMO_CONFIG, type WenmoConfig } from '@/lib/ziwei/school-config';

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
  schoolConfig: WenmoConfig;
  onSchoolConfigChange: (config: WenmoConfig) => void;
  onSchoolConfigApply: (config: WenmoConfig) => void;
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

const messageIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 14.5a2 2 0 0 1-2 2H8l-4 3.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
  </svg>
);

const clockIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

function FeedbackModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="chart-modal-backdrop" onClick={onClose}>
      <div className="chart-feedback-modal" role="dialog" aria-modal="true" aria-labelledby="chart-feedback-title" onClick={e => e.stopPropagation()}>
        <div className="chart-feedback-head">
            <h3 id="chart-feedback-title">留言反馈</h3>
          <button type="button" aria-label="关闭" onClick={onClose}>×</button>
        </div>
        <div className="chart-feedback-tabs" aria-label="反馈类型">
          <button type="button" className="active">留言</button>
          <button type="button">我的记录</button>
        </div>
        <div className="chart-feedback-note">
          已知问题修复：AI 解读超时与额度回滚已加强。
        </div>
        <textarea maxLength={1000} rows={5} placeholder="说说你遇到的问题、想要的功能，或任何反馈…" />
        <input type="text" placeholder="联系方式（手机/邮箱/微信，选填）" />
        <div className="chart-feedback-actions">
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" onClick={onClose}>提交留言</button>
        </div>
      </div>
    </div>
  );
}

const SCHOOL_GROUPS: {
  key: keyof WenmoConfig;
  title: string;
  options: { value: string; label: string; desc?: string }[];
}[] = [
  {
    key: 'brightnessSchool',
    title: '14 主星亮度表',
    options: [
      { value: 'zhongzhou', label: '中州派' },
      { value: 'wenmo', label: '文墨天机' },
    ],
  },
  {
    key: 'gengYearSihua',
    title: '庚年四化',
    options: [
      { value: 'tiantong-ji', label: '天同化忌' },
      { value: 'tianxiang-ji', label: '天相化忌' },
    ],
  },
  {
    key: 'tianmaSchool',
    title: '安天马',
    options: [
      { value: 'default', label: '文墨默认' },
      { value: 'annual', label: '年支安天马' },
    ],
  },
  {
    key: 'tiankongSchool',
    title: '安天空',
    options: [
      { value: 'default', label: '文墨默认' },
      { value: 'none', label: '不安天空' },
    ],
  },
  {
    key: 'jiekongSchool',
    title: '安截空旬空',
    options: [
      { value: 'default', label: '文墨默认' },
      { value: 'xunkong', label: '旬空口径' },
    ],
  },
  {
    key: 'kuiyueSchool',
    title: '安魁钺',
    options: [
      { value: 'default', label: '文墨默认' },
      { value: 'birth-year', label: '按生年干' },
    ],
  },
  {
    key: 'tianshiTianshang',
    title: '安天使天伤',
    options: [
      { value: 'default', label: '文墨默认' },
      { value: 'disabled', label: '不显示' },
    ],
  },
  {
    key: 'changshengSchool',
    title: '长生十二神',
    options: [
      { value: 'default', label: '文墨默认' },
      { value: 'gender-yinyang', label: '阴阳男女顺逆' },
    ],
  },
  {
    key: 'lateZishi',
    title: '晚子时',
    options: [
      { value: 'next-day', label: '日柱次日 / 时柱当日' },
      { value: 'same-day', label: '日柱当日 / 时柱次日' },
    ],
  },
  {
    key: 'leapMonth',
    title: '闰月归属',
    options: [
      { value: 'prev-month', label: '视为本月', desc: '默认 · 对齐文墨' },
      { value: 'split', label: '视为分半', desc: '前半归上月 / 后半归下月' },
      { value: 'next-month', label: '视为下月' },
      { value: 'origin-month', label: '保持闰月' },
    ],
  },
];

function SchoolDrawer({
  config,
  onChange,
  onApply,
  onClose,
}: {
  config: WenmoConfig;
  onChange: (config: WenmoConfig) => void;
  onApply: (config: WenmoConfig) => void;
  onClose: () => void;
}) {
  const update = (key: keyof WenmoConfig, value: string) => {
    const next = { ...config, [key]: value } as WenmoConfig;
    onChange(next);
  };

  const reset = () => {
    onChange(DEFAULT_WENMO_CONFIG);
  };

  return (
    <>
      <div className="chart-modal-backdrop chart-modal-backdrop--drawer" onClick={onClose} />
      <aside className="chart-school-drawer" role="dialog" aria-modal="true" aria-labelledby="chart-school-title">
        <div className="chart-school-head">
          <div>
            <h3 id="chart-school-title">✦ 排盘流派切换</h3>
            <p>默认对齐文墨流派 · 已 20 例验证一致</p>
          </div>
          <button type="button" aria-label="关闭" onClick={onClose}>✕</button>
        </div>
        <div className="chart-school-body">
          {SCHOOL_GROUPS.map(group => (
            <fieldset key={group.key}>
              <legend>{group.title}</legend>
              {group.options.map(option => (
                <label key={option.value} className={config[group.key] === option.value ? 'active' : ''}>
                  <input
                    type="radio"
                    name={group.key}
                    checked={config[group.key] === option.value}
                    onChange={() => update(group.key, option.value)}
                  />
                  <span>
                    {option.label}
                    {option.desc && <small>{option.desc}</small>}
                  </span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="chart-school-footer">
          <button type="button" onClick={reset}>↺ 重置为默认</button>
          <button type="button" onClick={() => { onApply(config); onClose(); }}>完成</button>
        </div>
      </aside>
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
  onShare,
  schoolConfig,
  onSchoolConfigChange,
  onSchoolConfigApply,
}: ChartTopbarProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);
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
        <button type="button" className="chart-topbar-toolbtn" title="切换排盘流派" onClick={() => setSchoolOpen(true)}>
          {slidersIcon}
          流派
        </button>
        <Link href="/history" className="chart-topbar-toolbtn" title="查看我的历史记录">
          {clockIcon}
          历史
        </Link>
        <button type="button" className="chart-topbar-toolbtn" title="留言反馈" onClick={() => setFeedbackOpen(true)}>
          {messageIcon}
          反馈
        </button>
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      {schoolOpen && (
        <SchoolDrawer
          config={schoolConfig}
          onChange={onSchoolConfigChange}
          onApply={onSchoolConfigApply}
          onClose={() => setSchoolOpen(false)}
        />
      )}
    </header>
  );
}
