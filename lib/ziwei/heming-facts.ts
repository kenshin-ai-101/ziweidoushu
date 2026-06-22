import { findPalaceByName, palaceMainStars } from './chart-queries';
import { STEMS } from './constants';
import { getSiHuaByStem } from './sihua';
import type { SiHua, ZiweiChart } from './types';

function formatPalaceSummary(chart: ZiweiChart, palaceName: string): string {
  const palace = findPalaceByName(chart, palaceName);
  if (!palace) return '未见对应宫位';
  const majors = palaceMainStars(palace);
  const sihua = palace.stars
    .filter(s => s.siHua)
    .map(s => `${s.name}化${s.siHua}`)
    .join('、');
  const self = palace.selfSihua?.map(s => `自化${s.siHua}(${s.starName})`).join('、');
  const base = majors.length > 0
    ? `${palace.name}（${majors.join('、')}）`
    : `${palace.name}（空宫，借${palace.borrowedFromName ?? '对宫'}：${(palace.borrowedStars ?? []).join('、') || '无'}）`;
  const extra = [sihua && `生年四化：${sihua}`, self && `宫干自化：${self}`].filter(Boolean).join('；');
  return extra ? `${base}；${extra}` : base;
}

function findStarPalace(chart: ZiweiChart, starName: string): string | undefined {
  for (const palace of chart.palaces) {
    if (palace.stars.some(s => s.name === starName)) return palace.name;
  }
  return undefined;
}

function starsOverlap(a: string[], b: string[]): string[] {
  return a.filter(star => b.includes(star));
}

function buildSiHuaCross(chartFrom: ZiweiChart, chartTo: ZiweiChart, labelFrom: string, labelTo: string): string[] {
  const stem = chartFrom.lunarInfo.yearStem;
  const stemName = STEMS[stem] ?? '?';
  const sihua = getSiHuaByStem(stem);
  const lines: string[] = [];

  for (const [type, star] of Object.entries(sihua) as [SiHua, string][]) {
    if (!star) continue;
    const palace = findStarPalace(chartTo, star);
    if (palace) {
      lines.push(`${labelFrom}生年干${stemName}化${type}（${star}）落在${labelTo}${palace}`);
    }
  }
  return lines;
}

function buildDaXianLine(chart: ZiweiChart, label: string): string {
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (!dx) return `${label}当前大限：暂无`;
  const sihua = dx.siHua;
  const sihuaText = sihua
    ? `；宫干四化 禄${sihua.lu} 权${sihua.quan} 科${sihua.ke} 忌${sihua.ji}`
    : '';
  return `${label}当前大限：${dx.startAge}-${dx.endAge}岁 ${dx.palaceName}宫${sihuaText}`;
}

export function buildHemingStructuredFacts(chartA: ZiweiChart, chartB: ZiweiChart): string {
  const aMing = palaceMainStars(findPalaceByName(chartA, '命宫'));
  const bMing = palaceMainStars(findPalaceByName(chartB, '命宫'));
  const aFuqi = palaceMainStars(findPalaceByName(chartA, '夫妻'));
  const bFuqi = palaceMainStars(findPalaceByName(chartB, '夫妻'));
  const aFude = palaceMainStars(findPalaceByName(chartA, '福德'));
  const bFude = palaceMainStars(findPalaceByName(chartB, '福德'));

  const aFuqiInBMing = starsOverlap(aFuqi, bMing);
  const bFuqiInAMing = starsOverlap(bFuqi, aMing);
  const mutualPerfect = aFuqiInBMing.length > 0 && bFuqiInAMing.length > 0;

  const matchLines: string[] = [];
  if (mutualPerfect) {
    matchLines.push(`天作之合信号：甲方夫妻宫主星（${aFuqi.join('、') || '无'}）对应乙方命宫（${bMing.join('、') || '无'}），且乙方夫妻宫主星（${bFuqi.join('、') || '无'}）对应甲方命宫（${aMing.join('、') || '无'}）`);
  } else {
    if (aFuqiInBMing.length) matchLines.push(`甲方夫妻宫主星 ${aFuqiInBMing.join('、')} 落入乙方命宫，单向缘分较强`);
    if (bFuqiInAMing.length) matchLines.push(`乙方夫妻宫主星 ${bFuqiInAMing.join('、')} 落入甲方命宫，单向缘分较强`);
    if (!aFuqiInBMing.length && !bFuqiInAMing.length) {
      matchLines.push('双方夫妻宫主星与对方法命宫主星无直接对应，需靠四化、福德与大限综合判断');
    }
  }

  const sihuaLines = [
    ...buildSiHuaCross(chartA, chartB, '甲方', '乙方'),
    ...buildSiHuaCross(chartB, chartA, '乙方', '甲方'),
  ];

  const lines = [
    `甲方命宫：${formatPalaceSummary(chartA, '命宫')}`,
    `乙方命宫：${formatPalaceSummary(chartB, '命宫')}`,
    `甲方夫妻宫：${formatPalaceSummary(chartA, '夫妻')}`,
    `乙方夫妻宫：${formatPalaceSummary(chartB, '夫妻')}`,
    `甲方福德宫：${formatPalaceSummary(chartA, '福德')}`,
    `乙方福德宫：${formatPalaceSummary(chartB, '福德')}`,
    ...matchLines,
    buildDaXianLine(chartA, '甲方'),
    buildDaXianLine(chartB, '乙方'),
  ];

  if (sihuaLines.length) {
    lines.push('四化互参：' + sihuaLines.join('；'));
  }

  return lines.join('\n');
}

export function buildLocalHemingText(chartA: ZiweiChart, chartB: ZiweiChart, question?: string): string {
  const facts = buildHemingStructuredFacts(chartA, chartB);
  const focus = question ? `\n\n**【本次追问】**\n${question}\n` : '';

  return `**【合盘总览】**
${facts.split('\n').slice(0, 2).join('；')}。以下基于倪师体系对双方命宫、夫妻宫、福德宫及四化互参做结构化合盘。

**【缘分评级】**
请结合双方夫妻宫互映、福德宫稳定性与生年四化互参，在后续 AI 完整版中会给出 1-5 星评级；本地降级版建议以「命宫气质是否互补 + 夫妻宫是否互映」作初判。

**【命宫互看】**
甲方命宫主星与乙方命宫主星决定基本气质与相处节奏。若一刚一柔、一动一静，多偏互补；若同为杀破狼或双强势星，需明确边界与决策分工。

**【夫妻宫互参】**
${facts.split('\n').find(l => l.startsWith('甲方夫妻宫')) ?? ''}；${facts.split('\n').find(l => l.startsWith('乙方夫妻宫')) ?? ''}。夫妻宫代表对亲密关系的期待，一方夫妻宫主星若能在对方命宫显现，缘分感更强。

**【福德宫耐久度】**
${facts.split('\n').filter(l => l.includes('福德宫')).join('；')}。倪师强调：光看夫妻宫不够，还要看福德宫；福德稳定，关系更容易越相处越安心。

**【四化飞化互参】**
${facts.split('\n').find(l => l.startsWith('四化互参')) ?? '双方生年四化落宫需结合具体盘面细论。'}

**【大限同步】**
${facts.split('\n').filter(l => l.includes('当前大限')).join('；')}

**【相处建议】**
先把关系定义说清楚，再谈长期承诺。合盘适合发现互动模式，不能替代现实沟通。冲突明显时，优先处理作息、财务、家庭边界等可执行问题。${focus}`;
}
