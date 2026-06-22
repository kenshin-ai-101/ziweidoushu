import type { ZiweiChart } from './types';
import {
  getAnalysisText,
  TOPIC_PALACE_NAME,
  TOPIC_LABEL,
  type TopicKey,
} from './db-analysis';
import { COMBO_REGISTRY } from '@/lib/seo/combo';
import type { ComboTopicContent, ComboTopicKey } from '@/lib/seo/combo-data.generated';
import {
  buildOverviewAnalysisText,
  buildTemporalSihuaAppendix,
  type OverviewAnalysisOptions,
} from './overview-analysis';
import {
  LUCKY_STAR_PALACE,
  SECOND_MAJOR_DESC,
  SIHUA_EFFECT,
  SIHUA_PALACE_NOTES,
  STAR_BRIGHTNESS_OVERLAY,
  STAR_PALACE_LINE,
} from './overview-knowledge';
import { lookupTopicStarOverview } from './topic-overview-knowledge';
import type { Palace, Star } from './types';

const TOPIC_TO_COMBO_TOPIC: Partial<Record<TopicKey, ComboTopicKey>> = {
  love: 'fuQi',
  career: 'guanLu',
  wealth: 'caiBo',
};

const PALACE_NOTE_KEY: Partial<Record<string, keyof typeof LUCKY_STAR_PALACE[string]>> = {
  命宫: 'ming',
  迁移: 'qianYi',
  财帛: 'caiBo',
  福德: 'fuDe',
  官禄: 'guanLu',
};

const TOPIC_OVERVIEW_ACTION: Partial<Record<TopicKey, string>> = {
  wealth: '财务策略上，适合把专业能力明码标价，走长期复利和稳健资产路线。',
  career: '事业策略上，宜选能积累声誉、权责清晰、可持续曝光的平台。',
  love: '关系策略上，少用体面压住真实感受，多把责任、边界和陪伴讲清楚。',
  personality: '修炼重点是把聪明收束成长期专注，避免在不断比较中消耗行动力。',
  health: '健康管理上，规律、节制和持续检查比短期猛补更关键。',
  family: '兄弟合伙要先定规则再谈情分，钱权责越清楚，关系越能长久。',
  children: '子女缘分重在耐心与引导，少用控制换安心，多给孩子稳定边界。',
  move: '迁移外出的机会要看资源承接，适合带着明确目标走出去，而不是因焦虑而动。',
  friends: '人际贵人贵在筛选，真正有用的关系来自长期互信，不来自短期热闹。',
  home: '田宅议题宜稳扎稳打，重视长期安全感与家庭秩序，不宜冲动置换。',
  spirit: '福德重点在内在安顿，精神能量稳了，财事与人事才不容易失衡。',
  parents: '父母长辈议题宜重视沟通节奏，既承接资源，也要保留自己的边界。',
};

interface ParsedDb {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
}

function findPalace(chart: ZiweiChart, branch: number) {
  return chart.palaces.find(p => p.branch === branch);
}

function palaceNoteLabel(name: string): string {
  if (name === '命宫') return '命宫';
  return name.replace(/宫$/, '');
}

function palaceByTopic(chart: ZiweiChart, topic: TopicKey) {
  const palaceName = TOPIC_PALACE_NAME[topic];
  return chart.palaces.find(p =>
    p.name === palaceName ||
    (palaceName === '命宫' && (p.isMingGong || p.branch === chart.mingGongBranch)) ||
    (palaceName === '仆役' && p.name === '交友'),
  );
}

function palaceMainStars(palace: ZiweiChart['palaces'][number] | undefined): string[] {
  if (!palace) return [];
  const majors = palace.stars.filter(s => s.type === 'major').map(s => s.name);
  if (majors.length > 0) return majors;
  return palace.borrowedStars ?? [];
}

function palaceHasEmptyMajors(palace: Palace | undefined): boolean {
  if (!palace) return true;
  return palace.isEmpty || !palace.stars.some(s => s.type === 'major');
}

function oppositePalace(chart: ZiweiChart, palace: Palace | undefined) {
  if (!palace) return undefined;
  return findPalace(chart, (palace.branch + 6) % 12);
}

function brightnessLabel(star: Star): string {
  const raw = star.brightnessLabel ?? '';
  if (raw === '庙' || raw === '旺') return '庙旺';
  if (raw === '陷' || raw === '不') return '落陷';
  if (raw === '得' || raw === '利' || raw === '平') return raw;
  if (star.brightness === 'bright') return '庙旺';
  if (star.brightness === 'dim') return '落陷';
  return raw || '平';
}

