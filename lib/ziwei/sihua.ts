/**
 * 四化工具模块 — 年干 / 大限宫干 / 流年干 / 流月干 四化映射
 *                + 宫干自化检测 + 来因宫追溯
 *
 * 倪海厦《天纪》体系核心：
 *   本命四化 = 出生年天干四化（静态基础）
 *   大限四化 = 大限宫**宫干**（非本命年干）的四化（十年动态）
 *   流年四化 = 当年年干的四化（一年动态）
 *   自化     = 某宫的宫干四化，其中被化星恰在本宫
 *   来因宫   = 某颗化星的"动力来源宫"——即宫干引发该化的宫位
 */

import type { ZiweiChart, Palace, SiHua } from './types';
import { SI_HUA_TABLE, STEMS, BRANCHES } from './constants';
import { Solar } from 'lunar-javascript';

// ─── 1) 由天干索引取四化四星 ───────────────────────────────────
/** 天干索引 0-9 → { 禄, 权, 科, 忌 } 对应星名 */
export function getSiHuaByStem(stemIndex: number): Record<SiHua, string> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return { 禄: '', 权: '', 科: '', 忌: '' };
  return { 禄: arr[0], 权: arr[1], 科: arr[2], 忌: arr[3] };
}

/** 星名 → 四化类型（由某天干确定） */
export function buildStarSiHuaMap(stemIndex: number): Record<string, SiHua> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return {};
  return { [arr[0]]: '禄', [arr[1]]: '权', [arr[2]]: '科', [arr[3]]: '忌' };
}

// ─── 2) 公历年 → 年柱天干索引 ──────────────────────────────────
/** 公历年份 → 年柱天干索引（0=甲, ... 9=癸） */
export function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

/** 公历年份 → 年柱地支索引（0=子, ... 11=亥） */
export function getYearBranchIndex(year: number): number {
  return ((year - 4) % 12 + 12) % 12;
}

function getStemIndex(stemName: string): number {
  const index = STEMS.indexOf(stemName);
  return index >= 0 ? index : 0;
}

function getBranchIndex(branchName: string): number {
  const index = BRANCHES.indexOf(branchName);
  return index >= 0 ? index : 0;
}

export function getDaysInSolarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function normalizeSolarDate(year: number, month: number, day: number) {
  const safeMonth = Math.min(12, Math.max(1, month || 1));
  const maxDay = getDaysInSolarMonth(year, safeMonth);
  return {
    year,
    month: safeMonth,
    day: Math.min(maxDay, Math.max(1, day || 1)),
  };
}

export interface TemporalGanzhiInfo {
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  yearStem: number;
  yearBranch: number;
  monthStem: number;
  monthBranch: number;
  dayStem: number;
  dayBranch: number;
  hourStem: number;
  hourBranch: number;
}

export function getTemporalGanzhiInfo(
  year: number,
  month: number,
  day: number,
  hourBranch = 0,
): TemporalGanzhiInfo {
  const normalized = normalizeSolarDate(year, month, day);
  const lunar = Solar.fromYmd(normalized.year, normalized.month, normalized.day).getLunar();
  const rawLunarMonth = lunar.getMonth();
  const dayStem = getStemIndex(lunar.getDayGan());
  const safeHourBranch = ((hourBranch % 12) + 12) % 12;

  return {
    solarYear: normalized.year,
    solarMonth: normalized.month,
    solarDay: normalized.day,
    lunarYear: lunar.getYear(),
    lunarMonth: Math.abs(rawLunarMonth),
    lunarDay: lunar.getDay(),
    isLeapMonth: rawLunarMonth < 0,
    yearStem: getStemIndex(lunar.getYearGan()),
    yearBranch: getBranchIndex(lunar.getYearZhi()),
    monthStem: getStemIndex(lunar.getMonthGan()),
    monthBranch: getBranchIndex(lunar.getMonthZhi()),
    dayStem,
    dayBranch: getBranchIndex(lunar.getDayZhi()),
    hourStem: getLiuShiStemIndex(dayStem, safeHourBranch),
    hourBranch: safeHourBranch,
  };
}

