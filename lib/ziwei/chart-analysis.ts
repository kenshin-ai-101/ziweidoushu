import type { ZiweiChart } from './types';
import {
  getAnalysisText,
  type TopicKey,
} from './db-analysis';

/** 命宫主星（空宫则取借星） */
export function getMingGongMainStars(chart: ZiweiChart): string[] {
  const ming = chart.palaces.find(p => p.isMingGong || p.branch === chart.mingGongBranch);
  if (!ming) return [];
  const majors = ming.stars.filter(s => s.type === 'major').map(s => s.name);
  if (majors.length > 0) return majors;
  return ming.borrowedStars ?? [];
}

export function getMingGongMainStar(chart: ZiweiChart): string | null {
  return getMingGongMainStars(chart)[0] ?? null;
}

/** 按命宫主星 + topic 取 STAR_DB 论断（与生产 /api/analysis db 路径一致） */
export function buildChartAnalysisText(
  chart: ZiweiChart,
  topic: TopicKey,
): string {
  const star = getMingGongMainStar(chart);
  if (!star) {
    return '未能识别命宫主星，请重新起盘后再试。';
  }
  const gender = chart.birthInfo.gender;
  const text = getAnalysisText(star, topic, gender);
  if (text.trim()) return text;
  return `暂无【${star}】在「${topic}」维度的库内论断，请稍后重试或换一话题。`;
}

export function buildAllTopicAnalysisTabs(
  chart: ZiweiChart,
  topics: TopicKey[],
): Record<string, string> {
  const tabs: Record<string, string> = {};
  for (const topic of topics) {
    tabs[topic] = buildChartAnalysisText(chart, topic);
  }
  return tabs;
}
