import type { ZiweiChart, Palace } from './types';
import { COMBO_STAR_DB } from './db-analysis';
import { BRANCHES } from './constants';
import { SIHUA_EFFECT } from './overview-knowledge';
import {
  HEALTH_RENJI_PLAN,
  JIE_E_BRANCH_AXIS,
  LUCKY_STAR_JIE_E,
  SHA_JIE_E_WARNING,
  STAR_TIANJI_RULES,
  STAR_WUXING_JIE_E,
  type RenjiPlan,
} from './health-analysis-knowledge';

function collectNatalSihua(chart: ZiweiChart) {
  return chart.palaces.flatMap(p =>
    p.stars.filter(s => s.siHua).map(star => ({ palace: p, star })),
  );
}

function topicNetworkBranches(chart: ZiweiChart, palace: Palace): Set<number> {
  const branches = new Set<number>([palace.branch]);
  branches.add((palace.branch + 4) % 12);
  branches.add((palace.branch + 8) % 12);
  branches.add((palace.branch + 6) % 12);
  return branches;
}

function hasSihuaJiInNetwork(chart: ZiweiChart, palace: Palace): boolean {
  const branches = topicNetworkBranches(chart, palace);
  return collectNatalSihua(chart).some(
    ({ palace: p, star }) => branches.has(p.branch) && star.siHua === '忌',
  );
}

export function buildJieEBranchAxisBlock(palace: Palace | undefined): string {
  if (!palace) return '';
  const branchName = BRANCHES[palace.branch];
  const axis = JIE_E_BRANCH_AXIS[branchName];
  if (!axis) return '';

  return [
    `疾厄宫落于 **${branchName}宫**——倪师《天纪 05》原法：`,
    `▸ 主管脏腑：**${axis.organ}**`,
    `▸ 对应经络：${axis.meridian}`,
    `▸ 经络旺时：${axis.peakTime}`,
    `▸ 养生要点：${axis.tip}`,
  ].join('\n');
}

export function buildStarAuxBlock(
  chart: ZiweiChart,
  palace: Palace | undefined,
  primaryStar: string,
): string {
  if (!palace || !primaryStar) return '';

  const wx = STAR_WUXING_JIE_E[primaryStar];
  const lines: string[] = [];

  if (wx) {
    lines.push(
      `疾厄宫主星 **${primaryStar}**（${wx.element}）辅助指向 **${wx.organ}**——星曜五行是"附加提示"，与宫位地支脏腑叠加判断：`,
      `▸ ${wx.tip}`,
      '',
    );
  }

  const shaInPalace = palace.stars.filter(s => s.name in SHA_JIE_E_WARNING);
  for (const star of shaInPalace) {
    lines.push(
      `⚠️ **煞星入疾厄**：${star.name}——倪师《天纪 11-12》：「陀罗、擎羊入疾厄宫，开刀见血光」。需提前体检，流年化忌入此宫时尤防手术意外。`,
      '',
    );
  }

  if (hasSihuaJiInNetwork(chart, palace)) {
    const branchName = BRANCHES[palace.branch];
    const axis = JIE_E_BRANCH_AXIS[branchName];
    const organ = axis?.organ ?? '主管脏腑';
    const peak = axis?.peakTime ?? '对应经络旺时';
    lines.push(
      `⚠️ 三方四正有化忌——倪师提醒：疾厄宫主管的 **${organ}** 在化忌年份最需重点体检；经络旺时（${peak}）应让该脏腑充分休息。`,
    );
  }

  return lines.join('\n').trim();
}

export function buildHealthYearSihuaBlock(chart: ZiweiChart, palace: Palace | undefined): string {
  if (!palace) return '';
  const focusBranches = topicNetworkBranches(chart, palace);
  const lines: string[] = [];

  for (const { palace: hitPalace, star } of collectNatalSihua(chart)) {
    if (focusBranches.has(hitPalace.branch)) continue;
    const effect = SIHUA_EFFECT[star.name]?.[star.siHua!];
    if (!effect || star.siHua === '权') continue;
    const icon = star.siHua === '禄' ? '🟢' : star.siHua === '科' ? '🟡' : '🔴';
    lines.push(`${icon} **${star.name}化${star.siHua}**（落${hitPalace.name.replace(/宫$/, '')}）→ ${effect}`);
  }

  return lines.join('\n').trim();
}