// ─── 3) 大限四化：取大限宫的宫干（非本命年干）───────────────
/**
 * 大限宫干四化
 * @param chart 命盘
 * @param dxIndex 大限索引（chart.daXians[dxIndex]）
 * @returns 该大限的四化四星
 */
export function getDaXianSiHua(
  chart: ZiweiChart,
  dxIndex: number,
): { stemIndex: number; stemName: string; transforms: Record<SiHua, string> } | null {
  const dx = chart.daXians[dxIndex];
  if (!dx) return null;
  const dxPalace = chart.palaces.find(p => p.branch === dx.palaceBranch);
  if (!dxPalace) return null;
  const stemIndex = dxPalace.stem;
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 4) 流年四化 ──────────────────────────────────────────────
export function getLiuNianSiHua(year: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  const stemIndex = getYearStemIndex(year);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 5) 流月四化（月柱天干，由年干 + 月序推） ───────────────
/**
 * 流月天干（五虎遁：甲己年起丙寅、乙庚年起戊寅、丙辛年起庚寅、丁壬年起壬寅、戊癸年起甲寅）
 * month: 农历月 1-12
 */
export function getLiuYueStemIndex(yearStem: number, month: number): number {
  // 五虎遁：正月（寅月）天干
  const startStemOfYin: Record<number, number> = {
    0: 2, 5: 2,  // 甲己 → 丙
    1: 4, 6: 4,  // 乙庚 → 戊
    2: 6, 7: 6,  // 丙辛 → 庚
    3: 8, 8: 8,  // 丁壬 → 壬
    4: 0, 9: 0,  // 戊癸 → 甲
  };
  const yinStem = startStemOfYin[yearStem] ?? 0;
  // 从寅（正月）到目标月（month 取 1-12）
  return (yinStem + ((month - 1) % 12) + 10) % 10;
}

export function getLiuYueSiHua(yearStem: number, month: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  const stemIndex = getLiuYueStemIndex(yearStem, month);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 5b) 流日四化（五鼠遁：月干起日）────────────────────────────
/** 流日天干：由流月天干 + 日序（1-30）推算 */
export function getLiuRiStemIndex(monthStem: number, day: number): number {
  const startStemOfDay: Record<number, number> = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8,
  };
  const base = startStemOfDay[monthStem] ?? 0;
  return (base + ((day - 1) % 10) + 10) % 10;
}

export function getLiuRiSiHua(monthStem: number, day: number) {
  const stemIndex = getLiuRiStemIndex(monthStem, day);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 5c) 流时四化（五鼠遁：日干起时）────────────────────────────
/** 流时天干：由流日天干 + 时辰支 (0-11) 推算 */
export function getLiuShiStemIndex(dayStem: number, hourBranch: number): number {
  const startStemOfHour: Record<number, number> = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8,
  };
  const base = startStemOfHour[dayStem] ?? 0;
  return (base + hourBranch + 10) % 10;
}

export function getLiuShiSiHua(dayStem: number, hourBranch: number) {
  const stemIndex = getLiuShiStemIndex(dayStem, hourBranch);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

export type TimeViewKey = 'mingpan' | 'daxian' | 'liunian' | 'liuyue' | 'liuri' | 'liushi';

export interface TimeOverlayParams {
  view: TimeViewKey;
  chart: ZiweiChart;
  liunianYear: number;
  liuyueMonth: number;
  liuriDay: number;
  liushiHour: number;
}

/** 当前时间层四化 overlay：星名 → 禄/权/科/忌 */
export function buildTimeOverlay(params: TimeOverlayParams): Record<string, string> {
  const { view, chart, liunianYear, liuyueMonth, liuriDay, liushiHour } = params;
  if (view === 'mingpan') return {};

  if (view === 'daxian') {
    const dx = chart.daXians[chart.currentDaXianIndex];
    if (!dx) return {};
    const dxPalace = chart.palaces.find(p => p.branch === dx.palaceBranch);
    if (!dxPalace) return {};
    const map = buildStarSiHuaMap(dxPalace.stem);
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v]));
  }

  const temporal = getTemporalGanzhiInfo(liunianYear, liuyueMonth, liuriDay, liushiHour);
  const yearStem = temporal.yearStem;

  if (view === 'liunian') {
    const map = buildStarSiHuaMap(yearStem);
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v]));
  }

  const monthStem = temporal.monthStem;

  if (view === 'liuyue') {
    const map = buildStarSiHuaMap(monthStem);
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v]));
  }

  const dayStem = temporal.dayStem;

  if (view === 'liuri') {
    const map = buildStarSiHuaMap(dayStem);
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v]));
  }

  if (view === 'liushi') {
    const hourStem = temporal.hourStem;
    const map = buildStarSiHuaMap(hourStem);
    return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v]));
  }

  return {};
}

