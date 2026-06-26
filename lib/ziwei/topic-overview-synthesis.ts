import { TOPIC_LABEL, TOPIC_PALACE_NAME, type TopicKey } from './db-analysis';
import { SECOND_MAJOR_DESC } from './overview-knowledge';
import { resolveStarArchetype, type StarArchetype } from './star-archetype';
import type { Palace, ZiweiChart } from './types';

export interface OverviewParsed {
  dingdiao: string;
  lundian: string;
}

const TOPIC_LUNDAN_KEYWORDS: Partial<Record<TopicKey, string[]>> = {
  wealth: ['财', '赚钱', '收入', '投资', '理财', '守财', '漏财', '化禄', '化忌', '聚', '散', '脑力'],
  career: ['事业', '职场', '工作', '职业', '创业', '平台', '跳槽', '官禄', '顾问', '参谋'],
  love: ['感情', '婚姻', '配偶', '夫妻', '伴侣', '恋爱', '晚婚', '分分合合'],
  personality: ['性格', '善变', '聪明', '兴趣', '宗教', '内心', '相貌', '思虑', '执行'],
  health: ['健康', '脏腑', '养生', '疾厄', '失眠', '焦虑', '肝胆', '神经'],
  family: ['兄弟', '合伙', '同辈', '手足'],
  children: ['子女', '生育', '教养', '创造力'],
  move: ['迁移', '外出', '远行', '异地', '出国'],
  friends: ['朋友', '贵人', '下属', '社交', '人际'],
  home: ['田宅', '房产', '家宅', '置业', '搬家'],
  spirit: ['福德', '精神', '情绪', '心灵', '宗教'],
  parents: ['父母', '长辈', '父亲', '母亲', '上司'],
};

const TOPIC_DOMAIN_LABEL: Partial<Record<TopicKey, string>> = {
  wealth: '财运与金钱观',
  career: '事业与职场路径',
  love: '感情与亲密关系',
  personality: '性格与命格气质',
  health: '身心状态',
  family: '兄弟合伙',
  children: '子女与创造力',
  move: '迁移与外出',
  friends: '人际与贵人',
  home: '田宅与家宅',
  spirit: '精神与内在福分',
  parents: '父母与长辈',
};

function splitSentences(text: string): string[] {
  return text
    .replace(/\*\*[^*]+\*\*/g, m => m.replace(/\*\*/g, ''))
    .split(/(?<=[。！？；])\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 4);
}

function extractBoldPhrase(text: string, fallback = '核心特质'): string {
  const m = text.match(/\*\*([^*]+)\*\*/);
  if (m) return m[1];
  const cleaned = text.replace(/[。！？；，、]/g, ' ').trim();
  const chunk = cleaned.split(/\s+/).find(p => p.length >= 2 && p.length <= 8);
  return chunk ?? fallback;
}

function thesisKey(dingdiao: string, archetype: StarArchetype | null): string {
  const fromDing = extractBoldPhrase(dingdiao, '').replace(/\*\*/g, '').trim();
  if (fromDing && fromDing.length <= 10 && !/女命|男命|此宫/.test(fromDing)) return fromDing;
  return archetype?.gist ?? archetype?.alias ?? '鲜明特点';
}

function toSecondPerson(text: string, stars: string[], palaceName?: string): string {
  let t = text.trim();
  if (!t) return '';

  for (const star of stars) {
    t = t.replace(new RegExp(`${star}者`, 'g'), '你');
    t = t.replace(new RegExp(`${star}守命者?`, 'g'), '你');
    t = t.replace(new RegExp(`${star}守${palaceName ?? '命'}`, 'g'), '你');
    t = t.replace(new RegExp(`命宫${star}`, 'g'), '你');
    t = t.replace(new RegExp(`${star}入${palaceName ?? '[^，。；]{1,4}'}`, 'g'), '你');
    t = t.replace(new RegExp(`${star}在${palaceName ?? '[^，。；]{1,4}'}`, 'g'), '你');
    t = t.replace(new RegExp(`${star}居${palaceName ?? '[^，。；]{1,4}'}`, 'g'), '你');
    t = t.replace(new RegExp(`${palaceName ?? '财帛宫'}${star}`, 'g'), `你的${TOPIC_DOMAIN_LABEL.wealth ?? '格局'}`);
  }

  t = t.replace(/命主/g, '你');
  t = t.replace(/其人/g, '你');
  t = t.replace(/此人/g, '你');
  t = t.replace(/守命者/g, '你');

  if (!/^你/.test(t) && stars.length > 0) {
    t = t.replace(new RegExp(`^${stars[0]}`), '你');
  }

  return t;
}

