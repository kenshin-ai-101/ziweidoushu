import { generateChart } from '../lib/ziwei/algorithm.ts';
import { formToBirthInfo } from '../lib/ziwei/share.ts';
import { DEFAULT_WENMO_CONFIG } from '../lib/ziwei/school-config.ts';

const form = {
  year: '1994', month: '7', day: '8',
  clockHour: '8', clockMinute: '0',
  unknownTime: true,
  gender: 'female',
  province: '浙江省', city: '宁波', longitude: 121.6,
  calendarType: 'solar', isLeapMonth: false, name: '',
};

const birth = formToBirthInfo(form, DEFAULT_WENMO_CONFIG);
const local = generateChart(birth, { wenmoConfig: DEFAULT_WENMO_CONFIG });

const payload = {
  year: 1994, month: 7, day: 8, hour: 0,
  gender: 'female', unknownTime: true,
  province: '浙江省', city: '宁波', longitude: 121.6,
};

const res = await fetch('https://wdyziweidoushu666.com/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const production = await res.json();

function serialize(p) {
  return p.stars.map(s => `${s.name}${s.brightnessLabel ? `(${s.brightnessLabel})` : ''}${s.siHua ? `[${s.siHua}]` : ''}`).join('|');
}

let diffCount = 0;
for (const lp of local.palaces) {
  const pp = production.palaces.find(p => p.name === lp.name);
  const ls = serialize(lp);
  const ps = serialize(pp);
  if (ls !== ps) {
    diffCount++;
    console.log(`\n=== ${lp.name} ===`);
    console.log('PROD :', ps);
    console.log('LOCAL:', ls);
    const lnames = lp.stars.map(s => s.name);
    const pnames = pp.stars.map(s => s.name);
    console.log('order prod', pnames.join(','));
    console.log('order local', lnames.join(','));
  }
}

console.log('\nmeta prod', { ming: production.mingGongBranch, shen: production.shenGongBranch, wuxing: production.wuxingJuName });
console.log('meta local', { ming: local.mingGongBranch, shen: local.shenGongBranch, wuxing: local.wuxingJuName });
console.log(diffCount ? `\n${diffCount} palace(s) differ` : '\nAPI identical');
