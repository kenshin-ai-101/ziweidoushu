import { Solar } from 'lunar-javascript';
import type { ZiweiChart } from './types';
import { BRANCHES, STEMS } from './constants';
import { getLiuShiStemIndex, getLiuYueStemIndex } from './sihua';

export type BirthPillars = [string, string, string, string];

/** 宫名展示（去掉「宫」后缀，命宫保留） */
export function palaceShortName(name: string): string {
  if (name === '命宫') return '命宫';
  return name.replace(/宫$/, '');
}

/** 节气四柱：月柱按节令划分 */
export function computeBirthPillarsJieQi(
  year: number,
  month: number,
  day: number,
  hourBranch: number,
): BirthPillars {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const dayStem = STEMS.indexOf(lunar.getDayGan());
  const hourStem = dayStem >= 0
    ? STEMS[getLiuShiStemIndex(dayStem, hourBranch)]
    : STEMS[0];
  return [
    `${lunar.getYearGan()}${lunar.getYearZhi()}`,
    `${lunar.getMonthGan()}${lunar.getMonthZhi()}`,
    `${lunar.getDayGan()}${lunar.getDayZhi()}`,
    `${hourStem}${BRANCHES[hourBranch]}`,
  ];
}

/** 非节气四柱：月柱按农历月份（五虎遁） */
export function computeBirthPillarsNonJieQi(
  year: number,
  month: number,
  day: number,
  hourBranch: number,
): BirthPillars {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const yearStem = STEMS.indexOf(lunar.getYearGan());
  const lunarMonth = Math.abs(lunar.getMonth());
  const monthStem = getLiuYueStemIndex(yearStem >= 0 ? yearStem : 0, lunarMonth);
  const monthBranch = (lunarMonth + 1) % 12;
  const dayStem = STEMS.indexOf(lunar.getDayGan());
  const hourStem = dayStem >= 0
    ? STEMS[getLiuShiStemIndex(dayStem, hourBranch)]
    : STEMS[0];
  return [
    `${lunar.getYearGan()}${lunar.getYearZhi()}`,
    `${STEMS[monthStem]}${BRANCHES[monthBranch]}`,
    `${lunar.getDayGan()}${lunar.getDayZhi()}`,
    `${hourStem}${BRANCHES[hourBranch]}`,
  ];
}

const WUXING_CHAR_COLOR: Record<string, string> = {
  甲: 'var(--wx-wood)', 乙: 'var(--wx-wood)', 寅: 'var(--wx-wood)', 卯: 'var(--wx-wood)',
  丙: 'var(--wx-fire)', 丁: 'var(--wx-fire)', 巳: 'var(--wx-fire)', 午: 'var(--wx-fire)',
  戊: 'var(--wx-earth)', 己: 'var(--wx-earth)', 辰: 'var(--wx-earth)', 戌: 'var(--wx-earth)', 丑: 'var(--wx-earth)', 未: 'var(--wx-earth)',
  庚: 'var(--wx-metal)', 辛: 'var(--wx-metal)', 申: 'var(--wx-metal)', 酉: 'var(--wx-metal)',
  壬: 'var(--wx-water)', 癸: 'var(--wx-water)', 子: 'var(--wx-water)', 亥: 'var(--wx-water)',
};

/** 干支字符五行色（非节气区可用 muted） */
export function wuxingColorForChar(ch: string, muted = false): string {
  if (muted) return 'var(--tx-3)';
  return WUXING_CHAR_COLOR[ch] ?? 'var(--tx-0)';
}

/** 按所选大限步序覆盖 currentDaXianIndex 与宫位 isCurrentDaXian 高亮 */
export function applyDaXianIndex(chart: ZiweiChart, index: number): ZiweiChart {
  if (index < 0 || index >= chart.daXians.length) return chart;
  const dx = chart.daXians[index];
  if (index === chart.currentDaXianIndex) {
    const highlightsOk = chart.palaces.every(
      p => !!p.isCurrentDaXian === (p.branch === dx.palaceBranch),
    );
    if (highlightsOk) return chart;
  }
  return {
    ...chart,
    currentDaXianIndex: index,
    palaces: chart.palaces.map(p => ({
      ...p,
      isCurrentDaXian: p.branch === dx.palaceBranch,
    })),
  };
}

/** 大限年龄区间对应的公历年份列表 */
export function yearsForDaXian(chart: ZiweiChart, index: number): number[] {
  const dx = chart.daXians[index];
  if (!dx) return [];
  const years: number[] = [];
  for (let age = dx.startAge; age <= dx.endAge; age++) {
    years.push(chart.birthInfo.year + age - 1);
  }
  return years;
}

/** 切换大限时，优先保留当前流年；否则取区间内今年或首年 */
export function pickLiunianYearForDaXian(chart: ZiweiChart, index: number, currentYear: number): number {
  const years = yearsForDaXian(chart, index);
  if (years.length === 0) return currentYear;
  if (years.includes(currentYear)) return currentYear;
  const thisYear = new Date().getFullYear();
  if (years.includes(thisYear)) return thisYear;
  return years[0];
}

/** 真太阳时相对北京时间（东经120°）的分钟修正 */
export function trueSolarOffsetMinutes(longitude: number | undefined): number {
  if (longitude == null) return 0;
  return Math.round((longitude - 120) * 4);
}
