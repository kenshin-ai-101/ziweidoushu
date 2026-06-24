import { Solar } from 'lunar-javascript';
import type { Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import type { WenmoConfig } from '@/lib/ziwei/school-config';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { lookupMajorBrightness } from '@/lib/ziwei/wenmo/brightness';
import { branchToYinIndex } from '@/lib/ziwei/grid-brightness';
import type { ResolvedChartParams } from '@/lib/ziwei/wenmo/params';

const CHANGSHENG_STARS = [
  '长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养',
] as const;

function fixIndex(index: number, max = 12) {
  let value = index;
  while (value < 0) value += max;
  while (value >= max) value -= max;
  return value;
}

function findStar(palaces: Palace[], name: string) {
  for (const palace of palaces) {
    const star = palace.stars.find(item => item.name === name);
    if (star) return { palace, star };
  }
  return null;
}

function moveStar(palaces: Palace[], name: string, targetBranch: number) {
  const hit = findStar(palaces, name);
  if (!hit) return;
  hit.palace.stars = hit.palace.stars.filter(item => item.name !== name);
  const target = palaces.find(p => p.branch === targetBranch);
  if (!target) return;
  target.stars.push(hit.star);
}

function removeStars(palaces: Palace[], names: string[]) {
  const set = new Set(names);
  for (const palace of palaces) {
    palace.stars = palace.stars.filter(star => !set.has(star.name));
  }
}

function addStarIfMissing(palaces: Palace[], branch: number, star: Star) {
  const palace = palaces.find(item => item.branch === branch);
  if (!palace) return;
  if (palace.stars.some(item => item.name === star.name)) return;
  palace.stars.push(star);
}

function getYearStemBranch(chart: ZiweiChart) {
  const solar = Solar.fromYmd(chart.birthInfo.year, chart.birthInfo.month, chart.birthInfo.day);
  const lunar = solar.getLunar();
  const stem = STEMS.indexOf(lunar.getYearGan());
  const branch = BRANCHES.indexOf(lunar.getYearZhi());
  return { stem, branch };
}

function getMonthBranch(chart: ZiweiChart) {
  const solar = Solar.fromYmd(chart.birthInfo.year, chart.birthInfo.month, chart.birthInfo.day);
  const lunar = solar.getLunar();
  const monthBranch = (Math.abs(lunar.getMonth()) + 1) % 12;
  return monthBranch;
}

function tianmaByMonthBranch(monthBranch: number) {
  const table = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5];
  return table[monthBranch] ?? 0;
}

function tiankongShunJiaShi(yearBranch: number, timeIndex: number) {
  return fixIndex(yearBranch + timeIndex);
}

function kuiyueIndex(stem: number, school: WenmoConfig['kuiyueSchool']) {
  const qs1: Record<number, [number, number]> = {
    0: [1, 7], 4: [1, 7], 6: [1, 7],
    1: [0, 8], 5: [0, 8],
    7: [6, 2],
    8: [3, 5], 9: [3, 5],
    2: [11, 9], 3: [11, 9],
  };

  const qs2: Record<number, [number, number]> = {
    ...qs1,
    6: [2, 8],
    7: [6, 2],
    8: [4, 6],
    9: [4, 6],
  };

  const zhongYiming: Record<number, [number, number]> = {
    0: [1, 7], 5: [1, 7],
    1: [0, 8], 6: [0, 8],
    2: [11, 9], 7: [11, 9],
    3: [11, 9], 8: [11, 9],
    4: [1, 7], 9: [1, 7],
  };

  const network: Record<number, [number, number]> = {
    0: [2, 8], 1: [1, 9], 2: [0, 10], 3: [11, 5], 4: [2, 8],
    5: [1, 9], 6: [0, 10], 7: [11, 5], 8: [2, 8], 9: [1, 9],
  };

  const table = school === 'qs2'
    ? qs2
    : school === 'zhong-yiming'
      ? zhongYiming
      : school === 'network'
        ? network
        : qs1;

  return table[stem] ?? qs1[0];
}

function changshengStart(wuxingJu: number, school: WenmoConfig['changshengSchool']) {
  if (school === 'shui-tu' && wuxingJu === 5) return fixIndex(8);
  if (school === 'huo-tu' && wuxingJu === 5) return fixIndex(2);
  const map: Record<number, number> = { 2: 8, 3: 11, 4: 5, 5: 8, 6: 2 };
  return fixIndex(map[wuxingJu] ?? 8);
}

