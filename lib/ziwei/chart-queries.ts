import type { Palace, ZiweiChart } from './types';
import { TOPIC_PALACE_NAME, type TopicKey } from './db-analysis';

/** 地支 → 宫位（ChartBoard / 分析层共用） */
export function palaceMapFromChart(chart: ZiweiChart): Record<number, Palace> {
  const map: Record<number, Palace> = {};
  for (const p of chart.palaces) map[p.branch] = p;
  return map;
}

export function findPalaceByBranch(chart: ZiweiChart, branch: number): Palace | undefined {
  return chart.palaces.find(p => p.branch === branch);
}

export function findPalaceByName(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces.find(p =>
    p.name === name ||
    (name === '命宫' && (p.isMingGong || p.branch === chart.mingGongBranch)) ||
    (name === '仆役' && p.name === '交友'),
  );
}

export function palaceByTopic(chart: ZiweiChart, topic: TopicKey): Palace | undefined {
  return findPalaceByName(chart, TOPIC_PALACE_NAME[topic]);
}

/** 本宫主星；空宫则取借对宫主星（与 chart-analysis 一致） */
export function palaceMainStars(palace: Palace | undefined): string[] {
  if (!palace) return [];
  const majors = palace.stars.filter(s => s.type === 'major').map(s => s.name);
  if (majors.length > 0) return majors;
  return palace.borrowedStars ?? [];
}

export function getMingGongPalace(chart: ZiweiChart): Palace | undefined {
  return findPalaceByName(chart, '命宫');
}

export function getMingGongMainStars(chart: ZiweiChart): string[] {
  return palaceMainStars(getMingGongPalace(chart));
}

export function getTopicMainStars(chart: ZiweiChart, topic: TopicKey): string[] {
  return palaceMainStars(palaceByTopic(chart, topic));
}
