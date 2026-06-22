import type { ZiweiChart } from './types';
import {
  getAnalysisText,
  TOPIC_PALACE_NAME,
  TOPIC_LABEL,
  type TopicKey,
} from './db-analysis';
import { COMBO_REGISTRY } from '@/lib/seo/combo';
import type { ComboTopicContent, ComboTopicKey } from '@/lib/seo/combo-data.generated';
import { buildOverviewAnalysisText, type OverviewAnalysisOptions } from './overview-analysis';
import {
  LUCKY_STAR_PALACE,
  SECOND_MAJOR_DESC,
  SIHUA_EFFECT,
  STAR_PALACE_LINE,
} from './overview-knowledge';
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

const TOPIC_OVERVIEW_COPY: Partial<Record<TopicKey, Record<string, string>>> = {
  wealth: {
    天梁: '这盘财运以清财、专业财为主轴，不以暴富取胜，而是靠学识、服务、口碑和长期信誉慢慢累积。正财来自专业能力的变现，适合顾问咨询、教学培训、医疗法律、写作出版等路径；财富节奏偏慢热，中年后随声誉提升会更稳。守财能力不差，但容易因情义付出或原则过硬错过更好的机会；投资上宜稳健长期，不宜高风险投机。',
  },
  career: {
    '太阳|太阴': '这盘事业一边要名声与公众可见度，一边要财务规划和稳定经营。太阳落陷表示付出多、被看见得慢，太阴庙旺又能补上细腻、资源与长期积累，所以真正适合的是能建立专业形象的平台，而不是长期躲在幕后。贵人与机会多来自有地位的长辈或制度性平台；越重视诚信、口碑和持续曝光，事业越能带动收入。',
    太阳: '这盘事业重在被看见、被信任、被授权，适合站到台前承担责任，靠公开形象和持续付出来换取位置。太阳的事业路通常先劳后成，早期容易付出多、回报慢，但只要平台够大、口碑够稳，后期会因影响力而打开收入与资源。',
  },
  love: {
    '太阳|太阴': '这盘感情看夫妻宫空宫借对宫日月，关系里既要阳性的热情与担当，也要阴性的照顾与细腻。伴侣多带外向、事业心或公众形象，也可能重体面、重名誉；两人在外容易互相增光，回到关系里反而要学会放下盔甲。亲密关系需要真实与松弛，激情要沉淀成稳定陪伴才走得久。',
    太阳: '这盘感情需要光明、坦诚和担当，容易被积极、有责任感、带公众形象或事业心的人吸引。关系中的重点不是谁更强，而是能不能在外彼此成就、在内彼此放松；若只维持体面，亲密感会被消耗。',
  },
  personality: {
    天机: '这盘性格核心是聪明、机变、善分析，但也容易想得多、落地慢。兴趣广、入门快，适合参谋、顾问、策划、技术专家这类辅佐型位置；若硬扛一把手，容易被多变和反复评估拖住。中年后的关键不是再学更多，而是收敛到一两件事做深，把灵光变成可交付的本事。',
  },
  health: {
    '紫微|天相': '这盘健康重点在脾胃、中焦与压力管理，其次看心脑血管和睡眠。紫微属土，遇压力、面子受损或长期紧绷时，最容易先反映在消化和胃气上；天相同宫让身体更需要规律、秩序和稳定节奏。养生不宜走极端，饮食七分饱、少酒少油、稳定有氧，40岁后定期关注血压、血脂、血糖和心电图。',
    紫微: '这盘健康以脾胃、中焦和压力调节为先，越在意责任、名位和掌控感，身体越容易用消化、睡眠或心脑压力提醒你。真正的养生不是猛补猛练，而是规律饮食、稳定作息、适度运动，并在中年后把基础体检固定下来。',
  },
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

function oppositePalace(chart: ZiweiChart, palace: Palace | undefined) {
  if (!palace) return undefined;
  return chart.palaces.find(p => p.branch === (palace.branch + 6) % 12);
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

function formatPalaceMajorStars(palace: Palace | undefined): string {
  if (!palace) return '未识别';
  const majors = palace.stars.filter(s => s.type === 'major');
  if (majors.length > 0) return majors.map(formatStarToken).join('、');
  if (palace.borrowedStars?.length) return `${palace.name}空宫（借对宫${palace.borrowedFromName ?? ''}：${palace.borrowedStars.join('、')}入事）`;
  return `${palace.name}空宫`;
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
  return clean ? `**【${title}】**\n${clean}` : '';
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

function formatComboAnalysisText(content: ComboTopicContent): string {
  const sections = [
    ['一句话定调', content.dingdiao],
    ['核心论断', content.lundian],
    ['命盘依据', content.yiju],
    ['经典出处', content.chuchu],
  ] as const;

  return sections
    .filter(([, body]) => body.trim())
    .map(([title, body]) => `**【${title}】**\n${body.trim()}`)
    .join('\n\n');
}

function buildTopicTuiyan(chart: ZiweiChart, topic: TopicKey, palace: Palace | undefined, stars: string[]) {
  if (!palace) return '';
  const lines = [`本宫主星：${formatPalaceMajorStars(palace)}`];
  if (stars[1]) {
    const desc = SECOND_MAJOR_DESC[stars[1]] ?? STAR_PALACE_LINE[stars[1]] ?? '与本宫主星共同决定此主题的表现方式。';
    lines.push('', `同宫第二主星：**${stars[1]}**——${desc}`);
  }
  if (palace.isEmpty && palace.borrowedStars?.length) {
    lines.push('', `空宫借星：${TOPIC_PALACE_NAME[topic]}无主星，借对宫【${palace.borrowedFromName ?? '对宫'}】的${palace.borrowedStars.join('、')}入事。`);
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
      return note ? `✦ **${star.name}**：${note}` : '';
    })
    .filter(Boolean);
}

function topicPalaceLinks(chart: ZiweiChart, palace: Palace | undefined) {
  if (!palace) return [];
  return [
    { role: `本宫 · ${palace.name}`, palace },
    { role: `${palace.name}三合 · ${chart.palaces.find(p => p.branch === (palace.branch + 4) % 12)?.name ?? '三合宫'}`, palace: chart.palaces.find(p => p.branch === (palace.branch + 4) % 12) },
    { role: `${palace.name}三合 · ${chart.palaces.find(p => p.branch === (palace.branch + 8) % 12)?.name ?? '三合宫'}`, palace: chart.palaces.find(p => p.branch === (palace.branch + 8) % 12) },
    { role: `${palace.name}对宫 · ${chart.palaces.find(p => p.branch === (palace.branch + 6) % 12)?.name ?? '对宫'}`, palace: chart.palaces.find(p => p.branch === (palace.branch + 6) % 12) },
  ];
}

function buildTopicSanFang(chart: ZiweiChart, palace: Palace | undefined) {
  const blocks: string[] = [];
  for (const item of topicPalaceLinks(chart, palace)) {
    if (!item.palace) continue;
    blocks.push(`▍**${item.role}**：${formatPalaceMajorStars(item.palace)}`);
    for (const star of item.palace.stars.filter(s => s.type === 'major')) {
      const base = STAR_PALACE_LINE[star.name];
      const sihua = star.siHua ? SIHUA_EFFECT[star.name]?.[star.siHua] : undefined;
      if (base || sihua) blocks.push(`${star.name}（${brightnessLabel(star)}）：${[base, sihua].filter(Boolean).join(' ｜ ')}`);
    }
    blocks.push(...luckyNotesForPalace(item.palace), '');
  }
  if (palace) {
    const trineStars = topicPalaceLinks(chart, palace)
      .slice(1, 3)
      .flatMap(item => item.palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? []);
    const opposite = oppositePalace(chart, palace);
    blocks.push(
      `▸ **本盘合参**：${palace.name}本宫【${formatPalaceMajorStars(palace)}】为体、对宫【${formatPalaceMajorStars(opposite)}】为用 ｜ 三合会【${trineStars.join('、') || '无主星'}】——本命四化固定不动，吉凶看大限/流年引动。`,
    );
  }
  return blocks.join('\n').trim();
}

function collectNatalSihua(chart: ZiweiChart) {
  return chart.palaces.flatMap(p =>
    p.stars.filter(s => s.siHua).map(star => ({ palace: p, star })),
  );
}

function buildTopicSihua(chart: ZiweiChart, palace: Palace | undefined) {
  if (!palace) return '';
  const focusBranches = new Set(topicPalaceLinks(chart, palace).map(item => item.palace?.branch).filter((b): b is number => typeof b === 'number'));
  const lines: string[] = [];
  for (const { palace: hitPalace, star } of collectNatalSihua(chart)) {
    if (!focusBranches.has(hitPalace.branch) && !['禄', '权'].includes(star.siHua ?? '')) continue;
    const effect = SIHUA_EFFECT[star.name]?.[star.siHua!];
    if (!effect) continue;
    const icon = star.siHua === '禄' ? '🟢' : star.siHua === '权' ? '🔵' : star.siHua === '科' ? '🟡' : '🔴';
    const relation = hitPalace.branch === palace.branch
      ? `落${palace.name}`
      : `落${hitPalace.name}·引动${palace.name}`;
    lines.push(`${icon} **${star.name}化${star.siHua}**（${relation}）`, effect, '');
  }
  return lines.join('\n').trim();
}

function buildRiskReminder(palace: Palace | undefined) {
  if (!palace) return '';
  const risks: string[] = [];
  const jiStars = palace.stars.filter(s => s.siHua === '忌').map(s => s.name);
  const shaStars = palace.stars.filter(s => s.type === 'sha').map(s => s.name);
  if (jiStars.length) risks.push(`本宫见${jiStars.join('、')}化忌，遇大限流年引动时，相关主题容易出现阻滞、反复或口舌压力。`);
  if (shaStars.length) risks.push(`本宫会${shaStars.join('、')}等煞曜，宜避免急躁决策，凡事留证据、留余地。`);
  if (palace.isEmpty) risks.push('本宫为空宫，判断不宜只看本宫，必须合参对宫与三方四正，外部环境对结果影响更大。');
  if (!risks.length) risks.push('本宫未见明显重煞，风险多来自大限、流年触发；平时以稳守节奏、避免过度消耗为要。');
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

function topicOverviewCopy(topic: TopicKey, stars: string[]) {
  const copy = TOPIC_OVERVIEW_COPY[topic];
  if (!copy) return '';
  const exactKey = stars.join('|');
  return copy[exactKey] || copy[stars[0]] || '';
}

function buildTopicOverview(topic: TopicKey, palace: Palace | undefined, stars: string[], parsed: ParsedDb) {
  const matched = topicOverviewCopy(topic, stars);
  if (matched) return matched;

  const palaceName = TOPIC_PALACE_NAME[topic];
  const starText = stars.length ? stars.join('、') : '空宫借星';
  const core = splitSentences(parsed.lundian).slice(0, 4).join('');
  const palaceText = palace
    ? `${palaceName}落在${palace.name}，本宫主星取【${starText}】，实际呈现要把本宫、对宫与三方四正一起看。`
    : `${palaceName}未能定位到明确宫位。`;
  const action = TOPIC_OVERVIEW_ACTION[topic] ?? '';
  return [core || palaceText, core ? palaceText : '', action]
    .filter(Boolean)
    .join('\n');
}

function buildEnrichedTopicText(chart: ZiweiChart, topic: TopicKey, baseText: string, stars: string[]) {
  const palace = palaceByTopic(chart, topic);
  const parsed = parseDbMarkers(baseText);
  const parts = [
    section(`${TOPIC_LABEL[topic]}总览`, buildTopicOverview(topic, palace, stars, parsed)),
    section('一句话定调', parsed.dingdiao || `${TOPIC_PALACE_NAME[topic]}以${stars.join('、') || '本宫'}为主要气象，须合参三方四正。`),
    section('核心论断', parsed.lundian || baseText),
    section('命盘推演', buildTopicTuiyan(chart, topic, palace, stars)),
    section('三方四正联动', buildTopicSanFang(chart, palace)),
    section('四化路径分析 · 落到你这盘', buildTopicSihua(chart, palace)),
    section('命盘依据', parsed.yiju || buildGenericBasis(topic, palace, stars)),
    section('经典出处', parsed.chuchu || buildGenericSource(topic, stars)),
    section('风险提醒', buildRiskReminder(palace)),
  ];
  return parts.filter(Boolean).join('\n\n');
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
  const comboText = getComboContent(stars, topic);
  if (comboText) {
    return buildEnrichedTopicText(chart, topic, formatComboAnalysisText(comboText), stars);
  }

  const star = stars[0] ?? null;
  if (!star) {
    return `未能识别【${TOPIC_PALACE_NAME[topic]}】主星，请重新起盘后再试。`;
  }
  const gender = chart.birthInfo.gender;
  const text = getAnalysisText(star, topic, gender);
  if (text.trim()) return buildEnrichedTopicText(chart, topic, text, stars);
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
