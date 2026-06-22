import type { Palace, ZiweiChart } from './types';
import { STAR_DESCRIPTIONS } from './constants';
import { detectPatterns } from './patterns';

export const OVERVIEW_AXIS_PALACES: Record<string, string> = {
  career: '官禄',
  wealth: '财帛',
  love: '夫妻',
  personality: '命宫',
  health: '疾厄',
  overall: '迁移',
};

function mingPalace(chart: ZiweiChart): Palace | undefined {
  return chart.palaces.find(p => p.isMingGong || p.branch === chart.mingGongBranch);
}

function palaceMajorNames(palace?: Palace): string[] {
  const majors = palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
  if (majors.length > 0) return majors;
  return palace?.borrowedStars ?? [];
}

export function effectiveMingStars(chart: ZiweiChart): {
  stars: string[];
  hasEmpty: boolean;
} {
  const ming = mingPalace(chart);
  if (!ming) return { stars: [], hasEmpty: true };
  const hasEmpty = ming.isEmpty || !ming.stars.some(s => s.type === 'major');
  const opposite = chart.palaces.find(p => p.branch === (ming.branch + 6) % 12);
  const stars = hasEmpty ? palaceMajorNames(opposite) : palaceMajorNames(ming);
  return { stars, hasEmpty };
}

export function palaceScoreForOverview(palace?: Palace): number {
  if (!palace) return 50;
  let score = 52;
  const stars = palace.stars.length > 0
    ? palace.stars
    : (palace.borrowedStars ?? []).map(name => ({ name, type: 'major' as const }));
  for (const star of stars) {
    if (star.type === 'major') score += 9;
    else if (star.type === 'lucky') score += 6;
    else if (star.type === 'sha') score -= 7;
    else score += 1;
    if ('brightness' in star && star.brightness === 'bright') score += 6;
    if ('brightness' in star && star.brightness === 'dim') score -= 6;
    if ('siHua' in star && star.siHua === '禄') score += 8;
    if ('siHua' in star && star.siHua === '权') score += 6;
    if ('siHua' in star && star.siHua === '科') score += 5;
    if ('siHua' in star && star.siHua === '忌') score -= 10;
  }
  return Math.max(32, Math.min(92, score));
}

export function palaceMajorText(chart: ZiweiChart, palaceName: string): string {
  const palace = chart.palaces.find(p => p.name === palaceName || (palaceName === '仆役' && p.name === '交友'));
  const majors = palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
  if (majors.length > 0) return majors.join('·');
  if (palace?.borrowedStars?.length) return `借${palace.borrowedStars.join('·')}`;
  return '—';
}

const VISUAL_HEADLINES: Record<string, string> = {
  天机巨门: '机变善谋，智照先机',
  巨门天机: '机变善谋，智照先机',
  天机太阴: '慧心藏富，谋定后动',
  太阴天机: '慧心藏富，谋定后动',
  天机天梁: '智谋清正，谈兵有术',
  天梁天机: '智谋清正，谈兵有术',
  紫微: '帝星临命，格局自开',
  武曲: '刚毅守成，财星有力',
  太阳: '光明磊落，声名远播',
  天同: '福德随身，和气生财',
  廉贞: '多才多艺，情深入局',
  天府: '稳守厚载，财库自开',
  太阴: '柔中有刚，富贵渐成',
  贪狼: '欲望驱动，交际破局',
  天相: '印星护身，辅佐有成',
  天梁: '荫星护体，清贵自守',
  七杀: '将星飒爽，开疆拓土',
  破军: '破旧立新，变动为用',
};

const VISUAL_CARDS: Record<string, { advantage: string; relationship: string; growth: string }> = {
  天机巨门: {
    advantage: '智谋气象足，乱局里抢先看见机会，是天生的军师。',
    relationship: '应变又懂人心，沟通顺、点子多，自然聚得拢人。',
    growth: '选准一处深耕，机变就从灵光变成真本事。',
  },
  巨门天机: {
    advantage: '智谋气象足，乱局里抢先看见机会，是天生的军师。',
    relationship: '应变又懂人心，沟通顺、点子多，自然聚得拢人。',
    growth: '选准一处深耕，机变就从灵光变成真本事。',
  },
  天机太阴: {
    advantage: '心思细腻、洞察入微，能在复杂信息里找到最优路径。',
    relationship: '重感受、善体贴，与稳定踏实的伴侣最合拍。',
    growth: '少些内耗多行动，把敏感变成深度而非负担。',
  },
  紫微: {
    advantage: '气度沉稳、有统御力，天生适合扛大旗、定方向。',
    relationship: '重体面与担当，需要被尊重而非被管束。',
    growth: '学会授权与倾听，孤星独照不如百官来朝。',
  },
  武曲: {
    advantage: '执行力强、财务嗅觉敏锐，能把资源变成成果。',
    relationship: '务实直接，欣赏能并肩打拼、不拖泥带水的伴侣。',
    growth: '刚柔并济，别用硬碰硬消耗掉本可积累的福分。',
  },
};

