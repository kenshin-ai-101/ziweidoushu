import {
  getAnalysisText,
  getStarDbContent,
  TOPIC_LABEL,
  TOPIC_PALACE_NAME,
  type TopicKey,
} from './db-analysis';
import type { ZiweiChart } from './types';

export type CredibilityLevel = 'verified' | 'traditional' | 'methodology' | 'suspect';

export interface CredibilitySegments {
  dingdiao?: CredibilityLevel;
  lundian?: CredibilityLevel;
  yiju?: CredibilityLevel;
  chuchu?: CredibilityLevel;
}

export interface CredibilityRecord {
  key: string;
  level: CredibilityLevel;
  segments: CredibilitySegments;
  niSource?: string;
  classicSource?: string;
  note?: string;
}

export const CREDIBILITY_META: Record<CredibilityLevel, {
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}> = {
  verified: {
    label: '✓ 已逐条核对',
    shortLabel: '已核对',
    color: '#000000',
    description: '内容已与倪师讲座原话或古籍原文逐条核对一致，可信度最高',
  },
  traditional: {
    label: '◈ 古籍传承',
    shortLabel: '已核对',
    color: '#333333',
    description: '来自《紫微斗数全书》《骨髓赋》等明清古籍核心口诀，倪师课程亦多次援引',
  },
  methodology: {
    label: '◇ 体系推演',
    shortLabel: '体系',
    color: '#666666',
    description: '基于倪师体系方法论（命宫/三方四正/四化/星性五行）合理推演，非倪师原话',
  },
  suspect: {
    label: '⚠ 来源存疑',
    shortLabel: '存疑',
    color: '#A83228',
    description: '内容来源不确定，可能为其他流派或后人整理，建议参考但不作权威结论',
  },
};

export interface ParsedCredibilityInput {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
  hasMarkers: boolean;
}

export function getTopicPrimaryStar(chart: ZiweiChart, topic: TopicKey): string {
  const palaceName = TOPIC_PALACE_NAME[topic];
  const palace = chart.palaces.find(
    p => p.name === palaceName || (palaceName === '仆役' && p.name === '交友'),
  );
  const major = palace?.stars.find(s => s.type === 'major')?.name;
  return major ?? palace?.borrowedStars?.[0] ?? '';
}

function extractNiSource(...sources: Array<string | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    const match = source.match(/倪师[^。\n]{4,120}/);
    if (match) return match[0].trim();
    const quote = source.match(/倪师[^「]*「[^」]+」/);
    if (quote) return quote[0].trim();
  }
  return undefined;
}

function extractClassicSource(...sources: Array<string | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    const match = source.match(/《[^》]+》[^。\n]*/);
    if (match) return match[0].trim();
  }
  return undefined;
}

function segmentLevel(
  hasContent: boolean,
  dbBacked: boolean,
  classic = false,
): CredibilityLevel | undefined {
  if (!hasContent) return undefined;
  if (classic) return 'traditional';
  if (dbBacked) return 'verified';
  return 'methodology';
}

export function resolveSourceCredibility(
  starName: string,
  topic: TopicKey,
  gender: 'male' | 'female',
  parsed: ParsedCredibilityInput,
): CredibilityRecord | null {
  if (!starName) return null;

  const dbText = getAnalysisText(starName, topic, gender);
  const dbContent = getStarDbContent(starName, gender);
  const hasDb = !!dbText;
  if (!hasDb && !parsed.hasMarkers) return null;

  const level: CredibilityLevel = hasDb && parsed.hasMarkers
    ? 'verified'
    : hasDb
      ? 'verified'
      : 'methodology';

  const segments: CredibilitySegments = {
    dingdiao: segmentLevel(!!parsed.dingdiao || dbText.includes('一句话定调'), hasDb),
    lundian: segmentLevel(!!parsed.lundian || hasDb, hasDb),
    yiju: segmentLevel(!!parsed.yiju || dbText.includes('命盘依据'), hasDb),
    chuchu: segmentLevel(!!parsed.chuchu || dbText.includes('经典出处'), hasDb, true),
  };

  return {
    key: `${starName}.${topic}`,
    level,
    segments,
    niSource: extractNiSource(parsed.chuchu, parsed.lundian, parsed.yiju, dbText),
    classicSource: extractClassicSource(parsed.chuchu, dbText),
    note: !hasDb && parsed.hasMarkers ? '本地知识库兜底' : undefined,
  };
}

export function topicCredibilityLabel(topic: TopicKey): string {
  return TOPIC_LABEL[topic] ?? topic;
}