function isDefinitionSentence(sentence: string): boolean {
  if (sentence.length > 100) return true;
  if (/倪师明言|最适合辅佐|宜策划|主聪明机变/.test(sentence) && sentence.length > 60) return true;
  return false;
}

function dedupeSentences(sentences: string[]): string[] {
  const seen = new Set<string>();
  return sentences.filter(s => {
    const key = s.replace(/\s/g, '').slice(0, 24);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickLundianSentences(
  lundian: string,
  topic: TopicKey,
  max = 4,
): string[] {
  const sentences = splitSentences(lundian).filter(s => !isDefinitionSentence(s));
  if (sentences.length <= 1) return sentences;

  const keywords = TOPIC_LUNDAN_KEYWORDS[topic] ?? [];
  const body = sentences.slice(1);

  const scored = body.map(s => ({
    s,
    score: keywords.reduce((n, k) => n + (s.includes(k) ? 1 : 0), 0),
  }));

  const hits = scored.filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  if (hits.length >= 2) {
    return dedupeSentences(hits.slice(0, max).map(x => x.s));
  }

  return dedupeSentences(body.slice(0, max));
}

function extractWeaknessLine(lundian: string, stars: string[]): string {
  const patterns = ['考验', '弱点', '不宜', '最忌', '虎头蛇尾', '多变而无成', '博而不专', '想太多', '持久性不足', '钻牛角', '善变'];
  const hit = splitSentences(lundian).find(s =>
    !isDefinitionSentence(s)
    && s.length < 90
    && patterns.some(p => s.includes(p)),
  );
  return hit ? toSecondPerson(hit, stars) : '';
}

function extractInnerLine(lundian: string, stars: string[]): string {
  const patterns = ['内心世界', '内心', '感性', '理性', '宗教', '哲学', '命理', '灵性', '敏感'];
  const hit = splitSentences(lundian).find(s =>
    !isDefinitionSentence(s)
    && !/^感情上/.test(s.trim())
    && patterns.some(p => s.includes(p)),
  );
  return hit ? toSecondPerson(hit, stars) : '';
}

function extractStressLine(lundian: string, stars: string[], exclude = ''): string {
  const patterns = ['压力', '焦虑', '失眠', '思虑过重', '神经衰弱', '钻牛角'];
  const hit = splitSentences(lundian).find(s =>
    !isDefinitionSentence(s)
    && s !== exclude
    && !s.includes('想太多')
    && patterns.some(p => s.includes(p)),
  );
  return hit ? toSecondPerson(hit, stars) : '';
}

function extractDecisionLine(lundian: string, stars: string[]): string {
  const patterns = ['决策', '犹豫', '执行', '落地', '专注', '收敛', '拍板'];
  const hit = splitSentences(lundian).find(s =>
    patterns.some(p => s.includes(p)),
  );
  return hit ? toSecondPerson(hit, stars) : '';
}

function formatAdvantageLine(archetype: StarArchetype): string {
  const talent = extractBoldPhrase(archetype.advantage, archetype.gist);
  const tail = archetype.advantage.startsWith(talent)
    ? archetype.advantage.slice(talent.length).replace(/^[，、\s]+/, '')
    : archetype.advantage;
  return `最突出的天赋是**${talent}**——${tail}`;
}

function formatGrowthLine(archetype: StarArchetype, prefix = '成长方向'): string {
  const key = extractBoldPhrase(archetype.growth, '落地成长');
  const tail = archetype.growth.startsWith(key)
    ? archetype.growth.slice(key.length).replace(/^[，、\s]+/, '')
    : archetype.growth;
  return `${prefix}是**${key}**——${tail}`;
}

function expandGist(archetype: StarArchetype): string {
  const gistMap: Record<string, string> = {
    智星: '思维敏锐，洞察力强，善于分析和策划，在需要动脑的事情上往往能想到别人没想到的角度',
    贵星: '光明磊落，重视名誉与付出，在需要公众形象与担当的场合容易脱颖而出',
    财星: '务实果决，对资源与结果敏感，善于在变动中抓住可落地的机会',
    福星: '性情温和，懂得享受生活，在顺遂环境中能把福气慢慢积累成稳定感',
    将星: '果决敢为，不怕硬仗，在需要突破与冒险的情境里反而越战越勇',
  };
  return gistMap[archetype.alias] ?? `${archetype.gist}，气质鲜明`;
}

function formatTopicThesis(
  topic: TopicKey,
  dingdiao: string,
  stars: string[],
  archetype: StarArchetype | null,
): string {
  const key = thesisKey(dingdiao, archetype);
  const d = dingdiao.replace(/\*\*/g, '').trim();
  const youDing = toSecondPerson(d, stars, TOPIC_PALACE_NAME[topic]);

  switch (topic) {
    case 'wealth':
      return `你的财运格局**以「${key}」定调**，${youDing.endsWith('。') ? youDing : `${youDing}。`}`;
    case 'career':
      return `你的事业格局**以「${key}」为核心**，${youDing.endsWith('。') ? youDing : `${youDing}。`}`;
    case 'love': {
      const lead = youDing.replace(/。$/, '');
      return `你在感情上**有自己的节奏与标准**，${lead.endsWith('。') ? lead : `${lead}。`}`;
    }
    case 'personality':
      return stars.length >= 2
        ? `你是【${stars.join('、')}】坐命的人，${youDing.endsWith('。') ? youDing : `${youDing}。`}`
        : `你是天生的${archetype?.alias === '智星' ? '智多星' : `${archetype?.alias ?? '主星'}命格`}，${expandGist(archetype ?? { gist: '', alias: '', star: '', advantage: '', relation: '', growth: '' })}。`;
    case 'health':
      return `你的身心状态**与「${key}」的节律相连**，${youDing.endsWith('。') ? youDing : `${youDing}。`}`;
    default:
      return `你的${TOPIC_LABEL[topic]}总览**以「${key}」展开**，${youDing.endsWith('。') ? youDing : `${youDing}。`}`;
  }
}

function formatArchetypeBlock(
  topic: TopicKey,
  archetype: StarArchetype,
  palaceName: string,
  stars: string[],
): string[] {
  const lines: string[] = [];

  if (topic === 'wealth') {
    lines.push(formatAdvantageLine(archetype).replace('天赋', '赚钱天赋'));
    lines.push(`在金钱与人际的联动上，${archetype.relation}`);
  } else if (topic === 'career') {
    lines.push(`职场气质上，你是典型的「${archetype.alias}」路线——${archetype.advantage}`);
    lines.push(`${palaceName}坐${stars.join('、')}，${archetype.growth}`);
  } else if (topic === 'love') {
    lines.push(`感情互动里，${archetype.relation}`);
    lines.push(`关系里的成长功课是：${archetype.growth}`);
  } else if (topic === 'personality') {
    lines.push(formatAdvantageLine(archetype));
    lines.push(`人际上，${archetype.relation}`);
  } else {
    lines.push(`${palaceName}主星${stars.join('、')}，${archetype.advantage}`);
    lines.push(archetype.relation);
  }

  return lines;
}

function rephraseLundianInsights(
  lundian: string,
  topic: TopicKey,
  stars: string[],
  palaceName: string,
): string {
  const picked = pickLundianSentences(lundian, topic, 4);
  if (picked.length === 0) return '';

  return picked
    .map(s => toSecondPerson(s, stars, palaceName))
    .join('');
}

function formatSecondaryStarNote(starName: string): string {
  const desc = SECOND_MAJOR_DESC[starName];
  if (!desc) return `同宫见${starName}，会进一步调和主星气质，宜把两颗星的长处分工使用，而不是互相拉扯。`;
  return `同宫见${starName}，${desc}`;
}

function joinParts(parts: string[]): string {
  return parts.map(p => p.trim()).filter(Boolean).join('');
}

export interface RichMingOverviewOptions {
  /** 性格维度的论断，用于命格总览的个性化叙述（比命宫全文更口语） */
  personalityLundian?: string;
}

/** 命格总览：生产 OVERVIEW_INTRO 口径的多段第二人称叙述 */
export function buildRichMingOverview(
  chart: ZiweiChart,
  starNames: string[],
  palace: Palace | undefined,
  parsed: OverviewParsed,
  options?: RichMingOverviewOptions,
): string {
  const insightSource = options?.personalityLundian?.trim() || parsed.lundian;
  if (starNames.length === 0) return '';

  if (starNames.length >= 2) {
    const primary = resolveStarArchetype(chart, palace, starNames[0]);
    const secondary = resolveStarArchetype(chart, palace, starNames[1]);
    if (primary && secondary) {
      const weakness = extractWeaknessLine(insightSource, starNames);
      const inner = extractInnerLine(insightSource, starNames);
      const stress = extractStressLine(insightSource, starNames, weakness);
      return joinParts([
        `你是${starNames.join('')}同宫的人，兼具${primary.alias}与${secondary.alias}的双重气质，${expandGist(primary)}。`,
        formatAdvantageLine(primary),
        weakness
          ? `性格上的弱点体现在：${weakness}`
          : `需要留意的课题是：${secondary.advantage !== primary.advantage ? secondary.growth : primary.growth}`,
        `人际上，${primary.relation}`,
        inner ? `内心世界${inner.replace(/^你/, '上你')}` : '',
        stress ? `面对压力时，${stress}` : '',
        extractDecisionLine(insightSource, starNames)
          ? `决策上，${extractDecisionLine(insightSource, starNames)}`
          : '决策上你偏谨慎，善于权衡，但在真正需要拍板的时刻容易犹豫，需要一个能帮你推一把的人或环境。',
        formatGrowthLine(primary),
        formatSecondaryStarNote(starNames[1]),
      ]);
    }
  }

  const archetype = resolveStarArchetype(chart, palace, starNames[0]);
  if (!archetype) return '';

  const weakness = extractWeaknessLine(insightSource, starNames);
  const inner = extractInnerLine(insightSource, starNames);
  const stress = extractStressLine(insightSource, starNames, weakness);
  const decision = extractDecisionLine(insightSource, starNames);
  const insights = rephraseLundianInsights(insightSource, 'personality', starNames, '命宫');
  const used = new Set([weakness, inner, stress, decision].filter(Boolean).map(s => s.slice(0, 20)));

  const extraInsights = splitSentences(insights)
    .filter(s => !used.has(s.slice(0, 20)))
    .join('');

  return joinParts([
    `你是天生的${archetype.alias === '智星' ? '智多星' : `${archetype.alias}命格`}，${expandGist(archetype)}。`,
    formatAdvantageLine(archetype),
    weakness ? `性格上的弱点体现在：${weakness}` : '',
    `人际上，${archetype.relation}`,
    inner ? `内心世界${inner.replace(/^你/, '上你')}` : '',
    stress ? `面对压力时，${stress}` : '',
    decision ? `决策上，${decision}` : '',
    extraInsights,
    formatGrowthLine(archetype),
  ]);
}

/** 各主题「{topic}总览」：第二人称深度叙述，结构对齐生产 curated 口径 */
export function buildRichTopicOverview(
  chart: ZiweiChart,
  topic: TopicKey,
  palace: Palace | undefined,
  stars: string[],
  parsed: OverviewParsed,
): string {
  const primary = stars[0];
  if (!primary) return '';

  const archetype = resolveStarArchetype(chart, palace, primary);
  if (!archetype) return '';

  const palaceName = TOPIC_PALACE_NAME[topic];
  const parts: string[] = [];

  parts.push(formatTopicThesis(topic, parsed.dingdiao, stars, archetype));
  parts.push(...formatArchetypeBlock(topic, archetype, palaceName, stars));

  const weakness = extractWeaknessLine(parsed.lundian, stars);
  if (weakness && (topic === 'personality' || topic === 'health')) {
    parts.push(`需要留意的课题是：${weakness}`);
  }

  const insights = rephraseLundianInsights(parsed.lundian, topic, stars, palaceName);
  if (insights) parts.push(insights);

  if (stars.length > 1) {
    parts.push(formatSecondaryStarNote(stars[1]));
  }

  const weaknessRisk = extractWeaknessLine(parsed.lundian, stars);
  if (weaknessRisk && topic !== 'personality' && topic !== 'health') {
    parts.push(`需要留意的风险是：${weaknessRisk}`);
  }

  const growthKey = extractBoldPhrase(archetype.growth, '长期成长');
  parts.push(`长期看，**${growthKey}**是你在这方面的关键——${
    archetype.growth.startsWith(growthKey)
      ? archetype.growth.slice(growthKey.length).replace(/^[，、\s]+/, '')
      : archetype.growth
  }`);

  return joinParts(parts);
}