function starNatureLabel(starName: string): string {
  const kw = STAR_DESCRIPTIONS[starName]?.keywords;
  if (!kw) return '主星';
  const first = kw.split('·')[0]?.trim();
  return first ? `${first}星` : '主星';
}

export function getOverviewVisualHeadline(chart: ZiweiChart): string {
  const { stars } = effectiveMingStars(chart);
  const joined = stars.join('');
  if (VISUAL_HEADLINES[joined]) return VISUAL_HEADLINES[joined];
  if (stars.length === 1 && VISUAL_HEADLINES[stars[0]]) return VISUAL_HEADLINES[stars[0]!];
  const primary = stars[0];
  if (primary) {
    const kw = STAR_DESCRIPTIONS[primary]?.keywords.split('·')[0]?.trim();
    if (kw) return `${kw}为命，格局自成`;
  }
  return '命格自成，三方合参';
}

export function getOverviewVisualSubtitle(chart: ZiweiChart): string {
  const patterns = detectPatterns(chart);
  const jiYue = patterns.find(p => p.name.includes('机月同梁'));
  const { stars, hasEmpty } = effectiveMingStars(chart);
  const parts: string[] = [];
  if (jiYue) {
    parts.push(`${jiYue.name}格局，宜稳健专精、公门或技术安身，忌投机躁进`);
  }
  if (hasEmpty && stars.length > 0) {
    parts.push(`命宫空宫借${stars.join('、')}，人生由自立而显`);
  }
  return parts.join('；');
}

export function getOverviewKicker(chart: ZiweiChart): { lead: string; tags: string[] } {
  const { stars, hasEmpty } = effectiveMingStars(chart);
  const display = stars.length > 0 ? stars.join('·') : '借星';
  const primary = stars[0] ?? '借星';
  const lead = `命宫主星 · ${display}（${starNatureLabel(primary)}）`;
  const tags: string[] = [];
  const patterns = detectPatterns(chart);
  const jiYue = patterns.find(p => p.name.includes('机月同梁'));
  if (jiYue) tags.push(jiYue.name);
  else if (patterns[0]) tags.push(patterns[0].name);
  if (hasEmpty) tags.push('命宫空宫 · 借星论');
  return { lead, tags };
}

function genericCards(stars: string[], hasEmpty: boolean): { advantage: string; relationship: string; growth: string } {
  const primary = stars[0] ?? '命宫';
  const desc = STAR_DESCRIPTIONS[primary];
  const kw = desc?.keywords.replace(/·/g, '、') ?? '先天特质';
  return {
    advantage: `${primary}坐命，${kw}是你最鲜明的底色；把主星优势用在真实事务里，比空想更能见格局。`,
    relationship: '人际上宜找能互补、能承接你节奏的人；太相似或太对立，都容易放大本盘弱点。',
    growth: hasEmpty
      ? '空宫不在静处见性，要在动处见命——走出去、协作、解决问题，比独自内耗更能校准自我。'
      : '定守一处、做深一件，比广撒网更能把天赋变成可积累的本事。',
  };
}

export function getOverviewVisualCards(chart: ZiweiChart): {
  advantage: string;
  relationship: string;
  growth: string;
} {
  const { stars, hasEmpty } = effectiveMingStars(chart);
  const joined = stars.join('');
  if (VISUAL_CARDS[joined]) return VISUAL_CARDS[joined];
  if (stars.length === 1 && VISUAL_CARDS[stars[0]!]) return VISUAL_CARDS[stars[0]!]!;
  return genericCards(stars, hasEmpty);
}

export function findPalaceByName(chart: ZiweiChart, palaceName: string): Palace | undefined {
  return chart.palaces.find(p => p.name === palaceName || (palaceName === '仆役' && p.name === '交友'));
}

/** 供雷达图标注：取宫位主星或借星摘要 */
export function axisPalaceLabel(chart: ZiweiChart, palaceName: string): string {
  return palaceMajorText(chart, palaceName);
}