function formatStarToken(star: Star): string {
  return `${star.name}${star.siHua ? `化${star.siHua}` : ''}（${brightnessLabel(star)}）`;
}

function formatStarList(stars: Star[], majorsOnly = false): string {
  const selected = majorsOnly ? stars.filter(s => s.type === 'major') : stars;
  if (selected.length === 0) return '无';
  return selected.map(s => formatStarToken(s)).join('、');
}

function formatPalaceHeadline(palace: Palace | undefined): string {
  if (!palace) return '未识别';
  const majors = palace.stars.filter(s => s.type === 'major');
  if (majors.length > 0) return formatStarList(majors, true);
  if (palace.borrowedStars?.length) {
    return `${palace.name}空宫（借对宫${palace.borrowedFromName ?? ''}：${palace.borrowedStars.join('、')}入事）`;
  }
  return `${palace.name}空宫`;
}

function formatPalaceShort(palace: Palace | undefined): string {
  if (!palace) return '无';
  const majors = palace.stars.filter(s => s.type === 'major');
  if (majors.length > 0) return majors.map(s => s.name).join('、');
  if (palace.borrowedStars?.length) return palace.borrowedStars.join('、');
  return '空宫';
}

function parseDbMarkers(text: string): ParsedDb {
  const out: ParsedDb = { dingdiao: '', lundian: '', yiju: '', chuchu: '' };
  if (!text.trim()) return out;

  const re = /\*\*【([^】]+)】\*\*/g;
  const parts: { name: string; markerEnd: number; nextStart: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    parts.push({ name: match[1], markerEnd: match.index + match[0].length, nextStart: match.index });
  }

  if (parts.length === 0) {
    out.lundian = text.trim();
    return out;
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const end = i + 1 < parts.length ? parts[i + 1].nextStart : text.length;
    const body = text.slice(part.markerEnd, end).trim();
    if (part.name.includes('一句话定调')) out.dingdiao = body;
    else if (part.name.includes('核心论断')) out.lundian = body;
    else if (part.name.includes('命盘依据')) out.yiju = body;
    else if (part.name.includes('经典出处')) out.chuchu = body;
  }
  return out;
}

function section(title: string, body: string) {
  const clean = body.trim();
  return clean ? `**【${title}】**\n\n${clean}` : '';
}

/** 命宫主星（空宫则取借星） */
export function getMingGongMainStars(chart: ZiweiChart): string[] {
  return palaceMainStars(palaceByTopic(chart, 'overview'));
}

export function getMingGongMainStar(chart: ZiweiChart): string | null {
  return getMingGongMainStars(chart)[0] ?? null;
}

export function getTopicMainStars(chart: ZiweiChart, topic: TopicKey): string[] {
  return palaceMainStars(palaceByTopic(chart, topic));
}

export function getTopicMainStar(chart: ZiweiChart, topic: TopicKey): string | null {
  return getTopicMainStars(chart, topic)[0] ?? null;
}

function getComboContent(stars: string[], topic: TopicKey): ComboTopicContent | null {
  const comboTopic = TOPIC_TO_COMBO_TOPIC[topic];
  if (!comboTopic || stars.length !== 2) return null;
  const combo = COMBO_REGISTRY.find(c =>
    c.stars.length === 2 &&
    c.stars.every(star => stars.includes(star)),
  );
  return combo?.topics[comboTopic] ?? null;
}

function formatComboAppend(content: ComboTopicContent): string {
  const sections = [
    ['一句话定调', content.dingdiao],
    ['核心论断', content.lundian],
    ['命盘依据', content.yiju],
    ['经典出处', content.chuchu],
  ] as const;

  return sections
    .filter(([, body]) => body.trim())
    .map(([title, body]) => section(title, body))
    .join('\n\n');
}

function buildCoreWithOverlays(
  star: string,
  parsed: ParsedDb,
  chart: ZiweiChart,
  palace: Palace | undefined,
): string {
  const lines = [parsed.lundian.trim()];
  const overlay = STAR_BRIGHTNESS_OVERLAY[star];
  if (!overlay || !palace) return lines.join('\n\n');

  const targetStar = palace.stars.find(s => s.name === star) ??
    oppositePalace(chart, palace)?.stars.find(s => s.name === star);
  const isBright = targetStar?.brightness === 'bright' || ['庙', '旺'].includes(targetStar?.brightnessLabel ?? '');
  if (isBright && overlay.bright) lines.push('', overlay.bright);
  const hasQuan = chart.palaces.some(p => p.stars.some(s => s.name === star && s.siHua === '权'));
  if (hasQuan && overlay.quan) lines.push('', overlay.quan);
  return lines.join('\n\n');
}

