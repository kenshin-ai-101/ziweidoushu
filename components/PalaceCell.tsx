'use client';
import { motion } from 'framer-motion';
import type { Palace, Star } from '@/lib/ziwei/types';
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
}

const SIHUA_STYLES: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

const starTypeClass: Record<Star['type'], string> = {
  major: 'palace-star-col--major',
  lucky: 'palace-star-col--lucky',
  sha: 'palace-star-col--sha',
  minor: 'palace-star-col--minor',
};

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
        'inline-flex items-center text-[8px] px-1 rounded-full border leading-none py-px font-bold ml-1 flex-shrink-0',
        SIHUA_STYLES[siHua],
        overlay && 'border-dashed opacity-80',
        onClick && 'cursor-pointer hover:opacity-100',
      )}
      onClick={onClick}
    >
      {overlay && label && <span className="mr-px opacity-70">{label}</span>}
      {siHua}
    </span>
  );
};

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, delay = 0,
  overlayStarSiHua, overlayLabel, onSiHuaClick,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;
  const ganzhi = `${STEMS[stem]}${BRANCHES[branch]}`;

  const majorStars = stars.filter(s => s.type === 'major');
  const luckyStars = stars.filter(s => s.type === 'lucky');
  const shaStars = stars.filter(s => s.type === 'sha');
  const minorStars = stars.filter(s => s.type === 'minor');
  const isEmptyPalace = majorStars.length === 0;
  const shownStars = [...majorStars, ...luckyStars, ...shaStars, ...minorStars];
  const borrowedHint = isEmptyPalace && palace.borrowedStars?.length
    ? `借${palace.borrowedFromName?.replace(/宫$/, '') ?? '对'}·${palace.borrowedStars.join('')}`
    : '';
  const emptyHint = borrowedHint
    || (luckyStars.length > 0 ? '空宫· 吉星拱照' : '空宫');

  const renderStar = (star: Star) => {
    const overlaySiHua = overlayStarSiHua?.[star.name];
    return (
      <button
        key={`${star.name}-${star.type}`}
        type="button"
        className={clsx('palace-star-col', starTypeClass[star.type])}
        onClick={e => { e.stopPropagation(); onStarClick?.(star); }}
      >
        <span className="palace-star-name">{splitChars(star.name)}</span>
        {star.type === 'major' && star.brightnessLabel && (
          <span className="palace-star-brightness">{star.brightnessLabel}</span>
        )}
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
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
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
      {isEmptyPalace && (
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
        <div className="palace-cell-name flex items-center gap-1 mb-0.5 pr-8">
          <span className={clsx('text-[10px] font-medium tracking-wide',
            isMingGong ? 'text-amber-500' : isShenGong ? 'text-sky-500' : ''
          )}
            style={!isMingGong && !isShenGong ? { color: 'var(--t-faint)' } : undefined}
          >
            {name}
          </span>
          {isMingGong && (
            <span className="text-[7px] text-amber-500/80 border border-amber-500/30 px-0.5 rounded leading-tight">命</span>
          )}
          {isShenGong && (
            <span className="text-[7px] text-sky-500/80 border border-sky-500/30 px-0.5 rounded leading-tight">身</span>
          )}
        </div>
      </div>

    </motion.div>
  );
}
