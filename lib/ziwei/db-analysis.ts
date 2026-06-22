/**
 * lib/ziwei/db-analysis — 论断内容库
 *
 * STAR_DB：7 类自客户端 bundle 提取（含男女命）；6 类自生产 /knowledge/{slug}/{topic} SEO 页抓取（默认男命口径，女命暂同文）。
 */

import {
  STAR_DB as RAW_STAR_DB,
  COMBO_STAR_DB,
  type StarDbEntry,
  type GenderedText,
} from './star-db.generated';

export type TopicKey =
  | 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health'
  | 'family' | 'children' | 'move' | 'friends' | 'home' | 'spirit' | 'parents';

export const TOPIC_PALACE_NAME: Record<TopicKey, string> = {
  overview:    '命宫',
  personality: '命宫',
  love:        '夫妻',
  career:      '官禄',
  wealth:      '财帛',
  health:      '疾厄',
  family:      '兄弟',
  children:    '子女',
  move:        '迁移',
  friends:     '仆役',
  home:        '田宅',
  spirit:      '福德',
  parents:     '父母',
};

/** 生产 chart 页 e8 全量标签（tc） */
export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview:    '命格总览',
  personality: '性格',
  love:        '感情',
  career:      '事业',
  wealth:      '财运',
  health:      '健康',
  family:      '兄弟合伙',
  children:    '子女',
  move:        '迁移外出',
  friends:     '人际贵人',
  home:        '田宅',
  spirit:      '福德',
  parents:     '父母长辈',
};

/** 生产 chart 页 e5 — 免费层可见话题 */
export const CHART_TOPIC_TABS_MAIN: { key: TopicKey; label: string }[] = [
  { key: 'overview', label: TOPIC_LABEL.overview },
  { key: 'wealth', label: TOPIC_LABEL.wealth },
  { key: 'career', label: TOPIC_LABEL.career },
  { key: 'love', label: TOPIC_LABEL.love },
  { key: 'personality', label: TOPIC_LABEL.personality },
  { key: 'health', label: TOPIC_LABEL.health },
];

/** 生产 chart 页 e6 — 专业版话题 */
export const CHART_TOPIC_TABS_EXTENDED: { key: TopicKey; label: string }[] = [
  { key: 'family', label: TOPIC_LABEL.family },
  { key: 'children', label: TOPIC_LABEL.children },
  { key: 'move', label: TOPIC_LABEL.move },
  { key: 'friends', label: TOPIC_LABEL.friends },
  { key: 'home', label: TOPIC_LABEL.home },
  { key: 'spirit', label: TOPIC_LABEL.spirit },
  { key: 'parents', label: TOPIC_LABEL.parents },
];

export const CHART_TOPIC_TABS_ALL = [...CHART_TOPIC_TABS_MAIN, ...CHART_TOPIC_TABS_EXTENDED];

/** 生产 chart 页 e5 — 免费层可见话题 */
export const FREE_TOPIC_KEYS = new Set(CHART_TOPIC_TABS_MAIN.map(t => t.key));

/** 生产 chart 页 e4 — 宫位主管领域 */
export const PALACE_ROLES: Record<string, string> = {
  命宫: '自我、性格、先天格局',
  兄弟: '兄弟关系、合伙人',
  夫妻: '感情关系、婚姻状态',
  子女: '子女缘分、下属关系',
  财帛: '财运来源、收入方式',
  疾厄: '身体健康、意外',
  迁移: '外出机遇、人际格局',
  仆役: '朋友圈、贵人与小人',
  交友: '朋友圈、贵人与小人',
  官禄: '事业成就、社会地位',
  田宅: '不动产、家庭环境',
  福德: '精神享受、内心福分',
  父母: '父母关系、文书契约',
};

/** 生产 chart 页 e1 — 宫位名 → topic */
export const PALACE_TO_TOPIC: Record<string, TopicKey> = (() => {
  const map: Record<string, TopicKey> = {};
  for (const [topic, palace] of Object.entries(TOPIC_PALACE_NAME) as [TopicKey, string][]) {
    if (!(palace in map)) map[palace] = topic;
  }
  map['交友'] = 'friends';
  return map;
})();

/** 生产 chart 页 e3 — 可折叠段落标题 */
export const COLLAPSIBLE_SECTION_TITLES = [
  '命盘依据',
  '经典出处',
  '主辅煞组合',
  '主辅煞组合精细论断',
  '倪师人纪方案',
  '十四主星速查',
  '14 主星速查',
  '14主星速查',
];

/** TopicKey → star-db.generated 字段名 */
const TOPIC_TO_DB_FIELD: Record<TopicKey, keyof StarDbEntry> = {
  overview:    'mingGong',
  personality: 'personality',
  love:        'fuQi',
  career:      'guanLu',
  wealth:      'caiBo',
  health:      'jiE',
  family:      'xiongDi',
  children:    'ziNv',
  move:        'qianYi',
  friends:     'jiaoYou',
  home:        'tianZhai',
  spirit:      'fuDe',
  parents:     'fuMu',
};

export interface StarContent {
  mingGong?: string;
  personality?: string;
  fuQi?: string;
  xiongDi?: string;
  ziNv?: string;
  caiBo?: string;
  jiE?: string;
  qianYi?: string;
  jiaoYou?: string;
  guanLu?: string;
  tianZhai?: string;
  fuDe?: string;
  fuMu?: string;
}

function pickGendered(text: GenderedText | undefined, gender: 'male' | 'female'): string {
  if (!text) return '';
  return gender === 'female' ? (text.female || text.male) : (text.male || text.female);
}

/** 按性别展开 STAR_DB，供 SEO 知识页与盘面解读引用 */
export function getStarDbContent(star: string, gender: 'male' | 'female' = 'male'): StarContent {
  const raw = RAW_STAR_DB[star];
  if (!raw) return {};
  const out: StarContent = {};
  for (const [field, gendered] of Object.entries(raw) as [keyof StarDbEntry, GenderedText][]) {
    (out as Record<string, string>)[field] = pickGendered(gendered, gender);
  }
  return out;
}

/** 扁平 STAR_DB（默认男命），兼容 lib/seo/knowledge.ts */
export const STAR_DB: Record<string, StarContent> = Object.fromEntries(
  Object.keys(RAW_STAR_DB).map(star => [star, getStarDbContent(star, 'male')]),
);

export { COMBO_STAR_DB, RAW_STAR_DB };

/** 按 topic + 性别取论断文本 */
export function getAnalysisText(
  star: string,
  topic: TopicKey,
  gender: 'male' | 'female' = 'male',
): string {
  const field = TOPIC_TO_DB_FIELD[topic];
  const raw = RAW_STAR_DB[star]?.[field];
  return pickGendered(raw, gender);
}