export function getTimeOverlayLabel(view: TimeViewKey): string | undefined {
  switch (view) {
    case 'daxian': return '限';
    case 'liunian': return '年';
    case 'liuyue': return '月';
    case 'liuri': return '日';
    case 'liushi': return '时';
    default: return undefined;
  }
}

// ─── 6) 宫干自化检测 ──────────────────────────────────────────
/**
 * 自化：该宫宫干引发的四化，被化星恰在本宫
 * e.g. 宫干为甲（廉破武阳），如果本宫主星含"廉贞"，则该宫有"自化禄"
 */
export interface SelfSihua {
  siHua: SiHua;        // 禄/权/科/忌
  starName: string;    // 被化的星
}

export function detectSelfSihua(palace: Palace): SelfSihua[] {
  const transforms = getSiHuaByStem(palace.stem);
  const found: SelfSihua[] = [];
  const palaceStarNames = new Set(palace.stars.map(s => s.name));
  (['禄', '权', '科', '忌'] as SiHua[]).forEach(sh => {
    const starName = transforms[sh];
    if (starName && palaceStarNames.has(starName)) {
      found.push({ siHua: sh, starName });
    }
  });
  return found;
}

// ─── 7) 来因宫追溯 ────────────────────────────────────────────
/**
 * 来因宫：对某颗星某种化，追溯是哪个宫的宫干"飞"过来的
 *
 * 倪师体系常用：化忌的来因宫——化忌由哪个宫位的"宫干"引发，那个宫位就是问题的根源宫位
 *
 * @param chart 命盘
 * @param starName 被化的星名（如 "太阴"）
 * @param sihua  四化类型（如 "忌"）
 * @returns 引发该化的宫位数组（通常只有一个，但若多宫宫干相同可能多个）
 */
export function findIncomingPalaces(
  chart: ZiweiChart,
  starName: string,
  sihua: SiHua,
): Palace[] {
  const result: Palace[] = [];
  chart.palaces.forEach(p => {
    const transforms = getSiHuaByStem(p.stem);
    if (transforms[sihua] === starName) {
      result.push(p);
    }
  });
  return result;
}

/**
 * 批量计算盘面所有宫位的自化列表
 */
export function buildAllSelfSihua(chart: ZiweiChart): Record<number, SelfSihua[]> {
  const result: Record<number, SelfSihua[]> = {};
  chart.palaces.forEach(p => {
    const list = detectSelfSihua(p);
    if (list.length > 0) result[p.branch] = list;
  });
  return result;
}

// ─── 8) 综合覆盖（overlay）：多个四化层叠加后的效果 ──────────
/**
 * 生成某星名 → 多层四化的合成视图
 * 用于在宫位上同时显示：本命化 / 大限化 / 流年化
 * 优先级：本命 < 大限 < 流年（但都标出来）
 */
export interface SiHuaOverlay {
  native?: SiHua;    // 本命（年干）
  daXian?: SiHua;    // 大限
  liuNian?: SiHua;   // 流年
  liuYue?: SiHua;    // 流月
}

export function buildOverlayForStar(
  starName: string,
  nativeMap: Record<string, SiHua>,
  daXianMap?: Record<string, SiHua>,
  liuNianMap?: Record<string, SiHua>,
  liuYueMap?: Record<string, SiHua>,
): SiHuaOverlay {
  return {
    native: nativeMap[starName],
    daXian: daXianMap?.[starName],
    liuNian: liuNianMap?.[starName],
    liuYue: liuYueMap?.[starName],
  };
}
