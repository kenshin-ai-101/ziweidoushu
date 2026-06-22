import { BRANCHES, STEMS } from './constants';
import { COMBO_STAR_DB, getAnalysisText } from './db-analysis';
import { COMBO_REGISTRY } from '@/lib/seo/combo';
import { buildTimeOverlay, getTemporalGanzhiInfo, getTimeOverlayLabel, type TimeViewKey } from './sihua';
import type { Palace, Star, ZiweiChart } from './types';
import {
  EMPTY_MING_BORROW_CLOSING,
  LUCKY_STAR_PALACE,
  OVERVIEW_INTRO,
  OVERVIEW_STAR_RULES,
  SECOND_MAJOR_DESC,
  SHEN_GONG_SAME,
  SIHUA_EFFECT,
  SIHUA_PALACE_NOTES,
  STAR_BRIGHTNESS_OVERLAY,
  STAR_PALACE_LINE,
} from './overview-knowledge';

interface ParsedDb {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
}

export interface OverviewAnalysisOptions {
  view?: TimeViewKey;
  liunianYear?: number;
  liuyueMonth?: number;
  liuriDay?: number;
  liushiHour?: number;
}

function parseDbMarkers(text: string): ParsedDb {
  const out: ParsedDb = { dingdiao: '', lundian: '', yiju: '', chuchu: '' };
  if (!text) return out;
  const re = /\*\*【([^】]+)】\*\*/g;
  const parts: { name: string; markerEnd: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    parts.push({ name: match[1], markerEnd: match.index + match[0].length });
  }
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const end = i + 1 < parts.length ? text.indexOf('**【', part.markerEnd) : text.length;
    const body = text.slice(part.markerEnd, end < 0 ? text.length : end).trim();
    if (part.name.includes('一句话定调')) out.dingdiao = body;
    else if (part.name.includes('核心论断')) out.lundian = body;
    else if (part.name.includes('命盘依据')) out.yiju = body;
    else if (part.name.includes('经典出处')) out.chuchu = body;
  }
  return out;
}

function section(title: string, body: string) {
  return `**【${title}】**\n\n${body.trim()}\n\n`;
}

function findPalace(chart: ZiweiChart, branch: number) {
  return chart.palaces.find(p => p.branch === branch);
}

function mingPalace(chart: ZiweiChart): Palace | undefined {
  return chart.palaces.find(p => p.isMingGong || p.branch === chart.mingGongBranch);
}

function palaceMajorNames(palace?: Palace): string[] {
  if (!palace) return [];
  const majors = palace.stars.filter(s => s.type === 'major').map(s => s.name);
  if (majors.length > 0) return majors;
  return palace.borrowedStars ?? [];
}

function oppositePalace(chart: ZiweiChart, palace: Palace) {
  return findPalace(chart, (palace.branch + 6) % 12);
}

function brightnessLabel(star: Star): string {
  const raw = star.brightnessLabel ?? '';
  if (raw === '庙' || raw === '旺') return '庙旺';
  if (raw === '陷' || raw === '不') return '落陷';
  if (raw === '得' || raw === '利' || raw === '平') return raw === '利' ? '利' : raw === '得' ? '得' : '平';
  if (star.brightness === 'bright') return '庙旺';
  if (star.brightness === 'dim') return '落陷';
  return raw || '平';
}

function formatStarToken(star: Star): string {
  const label = brightnessLabel(star);
  const sihua = star.siHua ? `化${star.siHua}` : '';
  const parts = [star.name, sihua, label ? `（${label}）` : ''].filter(Boolean);
  return parts.join('');
}

function formatStarList(stars: Star[], majorsOnly = false): string {
  const selected = majorsOnly
    ? stars.filter(s => s.type === 'major')
    : stars;
  if (selected.length === 0) return '无';
  return selected.map(s => formatStarToken(s)).join('、');
}

function findDualCombo(starNames: string[]) {
  if (starNames.length < 2) return null;
  return COMBO_REGISTRY.find(c =>
    c.stars.length === starNames.length &&
    c.stars.every(s => starNames.includes(s)),
  ) ?? null;
}

function getOverviewIntro(starNames: string[]): string {
  const key = starNames.join('');
  if (OVERVIEW_INTRO[key]) return OVERVIEW_INTRO[key];
  const combo = findDualCombo(starNames);
  if (combo && OVERVIEW_INTRO[combo.name.replace(/同宫$/, '')]) {
    return OVERVIEW_INTRO[combo.name.replace(/同宫$/, '')] ?? OVERVIEW_INTRO[combo.stars.join('')] ?? '';
  }
  if (combo && OVERVIEW_INTRO[combo.stars.join('')]) return OVERVIEW_INTRO[combo.stars.join('')];
  return '';
}

