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

/** 混合亮度表（default）：全书 + 文墨 8GDPB 交叉验证，与生产 API 一致 */
const HYBRID_DEFAULT: Record<string, string[]> = {
  七杀: ['庙', '陷', '庙', '平', '旺', '旺', '庙', '平', '庙', '平', '旺', '旺'],
  天同: ['闲', '庙', '旺', '庙', '陷', '陷', '旺', '平', '平', '庙', '旺', '陷'],
  天府: ['庙', '平', '庙', '旺', '旺', '庙', '旺', '陷', '庙', '旺', '旺', '庙'],
  天机: ['旺', '旺', '旺', '平', '庙', '陷', '旺', '旺', '旺', '平', '庙', '陷'],
  天梁: ['庙', '庙', '旺', '陷', '庙', '旺', '陷', '平', '旺', '陷', '庙', '旺'],
  天相: ['庙', '陷', '旺', '平', '旺', '平', '庙', '陷', '陷', '平', '庙', '庙'],
  太阳: ['旺', '庙', '旺', '旺', '庙', '旺', '平', '平', '陷', '陷', '陷', '陷'],
  太阴: ['陷', '陷', '陷', '陷', '陷', '陷', '旺', '旺', '旺', '庙', '庙', '庙'],
  巨门: ['庙', '旺', '陷', '庙', '旺', '陷', '庙', '旺', '陷', '庙', '旺', '陷'],
  廉贞: ['庙', '闲', '旺', '陷', '平', '庙', '庙', '平', '旺', '陷', '平', '旺'],
  武曲: ['平', '陷', '庙', '平', '旺', '庙', '平', '旺', '庙', '平', '旺', '庙'],
  破军: ['陷', '旺', '旺', '平', '庙', '庙', '陷', '陷', '旺', '平', '庙', '庙'],
  紫微: ['庙', '旺', '闲', '旺', '庙', '庙', '旺', '平', '陷', '旺', '闲', '庙'],
  贪狼: ['平', '旺', '庙', '陷', '旺', '庙', '平', '旺', '庙', '陷', '旺', '庙'],
};

/** 寅起十二宫，与 iztro STARS_INFO 一致（流派覆盖基准） */
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
  if (school === 'default') return { ...HYBRID_DEFAULT };
  return toIztroBrightness(SCHOOL_TABLES[school]);
}

export function lookupMajorBrightness(
  school: WenmoConfig['brightnessSchool'],
  starName: string,
  branchIndex: number,
): string | undefined {
  if (school === 'default') {
    return HYBRID_DEFAULT[starName]?.[branchIndex];
  }
  const row = SCHOOL_TABLES[school][starName];
  if (!row) return undefined;
  const key = row[branchIndex];
  return key ? LABELS[key] : undefined;
}
