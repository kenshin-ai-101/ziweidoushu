'use client';

import { useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import PatternsCard from './PatternsCard';

export default function PatternsLink({ chart }: { chart: ZiweiChart }) {
  const [open, setOpen] = useState(false);
  const patterns = detectPatterns(chart);
  if (patterns.length === 0) return null;

  return (
    <div className="chart-pattern-block">
      <button
        type="button"
        className="chart-pattern-link"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span>✦</span>
        <span>{patterns.length} 个古书格局</span>
        <span className="chart-pattern-link-chevron">{open ? '⌃' : '›'}</span>
      </button>
      {open && <PatternsCard chart={chart} embedded />}
    </div>
  );
}
