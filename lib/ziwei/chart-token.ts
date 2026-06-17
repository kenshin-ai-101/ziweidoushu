import type { ZiweiChart } from './types';

/** FNV-1a 32-bit — 与生产 chart page bundle 中 ti() 一致 */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x1000193) >>> 0;
  }
  return hash.toString(36);
}

export function computeChartToken(
  chart: Pick<ZiweiChart, 'birthInfo' | 'mingGongBranch' | 'shenGongBranch' | 'wuxingJuName'>,
): string {
  const b = chart.birthInfo;
  const raw = `${b.year}-${b.month}-${b.day}-${b.hour}-${b.gender}-${chart.mingGongBranch}-${chart.shenGongBranch}-${chart.wuxingJuName}`;
  return fnv1a(raw);
}

export function getChartToken(chart: ZiweiChart): string {
  return chart._chartToken ?? computeChartToken(chart);
}