function buildTopicTuiyan(chart: ZiweiChart, topic: TopicKey, palace: Palace | undefined, stars: string[]) {
  if (!palace) return '';
  const hasEmpty = palaceHasEmptyMajors(palace);
  const opposite = oppositePalace(chart, palace);
  const effective = hasEmpty ? opposite : palace;
  const effectiveMajors = effective?.stars.filter(s => s.type === 'major') ?? [];

  const firstLine = hasEmpty
    ? `本宫主星：（${TOPIC_PALACE_NAME[topic]}空宫，借对宫${stars[0] ?? '主星'}论事）${formatStarList(effectiveMajors, true)}`
    : `本宫主星：${formatStarList(palace.stars, true)}`;

  const lines = [firstLine];
  if (stars[1]) {
    const desc = SECOND_MAJOR_DESC[stars[1]] ?? STAR_PALACE_LINE[stars[1]] ?? '与本宫主星共同决定此主题的表现方式。';
    lines.push('', `同宫第二主星：**${stars[1]}**——${desc}`);
  }
  return lines.join('\n');
}

function luckyNotesForPalace(palace: Palace | undefined) {
  if (!palace) return [];
  const key = PALACE_NOTE_KEY[palace.name];
  if (!key) return [];
  return palace.stars
    .map(star => {
      const note = LUCKY_STAR_PALACE[star.name]?.[key];
      return note ? `✦ ${star.name}：${note}` : '';
    })
    .filter(Boolean);
}

function topicPalaceLinks(chart: ZiweiChart, palace: Palace) {
  const short = palace.name.replace(/宫$/, '');
  const trine1 = findPalace(chart, (palace.branch + 4) % 12);
  const trine2 = findPalace(chart, (palace.branch + 8) % 12);
  const opposite = oppositePalace(chart, palace);
  return [
    { role: `本宫 · ${palace.name}`, palace, isSelf: true },
    {
      role: `${short}三合·${trine1?.name.replace(/宫$/, '') ?? '三合'} · ${trine1?.name ?? '三合宫'}`,
      palace: trine1,
      isSelf: false,
    },
    {
      role: `${short}三合·${trine2?.name.replace(/宫$/, '') ?? '三合'} · ${trine2?.name ?? '三合宫'}`,
      palace: trine2,
      isSelf: false,
    },
    {
      role: `${short}对宫·${opposite?.name.replace(/宫$/, '') ?? '对宫'} · ${opposite?.name ?? '对宫'}`,
      palace: opposite,
      isSelf: false,
    },
  ];
}

function formatSanFangPalaceBlock(palace: Palace, role: string, isSelf: boolean): string[] {
  const lines: string[] = [];
  const hasEmpty = palaceHasEmptyMajors(palace);

  if (hasEmpty && palace.borrowedStars?.length) {
    lines.push(`▍${role}：${palace.name}空宫`);
    lines.push(`（空宫，借对宫${palace.borrowedFromName?.replace(/宫$/, '') ?? '对宫'}：${palace.borrowedStars.join('、')}入事）`);
  } else {
    lines.push(`▍${role}：${formatStarList(palace.stars, true)}`);
  }

  if (isSelf) {
    for (const star of palace.stars.filter(s => s.type === 'major')) {
      const base = STAR_PALACE_LINE[star.name];
      const sihua = star.siHua ? SIHUA_EFFECT[star.name]?.[star.siHua] : undefined;
      if (base || sihua) {
        lines.push(`${star.name}（${brightnessLabel(star)}）：${[base, sihua].filter(Boolean).join(' ｜ ')}`);
      }
    }
  } else if (!hasEmpty) {
    for (const star of palace.stars.filter(s => s.type === 'major')) {
      const base = STAR_PALACE_LINE[star.name];
      const sihua = star.siHua ? SIHUA_EFFECT[star.name]?.[star.siHua] : undefined;
      if (base || sihua) {
        lines.push(`  ${star.name}（${brightnessLabel(star)}）：${[base, sihua].filter(Boolean).join(' ｜ ')}`);
      }
    }
  }

  lines.push(...luckyNotesForPalace(palace));
  lines.push('');
  return lines;
}