function buildCoreWithOverlays(star: string, parsed: ParsedDb, chart: ZiweiChart, effectivePalace: Palace): string {
  const lines = [parsed.lundian.trim()];
  const overlay = STAR_BRIGHTNESS_OVERLAY[star];
  if (overlay) {
    const majors = effectivePalace.stars.filter(s => s.type === 'major');
    const borrowed = effectivePalace.borrowedStars ?? [];
    const targetNames = majors.length > 0 ? majors.map(s => s.name) : borrowed;
    const targetStar = effectivePalace.stars.find(s => s.name === star) ??
      oppositePalace(chart, mingPalace(chart)!)?.stars.find(s => s.name === star);
    const isBright = targetStar?.brightness === 'bright' || ['庙', '旺'].includes(targetStar?.brightnessLabel ?? '');
    if (isBright && overlay.bright) lines.push('', overlay.bright);
    const hasQuan = chart.palaces.some(p => p.stars.some(s => s.name === star && s.siHua === '权'));
    if (hasQuan && overlay.quan) lines.push('', overlay.quan);
  }
  return lines.join('\n\n');
}

function buildMingPanTuiyan(chart: ZiweiChart, ming: Palace, opposite: Palace | undefined, mainStars: string[]) {
  const hasEmpty = ming.isEmpty || !ming.stars.some(s => s.type === 'major');
  const effective = hasEmpty ? opposite : ming;
  const effectiveStars = effective?.stars.filter(s => s.type === 'major') ?? [];
  const firstLine = hasEmpty
    ? `本宫主星：（命宫空宫，借对宫${mainStars[0] ?? '主星'}论事）${formatStarList(effectiveStars, true)}，${chart.wuxingJuName}`
    : `本宫主星：${formatStarList(ming.stars, true)}，${chart.wuxingJuName}`;
  const lines = [firstLine];
  if (mainStars[1]) {
    const desc = SECOND_MAJOR_DESC[mainStars[1]] ?? STAR_PALACE_LINE[mainStars[1]] ?? '与命宫主星共同决定气质。';
    lines.push('', `同宫第二主星：**${mainStars[1]}**——${desc}`);
  }
  return lines.join('\n');
}

function sanFangPalaces(chart: ZiweiChart, ming: Palace) {
  const branches = [ming.branch, (ming.branch + 4) % 12, (ming.branch + 8) % 12, (ming.branch + 6) % 12];
  const roles = [
    { role: '本宫 · 命宫', key: 'ming' as const },
    { role: '命宫三合·官禄 · 官禄', key: 'guanLu' as const },
    { role: '命宫三合·财帛 · 财帛', key: 'caiBo' as const },
    { role: '命宫对宫·迁移 · 迁移', key: 'qianYi' as const },
  ];
  return branches.map((branch, i) => ({ ...roles[i], palace: findPalace(chart, branch) }));
}

function luckyNotesForPalace(palace: Palace | undefined, key: keyof typeof LUCKY_STAR_PALACE[string]) {
  if (!palace) return [];
  const notes: string[] = [];
  for (const star of palace.stars) {
    const note = LUCKY_STAR_PALACE[star.name]?.[key];
    if (note) notes.push(`✦ **${star.name}**：${note}`);
  }
  return notes;
}

