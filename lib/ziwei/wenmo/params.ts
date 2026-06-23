import { Lunar, Solar } from 'lunar-javascript';
import type { WenmoConfig } from '@/lib/ziwei/school-config';
import type { BirthInfo } from '@/lib/ziwei/types';

function remapLeapSolarDate(year: number, month: number, day: number, mode: WenmoConfig['leapMonth']) {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const rawMonth = lunar.getMonth();
  const isLeap = rawMonth < 0;
  if (!isLeap || mode === 'split' || mode === 'origin-month') {
    return { solarDate: `${year}-${month}-${day}`, remapped: false };
  }

  const lunarMonth = Math.abs(rawMonth);
  const lunarDay = lunar.getDay();
  const lunarYear = lunar.getYear();

  if (mode === 'prev-month') {
    const target = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
    const s = target.getSolar();
    return { solarDate: `${s.getYear()}-${s.getMonth()}-${s.getDay()}`, remapped: true };
  }

  if (mode === 'next-month') {
    const target = Lunar.fromYmd(lunarYear, lunarMonth + 1, lunarDay);
    const s = target.getSolar();
    return { solarDate: `${s.getYear()}-${s.getMonth()}-${s.getDay()}`, remapped: true };
  }

  return { solarDate: `${year}-${month}-${day}`, remapped: false };
}

export function resolveFixLeap(leapMonth: WenmoConfig['leapMonth']) {
  switch (leapMonth) {
    case 'split':
      return true;
    case 'prev-month':
    case 'origin-month':
      return false;
    case 'next-month':
      return true;
    default:
      return true;
  }
}

export function resolveDayDivide(lateZishi: WenmoConfig['lateZishi']): 'forward' | 'current' {
  switch (lateZishi) {
    case 'current-day':
    case 'all-current':
      return 'current';
    default:
      return 'forward';
  }
}

export interface ResolvedChartParams {
  solarDate: string;
  timeIndex: number;
  fixLeap: boolean;
  leapRemapped: boolean;
}

export function resolveChartParams(
  info: { year: number; month: number; day: number; hour: number; timeIndex?: number },
  wenmo: WenmoConfig,
): ResolvedChartParams {
  let { year, month, day } = info;
  let timeIndex = info.timeIndex ?? info.hour;

  const leapRemap = remapLeapSolarDate(year, month, day, wenmo.leapMonth);
  let solarDate = leapRemap.solarDate;
  if (leapRemap.remapped) {
    const [y, m, d] = solarDate.split('-').map(Number);
    year = y;
    month = m;
    day = d;
  }

  if (info.timeIndex === 12) {
    timeIndex = 12;
  }

  return {
    solarDate,
    timeIndex,
    fixLeap: resolveFixLeap(wenmo.leapMonth),
    leapRemapped: leapRemap.remapped,
  };
}

/** 将闰月重映射、晚子时 timeIndex 等排盘参数同步到 birthInfo */
export function applyResolvedBirthInfo(birthInfo: BirthInfo, params: ResolvedChartParams): BirthInfo {
  const [year, month, day] = params.solarDate.split('-').map(Number);
  const hour = params.timeIndex === 12 ? 0 : birthInfo.hour;
  return {
    ...birthInfo,
    year,
    month,
    day,
    hour,
    timeIndex: params.timeIndex,
  };
}