function buildTopicSanFang(chart: ZiweiChart, palace: Palace | undefined) {
  if (!palace) return '';
  const blocks: string[] = [];
  const links = topicPalaceLinks(chart, palace);

  for (const item of links) {
    if (!item.palace) continue;
    blocks.push(...formatSanFangPalaceBlock(item.palace, item.role, item.isSelf));
  }

  const trineStars = links
    .slice(1, 3)
    .flatMap(item => item.palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? []);
  const opposite = oppositePalace(chart, palace);
  const selfShort = formatPalaceShort(palace);
  const oppShort = formatPalaceShort(opposite);

  blocks.push(
    `▸ **本盘合参**：${palace.name.replace(/宫$/, '')}本宫【${selfShort}】为体、对宫【${oppShort}】为用 ｜ 三合会【${trineStars.join('、') || '无主星'}】——本命四化固定不动，吉凶看大限/流年引动。`,
  );
  return blocks.join('\n').trim();
}

function collectNatalSihua(chart: ZiweiChart) {
  return chart.palaces.flatMap(p =>
    p.stars.filter(s => s.siHua).map(star => ({ palace: p, star })),
  );
}

function buildTopicSihua(chart: ZiweiChart, palace: Palace | undefined, options?: OverviewAnalysisOptions) {
  if (!palace) return '';
  const topicShort = palace.name.replace(/宫$/, '');
  const focusBranches = new Set(
    topicPalaceLinks(chart, palace)
      .map(item => item.palace?.branch)
      .filter((b): b is number => typeof b === 'number'),
  );
  const lines: string[] = [];

  for (const { palace: hitPalace, star } of collectNatalSihua(chart)) {
    if (!focusBranches.has(hitPalace.branch)) continue;
    const effect = SIHUA_EFFECT[star.name]?.[star.siHua!];
    if (!effect) continue;
    const icon = star.siHua === '禄' ? '🟢' : star.siHua === '权' ? '🔵' : star.siHua === '科' ? '🟡' : '🔴';
    const hitShort = hitPalace.name.replace(/宫$/, '');
    const relation = hitPalace.branch === palace.branch
      ? `落${hitShort}`
      : hitPalace.branch === (palace.branch + 6) % 12
        ? `落${hitShort}·你${topicShort}的对宫`
        : `落${hitShort}`;
    lines.push(`${icon} **${star.name}化${star.siHua}**（${relation}）`, effect, '');
  }

  for (const item of topicPalaceLinks(chart, palace)) {
    if (!item.palace) continue;
    for (const star of item.palace.stars) {
      const key = `${star.name}在${palaceNoteLabel(item.palace.name)}`;
      const note = SIHUA_PALACE_NOTES[key as keyof typeof SIHUA_PALACE_NOTES];
      if (note) lines.push(`◇ **${key}**：${note}`);
    }
  }

  const temporal = buildTemporalSihuaAppendix(chart, options);
  if (temporal) {
    lines.push('', temporal);
  }

  return lines.join('\n').trim();
}

function buildRiskReminder(palace: Palace | undefined) {
  const risks: string[] = [
    '> 紫微斗数讲究阴阳互见，下方为基于本盘特征的中性提醒，知所警惕方能转危为安。',
    '',
  ];
  if (!palace) return risks.join('\n');

  const jiStars = palace.stars.filter(s => s.siHua === '忌').map(s => s.name);
  const shaStars = palace.stars.filter(s => s.type === 'sha').map(s => s.name);
  if (palaceHasEmptyMajors(palace)) {
    risks.push('◆ 本宫空宫，判断不宜只看本宫，必须合参对宫与三方四正，外部环境对结果影响更大。');
  }
  if (jiStars.length) {
    risks.push(`◆ 本宫见${jiStars.join('、')}化忌，遇大限流年引动时，相关主题容易出现阻滞、反复或口舌压力。`);
  }
  if (shaStars.length) {
    risks.push(`◆ 本宫会${shaStars.join('、')}等煞曜，宜避免急躁决策，凡事留证据、留余地。`);
  }
  if (risks.length === 2) {
    risks.push('◆ 本宫未见明显重煞，风险多来自大限、流年触发；平时以稳守节奏、避免过度消耗为要。');
  }
  return risks.join('\n');
}

function buildGenericBasis(topic: TopicKey, palace: Palace | undefined, stars: string[]) {
  if (!palace) return '';
  const starText = stars.length ? stars.join('、') : '空宫借星';
  return [
    `· 以【${TOPIC_PALACE_NAME[topic]}】为本宫，先取本宫主星【${starText}】定主题基调。`,
    '· 再合参本宫三方四正与对宫，判断外部环境、资源流向与事件触发点。',
    '· 本命四化固定不动，大限、流年、流月、流日、流时只负责引动，不改变本命底盘。',
  ].join('\n');
}