function buildSanFang(chart: ZiweiChart, ming: Palace, mainStars: string[], opposite: Palace | undefined) {
  const blocks: string[] = [];
  const items = sanFangPalaces(chart, ming);
  const hasEmpty = ming.isEmpty || !ming.stars.some(s => s.type === 'major');

  for (const item of items) {
    const palace = item.palace;
    if (!palace) continue;
    blocks.push(`▍**${item.role}**：${item.key === 'ming' && hasEmpty ? '命宫空宫' : formatStarList(palace.stars, item.key !== 'ming')}`);
    if (item.key === 'ming') {
      blocks.push(...luckyNotesForPalace(palace, 'ming'));
    } else {
      const majors = palace.stars.filter(s => s.type === 'major');
      for (const star of majors) {
        const label = brightnessLabel(star);
        const base = STAR_PALACE_LINE[star.name] ?? '';
        const sihuaExtra = star.siHua ? SIHUA_EFFECT[star.name]?.[star.siHua] : undefined;
        let line = `  ${star.name}（${label}）：${base}`;
        if (sihuaExtra) line += ` ｜ ${sihuaExtra}`;
        blocks.push(line);
      }
      blocks.push(...luckyNotesForPalace(palace, item.key));
    }
    blocks.push('');
  }

  const sanfangMajors = items
    .filter(i => i.key !== 'ming' && i.key !== 'qianYi')
    .flatMap(i => i.palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? []);
  const oppNames = (opposite ? palaceMajorNames(opposite) : mainStars).join('、');
  blocks.push(
    `▸ **本盘合参**：命宫本宫【${hasEmpty ? '空宫·借对宫入事' : `坐${mainStars.join('、')}`}】为体、对宫【${oppNames}】为用 ｜ 三合会【${sanfangMajors.join('、')}】——本命四化固定不动，吉凶看大限/流年引动。`,
  );
  return blocks.join('\n');
}

function collectNatalSihua(chart: ZiweiChart) {
  return chart.palaces.flatMap(p =>
    p.stars.filter(s => s.siHua).map(s => ({ palace: p, star: s })),
  );
}

function palaceShortName(name: string): string {
  if (name === '命宫') return '命宫';
  return name.replace(/宫$/, '');
}

function mingNetworkBranches(ming: Palace): Set<number> {
  return new Set([
    ming.branch,
    (ming.branch + 4) % 12,
    (ming.branch + 8) % 12,
    (ming.branch + 6) % 12,
  ]);
}

function sihuaIcon(siHua: NonNullable<Star['siHua']>) {
  if (siHua === '禄') return '🟢';
  if (siHua === '权') return '🔵';
  if (siHua === '科') return '🟡';
  return '🔴';
}

function sihuaRelation(hitPalace: Palace, ming: Palace): string {
  const hitShort = palaceShortName(hitPalace.name);
  const mingShort = palaceShortName(ming.name);
  if (hitPalace.branch === ming.branch) return `落${hitShort}`;
  if (hitPalace.branch === (ming.branch + 6) % 12) return `落${hitShort}·你${mingShort}的对宫`;
  return `落${hitShort}·你${mingShort}的三合`;
}

function buildSihuaEmptySummary(chart: ZiweiChart, ming: Palace): string {
  const items = sanFangPalaces(chart, ming);
  const parts = items.flatMap(item => {
    const p = item.palace;
    if (!p) return [];
    const stars = formatStarList(p.stars, true);
    const short = palaceShortName(p.name);
    if (item.key === 'ming') return [`${short}（本宫：${stars}）`];
    if (item.key === 'qianYi') return [`${short}（对宫：${stars}）`];
    return [`${short}（三合：${stars}）`];
  });
  return `你这盘命宫三方四正坐：${parts.join('；')}——本命四化未落入此范围，此项吉凶看大限/流年引动这些宫位时是否带出四化。`;
}

function buildSihuaPath(chart: ZiweiChart, ming: Palace) {
  const network = mingNetworkBranches(ming);
  const lines: string[] = [];
  let hasNetworkSihua = false;

  for (const { palace, star } of collectNatalSihua(chart)) {
    if (!network.has(palace.branch)) continue;
    hasNetworkSihua = true;
    const effect = SIHUA_EFFECT[star.name]?.[star.siHua!];
    lines.push(`${sihuaIcon(star.siHua!)} **${star.name}化${star.siHua}**（${sihuaRelation(palace, ming)}）`);
    if (effect) lines.push(`   ${effect}`);
    lines.push('');
  }

  if (!hasNetworkSihua) {
    lines.push(buildSihuaEmptySummary(chart, ming));
  }

  return lines.join('\n').trim();
}

function buildYearSihuaKey(chart: ZiweiChart, ming: Palace, options?: OverviewAnalysisOptions) {
  const network = mingNetworkBranches(ming);
  const lines: string[] = [];

  for (const { palace, star } of collectNatalSihua(chart)) {
    if (network.has(palace.branch)) continue;
    const effect = SIHUA_EFFECT[star.name]?.[star.siHua!];
    if (!effect || star.siHua === '权') continue;
    lines.push(`${sihuaIcon(star.siHua!)} **${star.name}化${star.siHua}**（落${palaceShortName(palace.name)}）→ ${effect}`);
  }

  for (const [key, text] of Object.entries(SIHUA_PALACE_NOTES)) {
    const [starName, palaceShort] = key.split('在');
    const palace = chart.palaces.find(p => p.name.startsWith(palaceShort));
    if (palace?.stars.some(s => s.name === starName)) {
      lines.push(`◇ **${key}**：${text}`);
    }
  }

  const temporal = buildTemporalSihua(chart, options);
  if (temporal) {
    lines.push('', temporal);
  }

  return lines.join('\n').trim();
}

