'use client';

import { useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';

export default function PatternsChip({ chart }: { chart: ZiweiChart }) {
  const [open, setOpen] = useState(false);
  const patterns = detectPatterns(chart);
  if (patterns.length === 0) return null;

  return (
    <span className="patterns-chip">
      <button
        type="button"
        className="patterns-chip__trigger"
        onClick={() => setOpen(v => !v)}
        title={patterns.map(p => p.name).join(' / ')}
      >
        <span className="patterns-chip__mark">✦</span>
        {patterns.length} 个古书格局
        <span className={`patterns-chip__chevron${open ? ' is-open' : ''}`}>›</span>
      </button>
      {open && (
        <div className="patterns-chip__panel">
          {patterns.map((pattern, index) => (
            <div
              key={`${pattern.name}-${index}`}
              className={index < patterns.length - 1 ? 'patterns-chip__item' : 'patterns-chip__item patterns-chip__item--last'}
            >
              <div className="patterns-chip__item-head">
                <span className="patterns-chip__item-name">{pattern.name}</span>
                <span className="patterns-chip__item-tags">
                  {pattern.palaces.slice(0, 2).map(palace => (
                    <span key={palace}>{palace.replace('宫', '')}</span>
                  ))}
                </span>
              </div>
              <p>{pattern.description}</p>
              {pattern.source && <span className="patterns-chip__item-source">{pattern.source}</span>}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}
