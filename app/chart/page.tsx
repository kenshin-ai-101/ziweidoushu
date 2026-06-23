import { Suspense } from 'react';
import { ChartOraclePage } from '@/components/ChartOraclePage';

export const metadata = {
  title: '紫微命盘在线排盘 · Metis',
  description: '输入公历生辰，AI 即时排出紫微斗数命盘并深度解读命格',
};

function ChartPageFallback() {
  return (
    <div className="chart-generating-screen">
      <div className="chart-generating-spinner" aria-hidden />
      <div>正在加载…</div>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={<ChartPageFallback />}>
      <ChartOraclePage />
    </Suspense>
  );
}
