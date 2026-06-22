import type { ZiweiChart } from './types';

/** FNV-1a 32-bit — 与生产 chart page bundle 中 tz() 一致 */
export function hashString(input: string): string {
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
  return hashString(raw);
}

/** 对话缓存 key — 生产 `${chartToken}_chatv2_${hash(JSON.stringify(messages))}` */
export function buildChatCacheKey(
  chartToken: string,
  messages: Array<{ role: string; content: string }>,
): string {
  return `${chartToken}_chatv2_${hashString(JSON.stringify(messages))}`;
}

export function getChartToken(chart: ZiweiChart): string {
  return chart._chartToken ?? computeChartToken(chart);
}