function buildRiskReminders(hasEmptyMing: boolean) {
  const lines = [
    '> 紫微斗数讲究阴阳互见，下方为基于本盘特征的中性提醒，知所警惕方能转危为安。',
    '',
  ];
  if (hasEmptyMing) {
    lines.push('◆ 本宫空宫，能量需借对宫论事，命格总览走势比一般人更易受外缘/对宫牵动，自主性较弱。');
  }
  if (lines.length === 2) {
    lines.push('◆ 本宫未见明显重煞，命格走势多来自大限、流年触发；平时以稳守节奏、避免过度消耗为要。');
  }
  return lines.join('\n');
}

function timeViewTitle(view: TimeViewKey) {
  if (view === 'daxian') return '大限';
  if (view === 'liunian') return '流年';
  if (view === 'liuyue') return '流月';
  if (view === 'liuri') return '流日';
  if (view === 'liushi') return '流时';
  return getTimeOverlayLabel(view) ?? '本命';
}

function buildTemporalSihua(chart: ZiweiChart, options?: OverviewAnalysisOptions) {
  const view = options?.view ?? 'mingpan';
  if (view === 'mingpan') return '';

  const now = new Date();
  const liunianYear = options?.liunianYear ?? now.getFullYear();
  const liuyueMonth = options?.liuyueMonth ?? now.getMonth() + 1;
  const liuriDay = options?.liuriDay ?? now.getDate();
  const liushiHour = options?.liushiHour ?? 0;
  const temporal = getTemporalGanzhiInfo(liunianYear, liuyueMonth, liuriDay, liushiHour);
  const overlay = buildTimeOverlay({ view, chart, liunianYear, liuyueMonth, liuriDay, liushiHour });
  const entries = (['禄', '权', '科', '忌'] as const)
    .map(siHua => {
      const starName = Object.keys(overlay).find(name => overlay[name] === siHua);
      return starName ? `· ${starName}化${siHua}` : '';
    })
    .filter(Boolean);
  if (entries.length === 0) return '';

  const dateLine = [
    `${STEMS[temporal.yearStem]}${BRANCHES[temporal.yearBranch]}年`,
    view === 'liuyue' || view === 'liuri' || view === 'liushi'
      ? `${STEMS[temporal.monthStem]}${BRANCHES[temporal.monthBranch]}月`
      : '',
    view === 'liuri' || view === 'liushi'
      ? `${STEMS[temporal.dayStem]}${BRANCHES[temporal.dayBranch]}日`
      : '',
    view === 'liushi'
      ? `${STEMS[temporal.hourStem]}${BRANCHES[temporal.hourBranch]}时`
      : '',
  ].filter(Boolean).join(' · ');

  return [
    `当前层级：**${timeViewTitle(view)}**（${dateLine}）`,
    '',
    ...entries,
    '',
    '本命四化是底盘，时间层四化是引动；判断时以本命格局为体，以当前层级四化为应期与触发点。',
  ].join('\n');
}

/** 时间层四化附录（大限/流年/流月/流日/流时）— 供非 overview 主题复用 */
export function buildTemporalSihuaAppendix(chart: ZiweiChart, options?: OverviewAnalysisOptions): string {
  return buildTemporalSihua(chart, options);
}

function buildDualStarBlock(starNames: string[]) {
  const combo = findDualCombo(starNames);
  if (!combo?.topics.mingGong) return '';
  const t = combo.topics.mingGong;
  return [
    '---',
    '',
    `## ✦ 双星同宫 · 「${combo.name}」（${combo.palace}）`,
    '',
    `*${combo.brief}*`,
    '',
    '> **重要**：双星同宫不是单星之和——本盘命主属于此 24 组特殊组合之一，请重点参考下方论断（优先于单星基础论断）。',
    '',
    section('一句话定调', t.dingdiao),
    section('核心论断', t.lundian),
    section('命盘依据', t.yiju),
    section('经典出处', t.chuchu),
  ].join('\n');
}

