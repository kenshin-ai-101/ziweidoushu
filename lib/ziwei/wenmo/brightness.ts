import type { WenmoConfig } from '@/lib/ziwei/school-config';

type BrightnessKey = 'miao' | 'wang' | 'de' | 'li' | 'ping' | 'xian' | 'bu';

const LABELS: Record<BrightnessKey, string> = {
  miao: '庙',
  wang: '旺',
  de: '得',
  li: '利',
  ping: '平',
  xian: '陷',
  bu: '不',
};

/** 寅起十二宫，与 iztro STARS_INFO 一致（default / 混合亮度表） */
const IZTRO_DEFAULT: Record<string, BrightnessKey[]> = {
  紫微: ['wang', 'wang', 'de', 'wang', 'miao', 'miao', 'wang', 'wang', 'de', 'wang', 'ping', 'miao'],
  天机: ['de', 'wang', 'li', 'ping', 'miao', 'xian', 'de', 'wang', 'li', 'ping', 'miao', 'xian'],
  太阳: ['wang', 'miao', 'wang', 'wang', 'wang', 'de', 'de', 'xian', 'bu', 'xian', 'xian', 'bu'],
  武曲: ['de', 'li', 'miao', 'ping', 'wang', 'miao', 'de', 'li', 'miao', 'ping', 'wang', 'miao'],
  天同: ['li', 'ping', 'ping', 'miao', 'xian', 'bu', 'wang', 'ping', 'ping', 'miao', 'wang', 'bu'],
  廉贞: ['miao', 'ping', 'li', 'xian', 'ping', 'li', 'miao', 'ping', 'li', 'xian', 'ping', 'li'],
  天府: ['miao', 'de', 'miao', 'de', 'wang', 'miao', 'de', 'wang', 'miao', 'de', 'miao', 'miao'],
  太阴: ['wang', 'xian', 'xian', 'xian', 'bu', 'bu', 'li', 'bu', 'wang', 'miao', 'miao', 'miao'],
  贪狼: ['ping', 'li', 'miao', 'xian', 'wang', 'miao', 'ping', 'li', 'miao', 'xian', 'wang', 'miao'],
  巨门: ['miao', 'miao', 'xian', 'wang', 'wang', 'bu', 'miao', 'miao', 'xian', 'wang', 'wang', 'bu'],
  天相: ['miao', 'xian', 'de', 'de', 'miao', 'de', 'miao', 'xian', 'de', 'de', 'miao', 'miao'],
  天梁: ['miao', 'miao', 'miao', 'xian', 'miao', 'wang', 'xian', 'de', 'miao', 'xian', 'miao', 'wang'],
  七杀: ['miao', 'wang', 'miao', 'ping', 'wang', 'miao', 'miao', 'miao', 'miao', 'ping', 'wang', 'miao'],
  破军: ['de', 'xian', 'wang', 'ping', 'miao', 'wang', 'de', 'xian', 'wang', 'ping', 'miao', 'wang'],
};

/** 《斗数全书》派：以全书口径微调（与 default 差异处） */
const QS_OVERRIDES: Partial<Record<string, BrightnessKey[]>> = {
  太阳: ['wang', 'miao', 'wang', 'wang', 'wang', 'de', 'de', 'xian', 'bu', 'xian', 'xian', 'bu'],
  太阴: ['wang', 'xian', 'xian', 'xian', 'bu', 'bu', 'li', 'bu', 'wang', 'miao', 'miao', 'miao'],
};

/** 现代修正 v1（文墨 XD1）：太阳、太阴在酉戌亥子略有不同 */
const XD1_OVERRIDES: Partial<Record<string, BrightnessKey[]>> = {
  太阳: ['wang', 'miao', 'wang', 'wang', 'wang', 'de', 'de', 'xian', 'bu', 'xian', 'xian', 'bu'],
  天同: ['li', 'ping', 'ping', 'miao', 'xian', 'bu', 'wang', 'ping', 'ping', 'miao', 'wang', 'bu'],
};

/** 中州派：部分主星亮度偏向「得/利/平」 */
const ZZ_OVERRIDES: Partial<Record<string, BrightnessKey[]>> = {
  天机: ['de', 'wang', 'li', 'ping', 'miao', 'xian', 'de', 'wang', 'li', 'ping', 'miao', 'xian'],
  天相: ['miao', 'xian', 'de', 'de', 'miao', 'de', 'miao', 'xian', 'de', 'de', 'miao', 'miao'],
  天梁: ['miao', 'miao', 'miao', 'xian', 'miao', 'wang', 'xian', 'de', 'miao', 'xian', 'miao', 'wang'],
};

/** 现代修正 v2 */
const XD2_OVERRIDES: Partial<Record<string, BrightnessKey[]>> = {
  武曲: ['de', 'li', 'miao', 'ping', 'wang', 'miao', 'de', 'li', 'miao', 'ping', 'wang', 'miao'],
  贪狼: ['ping', 'li', 'miao', 'xian', 'wang', 'miao', 'ping', 'li', 'miao', 'xian', 'wang', 'miao'],
};

function mergeTable(overrides: Partial<Record<string, BrightnessKey[]>>) {
  const table: Record<string, BrightnessKey[]> = {};
  for (const [star, values] of Object.entries(IZTRO_DEFAULT)) {
    table[star] = [...(overrides[star] ?? values)];
  }
  return table;
}

const SCHOOL_TABLES: Record<Exclude<WenmoConfig['brightnessSchool'], 'default'>, Record<string, BrightnessKey[]>> = {
  QS: mergeTable(QS_OVERRIDES),
  XD1: mergeTable(XD1_OVERRIDES),
  ZZ: mergeTable(ZZ_OVERRIDES),
  XD2: mergeTable(XD2_OVERRIDES),
};

function toIztroBrightness(table: Record<string, BrightnessKey[]>) {
  const brightness: Record<string, string[]> = {};
  for (const [star, keys] of Object.entries(table)) {
    brightness[star] = keys.map(key => LABELS[key]);
  }
  return brightness;
}

export function buildBrightnessConfig(school: WenmoConfig['brightnessSchool']) {
  if (school === 'default') return undefined;
  return toIztroBrightness(SCHOOL_TABLES[school]);
}

export function lookupMajorBrightness(
  school: WenmoConfig['brightnessSchool'],
  starName: string,
  branchIndex: number,
): string | undefined {
  const table = school === 'default' ? IZTRO_DEFAULT : SCHOOL_TABLES[school];
  const row = table[starName];
  if (!row) return undefined;
  const key = row[branchIndex];
  return key ? LABELS[key] : undefined;
}
