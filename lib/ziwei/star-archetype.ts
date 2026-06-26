import { TOPIC_LABEL, TOPIC_PALACE_NAME, type TopicKey } from './db-analysis';
import type { Palace, Star, ZiweiChart } from './types';
import {
  STAR_ARCHETYPE_BRIGHTNESS,
  STAR_ARCHETYPES,
  type StarArchetype,
} from './star-archetype.generated';

export type { StarArchetype } from './star-archetype.generated';
export { STAR_ARCHETYPES, STAR_ARCHETYPE_BRIGHTNESS, CHART_SYSTEM_NOTES, CHART_SIHUA_NOTES } from './star-archetype.generated';

function isBrightStar(star?: Star): boolean {
  if (!star) return false;
  return star.brightness === 'bright' || ['庙', '旺'].includes(star.brightnessLabel ?? '');
}

function isDimStar(star?: Star): boolean {
  if (!star) return false;
  return star.brightness === 'dim' || ['陷', '不'].includes(star.brightnessLabel ?? '');
}

function findStarInPalace(palace: Palace | undefined, starName: string): Star | undefined {
  return palace?.stars.find(s => s.name === starName);
}

/** 生产口径：按宫位主星 + 庙旺利陷解析 archetype */
export function resolveStarArchetype(
  chart: ZiweiChart,
  palace: Palace | undefined,
  starName: string,
): StarArchetype | null {
  const base = STAR_ARCHETYPES[starName];
  if (!base) return null;

  const star = findStarInPalace(palace, starName)
    ?? chart.palaces.find(p => p.branch === ((palace?.branch ?? chart.mingGongBranch) + 6) % 12)
      ?.stars.find(s => s.name === starName);

  const variant = STAR_ARCHETYPE_BRIGHTNESS[starName];
  if (!variant) return { ...base };

  if (isBrightStar(star) && variant.bright) {
    return { ...base, ...variant.bright };
  }
  if (isDimStar(star) && variant.dim) {
    return { ...base, ...variant.dim };
  }
  return { ...base };
}

function joinParagraph(parts: string[]) {
  return parts.map(p => p.trim()).filter(Boolean).join(' ');
}

/** 命格总览：第二人称个性化开场（生产 e9 archetype 口径） */
export function buildMingOverviewFromArchetype(
  chart: ZiweiChart,
  starNames: string[],
  palace?: Palace,
): string {
  if (starNames.length === 0) return '';

  if (starNames.length >= 2) {
    const primary = resolveStarArchetype(chart, palace, starNames[0]);
    const secondary = resolveStarArchetype(chart, palace, starNames[1]);
    if (primary && secondary) {
      return joinParagraph([
        `你是${starNames.join('')}同宫的人，兼具${primary.alias}与${secondary.alias}的双重气质。`,
        primary.advantage,
        secondary.advantage !== primary.advantage ? secondary.advantage : '',
        primary.relation,
        primary.growth,
      ]);
    }
  }

  const archetype = resolveStarArchetype(chart, palace, starNames[0]);
  if (!archetype) return '';

  return joinParagraph([
    `你是${archetype.alias}入命的人。`,
    archetype.advantage,
    archetype.relation,
    archetype.growth,
  ]);
}

const TOPIC_OVERVIEW_BUILDERS: Partial<Record<TopicKey, (
  archetype: StarArchetype,
  palaceName: string,
  stars: string[],
) => string>> = {
  personality: (a, _palaceName, stars) => joinParagraph([
    `你是【${stars.join('、')}】坐命的人。`,
    a.advantage,
    a.relation,
    a.growth,
  ]),
  love: (a, palaceName, stars) => joinParagraph([
    `你在感情上**有自己的节奏与标准**。`,
    `${palaceName}主星为${stars.join('、')}，`,
    a.relation,
    a.growth,
  ]),
  wealth: (a, palaceName, stars) => joinParagraph([
    `你的财运格局**以${stars[0]}定调**。`,
    `${palaceName}见${stars.join('、')}，`,
    a.advantage,
    a.relation,
  ]),
  career: (a, palaceName, stars) => joinParagraph([
    `你的事业格局**以「${a.alias}」的气象展开**。`,
    `${palaceName}坐${stars.join('、')}，`,
    a.advantage,
    a.growth,
  ]),
  health: (a, palaceName, stars) => joinParagraph([
    `你的身心状态**与${stars.join('、')}的节律相连**。`,
    `${palaceName}主星${stars.join('、')}，`,
    a.growth,
    a.advantage,
  ]),
  family: (a, palaceName, stars) => joinParagraph([
    `你在兄弟合伙与人际协作上，`,
    `${palaceName}的${stars.join('、')}让你`,
    a.relation,
    a.advantage,
  ]),
  children: (a, palaceName, stars) => joinParagraph([
    `子女与创造力议题上，`,
    `${palaceName}见${stars.join('、')}，`,
    a.relation,
    a.growth,
  ]),
  move: (a, palaceName, stars) => joinParagraph([
    `迁移外出是你的重要舞台。`,
    `${palaceName}坐${stars.join('、')}，`,
    a.advantage,
    a.relation,
  ]),
  friends: (a, palaceName, stars) => joinParagraph([
    `人际贵人与朋友圈层上，`,
    `${palaceName}的${stars.join('、')}使你`,
    a.relation,
    a.advantage,
  ]),
  home: (a, palaceName, stars) => joinParagraph([
    `田宅与家族根基上，`,
    `${palaceName}见${stars.join('、')}，`,
    a.advantage,
    a.relation,
  ]),
  spirit: (a, palaceName, stars) => joinParagraph([
    `精神与内在福分上，`,
    `${palaceName}坐${stars.join('、')}，`,
    a.relation,
    a.growth,
  ]),
  parents: (a, palaceName, stars) => joinParagraph([
    `父母长辈与文书契约上，`,
    `${palaceName}主星${stars.join('、')}，`,
    a.relation,
    a.advantage,
  ]),
};

/** 各主题「{topic}总览」：个性化第二人称，不复用核心论断原文 */
export function buildTopicOverviewFromArchetype(
  chart: ZiweiChart,
  topic: TopicKey,
  palace: Palace | undefined,
  stars: string[],
): string {
  const primary = stars[0];
  if (!primary) return '';

  const archetype = resolveStarArchetype(chart, palace, primary);
  if (!archetype) return '';

  const builder = TOPIC_OVERVIEW_BUILDERS[topic];
  if (!builder) return '';

  const palaceName = TOPIC_PALACE_NAME[topic];
  const body = builder(archetype, palaceName, stars);
  const label = TOPIC_LABEL[topic];
  if (!body) return '';

  return body.startsWith('你的') || body.startsWith('你是') || body.startsWith('你在')
    ? body
    : `你的${label}总览：${body}`;
}