function applyChangsheng(palaces: Palace[], chart: ZiweiChart, wenmo: WenmoConfig) {
  if (wenmo.changshengSchool === 'yin-yang-shun-ni') return;
  removeStars(palaces, [...CHANGSHENG_STARS]);
  const { branch: yearBranch } = getYearStemBranch(chart);
  const start = changshengStart(chart.wuxingJu, wenmo.changshengSchool);
  const forward = yearBranch % 2 === (chart.birthInfo.gender === 'male' ? 0 : 1);
  for (let i = 0; i < CHANGSHENG_STARS.length; i += 1) {
    const branch = forward ? fixIndex(start + i) : fixIndex(start - i);
    addStarIfMissing(palaces, branch, { name: CHANGSHENG_STARS[i], type: 'minor' });
  }
}

function applyJiekong(palaces: Palace[], stem: number, school: WenmoConfig['jiekongSchool']) {
  // 保留 iztro 原局旬空（如福德宫），仅重置截路/空亡
  removeStars(palaces, ['截路', '空亡']);
  const jielu = fixIndex([8, 6, 4, 2, 0][stem % 5]);
  const kongwang = fixIndex([9, 7, 5, 3, 1][stem % 5]);
  if (school === 'double') {
    addStarIfMissing(palaces, jielu, { name: '截路', type: 'sha' });
    addStarIfMissing(palaces, kongwang, { name: '空亡', type: 'sha' });
    return;
  }
  if (school === 'single') {
    addStarIfMissing(palaces, jielu, { name: '截路', type: 'sha' });
    return;
  }
  addStarIfMissing(palaces, kongwang, { name: '旬空', type: 'sha' });
}

function applyTianshiTianshang(palaces: Palace[], chart: ZiweiChart, wenmo: WenmoConfig) {
  if (wenmo.tianshiTianshang !== 'zhongzhou') return;
  const ming = palaces.find(p => p.isMingGong);
  if (!ming) return;
  const { branch: yearBranch } = getYearStemBranch(chart);
  const yangYear = yearBranch % 2 === 0;
  const yangGender = chart.birthInfo.gender === 'male';
  const samePolarity = yangYear === yangGender;
  if (samePolarity) return;

  const tianshi = findStar(palaces, '天使');
  const tianshang = findStar(palaces, '天伤');
  if (!tianshi || !tianshang) return;
  const tianshiBranch = tianshi.palace.branch;
  const tianshangBranch = tianshang.palace.branch;
  moveStar(palaces, '天使', tianshangBranch);
  moveStar(palaces, '天伤', tianshiBranch);
}

function applyBrightness(palaces: Palace[], school: WenmoConfig['brightnessSchool']) {
  if (school === 'default') return;
  for (const palace of palaces) {
    for (const star of palace.stars) {
      if (star.type !== 'major') continue;
      const label = lookupMajorBrightness(school, star.name, branchToYinIndex(palace.branch));
      if (!label) continue;
      star.brightnessLabel = label;
      star.brightness = label === '庙' || label === '旺'
        ? 'bright'
        : label === '陷' || label === '不'
          ? 'dim'
          : 'normal';
    }
  }
}

export function applyWenmoPostProcess(
  chart: ZiweiChart,
  wenmo: WenmoConfig,
  params: ResolvedChartParams,
): ZiweiChart {
  const palaces = chart.palaces.map(p => ({ ...p, stars: [...p.stars] }));
  const { stem, branch: yearBranch } = getYearStemBranch(chart);

  if (wenmo.tianmaSchool === 'month-branch') {
    moveStar(palaces, '天马', tianmaByMonthBranch(getMonthBranch(chart)));
  }

  if (wenmo.tiankongSchool === 'shun-jia-shi') {
    moveStar(palaces, '天空', tiankongShunJiaShi(yearBranch, params.timeIndex));
  }

  const [kui, yue] = kuiyueIndex(stem >= 0 ? stem : 0, wenmo.kuiyueSchool);
  moveStar(palaces, '天魁', kui);
  moveStar(palaces, '天钺', yue);

  applyJiekong(palaces, stem >= 0 ? stem : 0, wenmo.jiekongSchool);
  applyChangsheng(palaces, { ...chart, palaces }, wenmo);
  applyTianshiTianshang(palaces, chart, wenmo);
  applyBrightness(palaces, wenmo.brightnessSchool);

  return { ...chart, palaces };
}