function buildAuxiliaryComboBlock(primaryStar: string, ming: Palace) {
  const auxStars = ming.stars
    .filter(s => s.type !== 'major')
    .map(s => s.name);
  if (auxStars.length === 0) return '';

  const lines = [
    '---',
    '',
    '## ⚙ 主辅煞组合精细论断（命宫实际辅煞）',
    '',
    `*你的命宫除主星「${primaryStar}」外还同坐：${auxStars.join('、')}。以下为各组合专属论断（基于倪师 168 主辅煞组合矩阵）：*`,
    '',
  ];

  for (const aux of auxStars) {
    const comboText = COMBO_STAR_DB[primaryStar]?.[aux];
    if (!comboText) continue;
    const isSha = ['火星', '铃星', '擎羊', '陀罗', '地空', '地劫', '破碎'].includes(aux);
    lines.push(
      `### ${isSha ? '⚠' : '✦'} 「${primaryStar}+${aux}」 — ${isSha ? '煞星冲击' : '吉星辅佐'}`,
      '',
      comboText,
      '',
    );
  }
  return lines.join('\n').trim();
}

function buildOverviewStarRulesFooter(chart: ZiweiChart, ming: Palace, mainStars: string[]): string {
  const names = new Set<string>(mainStars);
  for (const p of chart.palaces) {
    if (!mingNetworkBranches(ming).has(p.branch)) continue;
    for (const s of p.stars) names.add(s.name);
  }
  const rules = [...names].map(n => OVERVIEW_STAR_RULES[n]).filter(Boolean);
  if (rules.length === 0) return '';
  return [
    '',
    '【倪师《天纪》· 星曜法则】',
    ...rules.map(r => `· ${r}`),
    '· 煞星（羊陀火铃空劫）亮度庙旺时反可制化为助、未必主凶；落陷方显其凶。',
  ].join('\n');
}

/** 生产 /api/analysis overview 全文组装 */
export function buildOverviewAnalysisText(chart: ZiweiChart, options?: OverviewAnalysisOptions): string {
  const gender = chart.birthInfo.gender;
  const ming = mingPalace(chart);
  if (!ming) return '未能识别命宫，请重新起盘后再试。';

  const mainStars = palaceMajorNames(ming);
  const primaryStar = mainStars[0];
  if (!primaryStar) return '未能识别命宫主星，请重新起盘后再试。';

  const opposite = oppositePalace(chart, ming);
  const hasEmpty = ming.isEmpty || !ming.stars.some(s => s.type === 'major');
  const effectivePalace = hasEmpty && opposite ? opposite : ming;
  const rawDb = getAnalysisText(primaryStar, 'overview', gender);
  const parsed = parseDbMarkers(rawDb);

  const intro = getOverviewIntro(mainStars) || parsed.lundian.split('\n')[0] || '';
  const parts: string[] = [];

  parts.push(section('命格总览', intro));
  parts.push(section('一句话定调', parsed.dingdiao));
  parts.push(section('核心论断', buildCoreWithOverlays(primaryStar, parsed, chart, effectivePalace)));
  parts.push(section('身宫 · 后天追求', chart.shenGongBranch === chart.mingGongBranch
    ? SHEN_GONG_SAME
    : `你的身宫落在${findPalace(chart, chart.shenGongBranch)?.name ?? '身宫'}，后天追求会转向该宫主管领域，需把命宫天赋落实到对应人生场景。`));
  parts.push(section('命盘推演', buildMingPanTuiyan(chart, ming, opposite, mainStars)));
  parts.push(section('三方四正联动', buildSanFang(chart, ming, mainStars, opposite)));
  parts.push(section('四化路径分析 · 落到你这盘', buildSihuaPath(chart, ming)));
  parts.push(section('年干四化·关键宫位影响', buildYearSihuaKey(chart, ming, options)));
  parts.push(section('命盘依据', parsed.yiju));
  parts.push(section('经典出处', parsed.chuchu));
  parts.push(section('⚠️ 风险提醒', buildRiskReminders(hasEmpty)));
  parts.push(section('针对你的命盘', EMPTY_MING_BORROW_CLOSING(
    opposite?.name.replace(/宫$/, '') ?? '对宫',
    mainStars.join('、'),
  )));

  const footer = [
    buildDualStarBlock(mainStars),
    buildAuxiliaryComboBlock(primaryStar, ming),
    buildOverviewStarRulesFooter(chart, ming, mainStars),
  ].filter(Boolean).join('\n\n');

  return [parts.filter(Boolean).join('\n\n'), footer].filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}