function buildGenericSource(topic: TopicKey, stars: string[]) {
  const starText = stars.length ? stars.join('、') : TOPIC_PALACE_NAME[topic];
  return [
    `· 本段主论来自本地星曜知识库中【${starText}】对应【${TOPIC_PALACE_NAME[topic]}】的宫位论断。`,
    '· 三方四正、四化路径与空宫借星部分由当前命盘结构实时推演生成。',
    '· 页面仅供紫微斗数学习参考，不作为医疗、投资、婚姻或法律决策依据。',
  ].join('\n');
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .match(/[^。！？.!?]+[。！？.!?]?/g)
    ?.map(s => s.trim())
    .filter(Boolean) ?? [];
}

function buildTopicOverview(topic: TopicKey, palace: Palace | undefined, stars: string[], parsed: ParsedDb) {
  const curated = lookupTopicStarOverview(topic, stars);
  if (curated) return curated;

  const palaceName = TOPIC_PALACE_NAME[topic];
  const starText = stars.length ? stars.join('、') : '空宫借星';
  const core = splitSentences(parsed.lundian).slice(0, 3).join('');
  const palaceText = palace
    ? `${palaceName}以【${starText}】定调，须合参本宫、对宫与三方四正一起看。`
    : `${palaceName}未能定位到明确宫位。`;
  const action = TOPIC_OVERVIEW_ACTION[topic] ?? '';
  return [core || palaceText, core ? palaceText : '', action].filter(Boolean).join('\n\n');
}

function buildEnrichedTopicText(
  chart: ZiweiChart,
  topic: TopicKey,
  baseText: string,
  stars: string[],
  options?: OverviewAnalysisOptions,
) {
  const palace = palaceByTopic(chart, topic);
  const parsed = parseDbMarkers(baseText);
  const primaryStar = stars[0] ?? '';

  const sihuaBody = buildTopicSihua(chart, palace, options);
  const parts = [
    section(`${TOPIC_LABEL[topic]}总览`, buildTopicOverview(topic, palace, stars, parsed)),
    section('一句话定调', parsed.dingdiao || `${TOPIC_PALACE_NAME[topic]}以${stars.join('、') || '本宫'}为主要气象，须合参三方四正。`),
    section('核心论断', buildCoreWithOverlays(primaryStar, parsed, chart, palace) || parsed.lundian || baseText),
    section('命盘推演', buildTopicTuiyan(chart, topic, palace, stars)),
    section('三方四正联动', buildTopicSanFang(chart, palace)),
    section(
      '四化路径分析 · 落到你这盘',
      sihuaBody || '本命四化在本主题三方四正网络内暂未形成显著引动，需结合大限、流年再看触发时机。',
    ),
    section('命盘依据', parsed.yiju || buildGenericBasis(topic, palace, stars)),
    section('经典出处', parsed.chuchu || buildGenericSource(topic, stars)),
    section('⚠️ 风险提醒', buildRiskReminder(palace)),
  ];

  let text = parts.filter(Boolean).join('\n\n');
  const combo = getComboContent(stars, topic);
  if (combo) {
    text += `\n\n---\n\n${formatComboAppend(combo)}`;
  }
  return text;
}

/** 按 topic 对应宫位主星取 STAR_DB 论断；overview 走生产全文组装 */
export function buildChartAnalysisText(
  chart: ZiweiChart,
  topic: TopicKey,
  options?: OverviewAnalysisOptions,
): string {
  if (topic === 'overview') {
    return buildOverviewAnalysisText(chart, options);
  }

  const stars = getTopicMainStars(chart, topic);
  const star = stars[0] ?? null;
  if (!star) {
    return `未能识别【${TOPIC_PALACE_NAME[topic]}】主星，请重新起盘后再试。`;
  }

  const gender = chart.birthInfo.gender;
  const text = getAnalysisText(star, topic, gender);
  if (text.trim()) {
    return buildEnrichedTopicText(chart, topic, text, stars, options);
  }
  return `暂无【${star}】在「${topic}」维度的库内论断，请稍后重试或换一话题。`;
}

export function buildAllTopicAnalysisTabs(
  chart: ZiweiChart,
  topics: TopicKey[],
  options?: OverviewAnalysisOptions,
): Record<string, string> {
  const tabs: Record<string, string> = {};
  for (const topic of topics) {
    tabs[topic] = buildChartAnalysisText(chart, topic, options);
  }
  return tabs;
}
