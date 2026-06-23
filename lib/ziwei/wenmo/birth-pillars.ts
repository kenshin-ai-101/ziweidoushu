import { Solar } from 'lunar-javascript';
import {
  computeBirthPillarsJieQi,
  computeBirthPillarsNonJieQi,
  type BirthPillars,
} from '@/lib/ziwei/chart-view';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { getLiuShiStemIndex } from '@/lib/ziwei/sihua';
import type { BirthInfo } from '@/lib/ziwei/types';
import type { WenmoConfig } from '@/lib/ziwei/school-config';

function hourPillarForDay(year: number, month: number, day: number, hourBranch: number): string {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const dayStem = STEMS.indexOf(lunar.getDayGan());
  const hourStem = dayStem >= 0
    ? STEMS[getLiuShiStemIndex(dayStem, hourBranch)]
    : STEMS[0];
  return `${hourStem}${BRANCHES[hourBranch]}`;
}

function withHourPillar(pillars: BirthPillars, hourPillar: string): BirthPillars {
  return [pillars[0], pillars[1], pillars[2], hourPillar];
}

/** 晚子时流派对四柱时柱的修正 */
export function computeBirthPillarsForWenmo(
  birthInfo: BirthInfo,
  wenmo: WenmoConfig,
): { birthPillars: BirthPillars; birthPillarsNonJieQi: BirthPillars } {
  const { year, month, day, hour, timeIndex } = birthInfo;
  const hourBranch = hour;

  const jieQi = computeBirthPillarsJieQi(year, month, day, hourBranch);
  const nonJieQi = computeBirthPillarsNonJieQi(year, month, day, hourBranch);

  if (timeIndex !== 12) {
    return { birthPillars: jieQi, birthPillarsNonJieQi: nonJieQi };
  }

  if (wenmo.lateZishi === 'day-cur-time-next') {
    const next = new Date(year, month - 1, day + 1);
    const ny = next.getFullYear();
    const nm = next.getMonth() + 1;
    const nd = next.getDate();
    const hourPillar = hourPillarForDay(ny, nm, nd, 0);
    return {
      birthPillars: withHourPillar(jieQi, hourPillar),
      birthPillarsNonJieQi: withHourPillar(nonJieQi, hourPillar),
    };
  }

  return { birthPillars: jieQi, birthPillarsNonJieQi: nonJieQi };
}