function formatRenjiPlan(plan: RenjiPlan): string {
  const lines: string[] = [
    '---',
    '',
    '## 🌿 倪师人纪方案参考（基于本命星曜倾向推荐）',
    '',
    `*关键词：${plan.keywords}*`,
    '',
    '### ▸ 针灸调理建议',
    '',
  ];

  for (const item of plan.acupuncture) {
    lines.push(`- **${item.label}**：${item.points}`);
  }

  lines.push('', '### ▸ 倪师方剂参考', '');
  for (const f of plan.formulas) {
    lines.push(`- **${f.name}**（${f.source}）：${f.indication}`);
    lines.push(`  - *倪师用法*：${f.niUsage}`);
  }

  lines.push('', '### ▸ 倪师真实病案（人纪课程讲解）', '');
  for (const c of plan.cases) {
    lines.push(`- **${c.title}**`);
    lines.push(`  - 主诉：${c.chiefComplaint}`);
    lines.push(`  - 倪师辨证：${c.diagnosis}`);
    lines.push(`  - 倪师原话："${c.niQuote}"`);
  }

  lines.push(
    '',
    '---',
    '> 以上方案源自倪师人纪课程真实病案教学。**仅作教学参考**，具体调理请咨询倪师传承中医师面诊后使用。',
  );
  return lines.join('\n');
}

export function buildHealthRenjiBlock(primaryStar: string): string {
  const plan = HEALTH_RENJI_PLAN[primaryStar];
  if (!plan) return '';
  return formatRenjiPlan(plan);
}

export function buildHealthMingAuxBlock(chart: ZiweiChart, mingPrimaryStar: string): string {
  const ming = chart.palaces.find(p => p.isMingGong || p.branch === chart.mingGongBranch);
  if (!ming) return '';

  const auxStars = ming.stars
    .filter(s => s.type !== 'major')
    .map(s => s.name);
  if (auxStars.length === 0) return '';

  const lines: string[] = [
    '---',
    '',
    '## ⚙ 主辅煞组合精细论断（命宫实际辅煞）',
    '',
    `*你的命宫除主星「${mingPrimaryStar}」外还同坐：${auxStars.join('、')}。以下为各组合专属论断（基于倪师 168 主辅煞组合矩阵）：*`,
    '',
  ];

  for (const aux of auxStars) {
    const comboText = COMBO_STAR_DB[mingPrimaryStar]?.[aux];
    if (!comboText) continue;
    const isSha = ['火星', '铃星', '擎羊', '陀罗', '地空', '地劫'].includes(aux);
    lines.push(
      `### ${isSha ? '⚠' : '✦'} 「${mingPrimaryStar}+${aux}」 — ${isSha ? '煞星冲击' : '吉星辅佐'}`,
      '',
      comboText,
      '',
    );
  }

  return lines.join('\n').trim();
}

export function buildHealthStarRulesFooter(
  palace: Palace | undefined,
  majorStars: string[],
): string {
  const names = new Set<string>(majorStars);
  if (palace) {
    for (const s of palace.stars) {
      if (LUCKY_STAR_JIE_E[s.name] || STAR_TIANJI_RULES[s.name]) {
        names.add(s.name);
      }
    }
  }

  const rules = [...names]
    .map(n => STAR_TIANJI_RULES[n])
    .filter(Boolean);

  if (rules.length === 0) return '';

  return [
    '',
    '【倪师《天纪》· 星曜法则】',
    ...rules.map(r => `· ${r}`),
    '· 煞星（羊陀火铃空劫）亮度庙旺时反可制化为助、未必主凶；落陷方显其凶。',
  ].join('\n');
}

export function luckyNotesForJieEPalace(palace: Palace): string[] {
  return palace.stars
    .map(star => {
      const note = LUCKY_STAR_JIE_E[star.name];
      return note ? `✦ **${star.name}**：${note}` : '';
    })
    .filter(Boolean);
}
