'use client';
import { motion } from 'framer-motion';
import type { Palace, Star } from '@/lib/ziwei/types';
import { palaceShortName } from '@/lib/ziwei/chart-view';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import clsx from 'clsx';

interface PalaceCellProps {
  palace: Palace;
  onClick?: () => void;
  onStarClick?: (star: Star) => void;
  isSelected?: boolean;
  isSanFang?: boolean;
  delay?: number;
  /** 叠加四化：星名 → 四化类型（'禄'/'权'/'科'/'忌'） */
  overlayStarSiHua?: Record<string, string>;
  /** 叠加标签：'年'（流年）或 '限'（大限） */
  overlayLabel?: string;
  /** 点击叠加四化 badge 回调 */
  onSiHuaClick?: (starName: string, siHua: string) => void;
  /** production 命盘页禁用入场动画，避免父级重渲染时闪烁 */
  disableEntranceAnimation?: boolean;
}

const SIHUA_CLASS: Record<string, string> = {
  '禄': 'palace-sihua-badge palace-sihua-badge--lu',
  '权': 'palace-sihua-badge palace-sihua-badge--quan',
  '科': 'palace-sihua-badge palace-sihua-badge--ke',
  '忌': 'palace-sihua-badge palace-sihua-badge--ji',
};

const starTypeClass: Record<Star['type'], string> = {
  major: 'palace-star-col--major',
  lucky: 'palace-star-col--lucky',
  sha: 'palace-star-col--sha',
  minor: 'palace-star-col--minor',
};

const STAR_TYPE_ORDER: Star['type'][] = ['major', 'lucky', 'sha', 'minor'];

/** 与生产一致：主星 → 吉星 → 煞星 → 杂耀，同类型内保留 iztro 原序 */
function sortStarsByType(stars: Star[]): Star[] {
  const buckets: Record<Star['type'], Star[]> = {
    major: [],
    lucky: [],
    sha: [],
    minor: [],
  };
  for (const star of stars) {
    buckets[star.type].push(star);
  }
  return STAR_TYPE_ORDER.flatMap(type => buckets[type]);
}

function splitChars(text: string) {
  return Array.from(text).map((ch, i) => <span key={`${ch}-${i}`}>{ch}</span>);
}

const SiHuaBadge = ({
  siHua,
  overlay,
  label,
  onClick,
}: {
  siHua: string;
  overlay?: boolean;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  return (
    <span
      className={clsx(
        SIHUA_CLASS[siHua],
        overlay && 'palace-sihua-badge--overlay',
        onClick && 'cursor-pointer hover:opacity-100',
      )}
      onClick={onClick}
    >
      {overlay && label ? `${label}${siHua}` : siHua}
    </span>
  );
};

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, delay = 0,
  overlayStarSiHua, overlayLabel, onSiHuaClick, disableEntranceAnimation = false,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;
  const ganzhi = `${STEMS[stem]}${BRANCHES[branch]}`;
  const displayName = palaceShortName(name);

  const majorStars = stars.filter(s => s.type === 'major');
  const luckyStars = stars.filter(s => s.type === 'lucky');
  const isEmptyPalace = majorStars.length === 0;
  const shownStars = sortStarsByType(stars);
  const borrowedHint = isEmptyPalace && palace.borrowedStars?.length
    ? `借${palace.borrowedFromName?.replace(/宫$/, '') ?? '对'}·${palace.borrowedStars.join('')}`
    : '';
  const emptyHint = borrowedHint
    || (luckyStars.length > 0 ? '空宫· 吉星拱照' : '空宫');

  const renderStar = (star: Star, index: number) => {
    const overlaySiHua = overlayStarSiHua?.[star.name];
    return (
      <button
        key={`${star.name}-${index}`}
        type="button"
        className={clsx('palace-star-col', starTypeClass[star.type])}
        onClick={e => { e.stopPropagation(); onStarClick?.(star); }}
      >
        <span className="palace-star-name">{splitChars(star.name)}</span>
        {star.brightnessLabel && (
          <span className="palace-star-brightness">{star.brightnessLabel}</span>
        )}
        {(star.siHua || overlaySiHua) && (
          <span className="palace-star-badges">
            {star.siHua && <SiHuaBadge siHua={star.siHua} />}
            {overlaySiHua && (
              <SiHuaBadge
                siHua={overlaySiHua}
                overlay
                label={overlayLabel}
                onClick={e => {
                  e.stopPropagation();
                  onSiHuaClick?.(star.name, overlaySiHua);
                }}
              />
            )}
          </span>
        )}
      </button>
    );
  };

  return (
    <motion.div
      initial={disableEntranceAnimation ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={disableEntranceAnimation ? { duration: 0 } : { duration: 0.35, delay, ease: 'easeOut' }}
      onClick={onClick}
      className={clsx(
        'palace-cell relative flex flex-col p-1.5 cursor-pointer transition-all duration-200 h-full',
        isEmptyPalace && 'palace-cell--empty',
      )}
      style={{
        minHeight: '90px',
        background: isCurrentDaXian
          ? 'rgba(147,51,234,0.08)'
          : isSelected
          ? 'rgba(37,99,235,0.18)'
          : isSanFang
          ? 'rgba(37,99,235,0.09)'
          : isMingGong
          ? 'rgba(212,168,67,0.04)'
          : 'var(--t-bg)',
        boxShadow: isCurrentDaXian
          ? 'none'
          : isSelected
          ? 'inset 0 0 0 1.5px rgba(37,99,235,0.7)'
          : isSanFang
          ? 'inset 0 0 0 1px rgba(37,99,235,0.4)'
          : 'none',
      }}
    >
      {/* 大限年龄 */}
      {daXianAge && (
        <div className={clsx(
          'palace-cell-daxian absolute top-1 right-1 text-[9px] font-mono tabular-nums',
          isCurrentDaXian ? 'text-purple-400' : ''
        )}
          style={!isCurrentDaXian ? { color: 'var(--t-faint)', opacity: 0.75 } : undefined}
        >
          {daXianAge[0]}–{daXianAge[1]}
        </div>
      )}

      {/* 空宫提示（独立于星曜列，避免挤压布局） */}
      {isEmptyPalace && shownStars.length === 0 && (
        <div className="palace-empty-label text-[10px] italic" style={{ color: 'var(--t-faint)', opacity: 0.6 }}>
          {emptyHint}
        </div>
      )}

      {/* 星曜列 */}
      <div className="palace-cell-stars flex flex-col gap-0.5 flex-1 min-h-0">
        <div className="palace-star-columns">
          {shownStars.map(renderStar)}
        </div>
      </div>

      {/* 宫名 + 干支（生产模式由 CSS 堆叠在右下角） */}
      <div className="palace-cell-footer">
        <div className="palace-cell-ganzhi font-mono">{ganzhi}</div>
        <div
          className={clsx(
            'palace-cell-name-row',
            isMingGong && 'palace-cell-name-row--ming',
            isShenGong && 'palace-cell-name-row--shen',
          )}
        >
          <span className="palace-cell-name-label">{displayName}</span>
          {isMingGong && <span className="palace-cell-name-mark">·命</span>}
          {isShenGong && <span className="palace-cell-name-mark">·身</span>}
        </div>
      </div>

    </motion.div>
  );
}
