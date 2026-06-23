#!/usr/bin/env node
/**
 * 验证流派配置会改变排盘结果（庚年四化、晚子时等）
 * 用法: node scripts/smoke-wenmo.mjs
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const tsx = require('tsx/cjs/api');

const { generateChart } = tsx.require('../lib/ziwei/algorithm.ts', import.meta.url);
const { DEFAULT_WENMO_CONFIG } = tsx.require('../lib/ziwei/school-config.ts', import.meta.url);
const { formToBirthInfo } = tsx.require('../lib/ziwei/share.ts', import.meta.url);

function findSihua(chart, sihua) {
  const hits = [];
  for (const p of chart.palaces) {
    for (const s of p.stars) {
      if (s.siHua === sihua) hits.push(s.name);
    }
  }
  return hits;
}

let failed = 0;

const gengDefault = generateChart(
  { year: 2000, month: 6, day: 15, hour: 5, gender: 'male' },
  { wenmoConfig: DEFAULT_WENMO_CONFIG },
);
const gengVariant = generateChart(
  { year: 2000, month: 6, day: 15, hour: 5, gender: 'male' },
  { wenmoConfig: { ...DEFAULT_WENMO_CONFIG, gengYearSihua: 'GYWTY' } },
);

const defaultKe = findSihua(gengDefault, '科');
const variantKe = findSihua(gengVariant, '科');
if (defaultKe.join() === variantKe.join()) {
  console.error('✗ 庚年四化变体未改变化科');
  failed += 1;
} else {
  console.log('✓ 庚年四化 GYWTY 科忌互换', defaultKe, '→', variantKe);
}

const lateForm = {
  name: '', year: '1986', month: '9', day: '7',
  clockHour: '23', clockMinute: '0', unknownTime: false,
  province: '', city: '', longitude: 120, gender: 'male',
  calendarType: 'solar', isLeapMonth: false,
};

const nextDayInfo = formToBirthInfo(lateForm, { lateZishi: 'next-day' });
const currentDayInfo = formToBirthInfo(lateForm, { lateZishi: 'current-day' });

if (nextDayInfo.day === currentDayInfo.day) {
  console.error('✗ 晚子时次日/当日未改变日期');
  failed += 1;
} else {
  console.log('✓ 晚子时日期', `${currentDayInfo.month}/${currentDayInfo.day}`, 'vs', `${nextDayInfo.month}/${nextDayInfo.day}`);
}

const chartNext = generateChart(nextDayInfo, { wenmoConfig: DEFAULT_WENMO_CONFIG });
const chartCurrent = generateChart(currentDayInfo, {
  wenmoConfig: { ...DEFAULT_WENMO_CONFIG, lateZishi: 'current-day' },
});

if (chartNext._chartToken === chartCurrent._chartToken) {
  console.error('✗ 晚子时流派未改变命盘 token');
  failed += 1;
} else {
  console.log('✓ 晚子时流派改变命盘 token');
}

if (chartCurrent.birthPillars?.[3] === chartNext.birthPillars?.[3]) {
  console.log('  时柱相同（可能因命宫重合）');
} else {
  console.log('  时柱', chartCurrent.birthPillars?.[3], 'vs', chartNext.birthPillars?.[3]);
}

console.log(failed ? `\n⚠️  ${failed} 项未通过\n` : '\n✅ 流派排盘 smoke 通过\n');
process.exit(failed ? 1 : 0);
