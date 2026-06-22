'use client';

import type { BirthPillars } from '@/lib/ziwei/chart-view';
import { wuxingColorForChar } from '@/lib/ziwei/chart-view';

interface PillarRowProps {
  pillars: BirthPillars;
  /** 非节气区：统一灰色，不做五行着色 */
  muted?: boolean;
}

export default function PillarRow({ pillars, muted = false }: PillarRowProps) {
  return (
    <>
      {pillars.map(pillar => (
        <span key={pillar} className="palace-center-pillar">
          {Array.from(pillar).map((ch, i) => (
            <span key={`${pillar}-${i}`} style={{ color: wuxingColorForChar(ch, muted) }}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}
