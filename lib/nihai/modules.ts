import type { NiModule, SanJiCategory } from './types';
import { TIANJI_MODULES } from './tianji';
import { DIJI_MODULES } from './diji';
import { RENJI_MODULES } from './renji';

const TIANJI_ORDER = ['ziwei', 'yijing', 'kanyu', 'tuiming', 'mianxiang', 'tianxiang', 'cezi', 'liuren'];

const CATEGORY_MAP = {
  tianji: { key: 'tianji' as const, name: '天纪', meaning: '上知天文', href: '/tianji' },
  diji: { key: 'diji' as const, name: '地纪', meaning: '下知地理', href: '/diji' },
  renji: { key: 'renji' as const, name: '人纪', meaning: '中知人事', href: '/renji' },
};

export const EXTRA_TIANJI_MODULES: NiModule[] = [
  {
    id: 'tj-tianxiang',
    category: 'tianji',
    name: '天象学',
    nameEn: 'Tian Xiang Xue',
    subtitle: '28宿七政 · 观天识变',
    description: '天文现象与古代历法体系研究。',
    details: [],
    school: '28宿七政',
    lessons: '天纪课程穿插讲解',
    references: [],
    keywords: [],
    icon: '☆',
    status: 'active',
    order: 7,
    slug: 'tianxiang',
    chapters: Array.from({ length: 7 }, (_, i) => ({
      id: `tj-tx-${i + 1}`,
      title: `天象学章节 ${i + 1}`,
      description: '',
      keyPoints: [],
      order: i + 1,
    })),
  },
  {
    id: 'tj-liuren',
    category: 'tianji',
    name: '六壬掐指法',
    nameEn: 'Liu Ren Qia Zhi Fa',
    subtitle: '掐指速算 · 心血来潮即断',
    description: '六壬学传统应用的知识体系。',
    details: [],
    school: '六壬',
    lessons: '天纪课程穿插讲解',
    references: [],
    keywords: [],
    icon: '✋',
    status: 'active',
    order: 8,
    slug: 'liuren',
    chapters: Array.from({ length: 9 }, (_, i) => ({
      id: `tj-lr-${i + 1}`,
      title: `六壬掐指法章节 ${i + 1}`,
      description: '',
      keyPoints: [],
      order: i + 1,
    })),
  },
];

export const ALL_TIANJI_MODULES: NiModule[] = [...TIANJI_MODULES, ...EXTRA_TIANJI_MODULES].sort(
  (a, b) => TIANJI_ORDER.indexOf(a.slug) - TIANJI_ORDER.indexOf(b.slug),
);

export const ALL_SANJI_MODULES: NiModule[] = [
  ...ALL_TIANJI_MODULES,
  ...DIJI_MODULES,
  ...RENJI_MODULES,
];

const productionChapterLabels: Record<string, Record<string, string>> = {
  tianji: {
    ziwei: '4 章节 · 三合派',
    yijing: '9 章节 · 象数派',
    kanyu: '8 章节 · 九星派（杨救贫流派）',
    tuiming: '10 章节 · 河洛数理派',
    mianxiang: '14 章节 · 五形面相',
    tianxiang: '7 章节',
    cezi: '6 章节 · 传统测字',
    liuren: '9 章节',
  },
};

const productionCardCopy: Record<string, Record<string, { pre?: string; subtitle: string }>> = {
  tianji: {
    ziwei: { subtitle: '学习命盘星曜宫位体系架构\n三合派 · 倪师正宗体系' },
    yijing: { subtitle: '易经卦象与事物关系的文化研读\n象数派 · 断易天机' },
    kanyu: { subtitle: '风水堪舆理论与空间营造原理研读\n九星派 · 杨救贫流派' },
    tuiming: { subtitle: '数字学与易学理论的传统应用研究\n河洛数理派 · 子平法' },
    mianxiang: { subtitle: '面相学特征识别与传统人文学原理\n五形论 · 命相同参' },
    tianxiang: { subtitle: '天文现象与古代历法体系研究\n28宿七政 · 观天识变' },
    cezi: { subtitle: '字理文化与汉字形义的学问研读\n拆字法 · 会意法' },
    liuren: { subtitle: '六壬学传统应用的知识体系\n掐指速算 · 心血来潮即断' },
  },
  diji: {
    geography: { subtitle: '以风水读懂一国的命运' },
    'kanyu-theory': { subtitle: '理气与峦头的根基' },
    legacy: { subtitle: '薪火相传 · 后人补注' },
  },
  renji: {
    zhenjiu: { pre: '第 1 课', subtitle: '经络穴位 · 入门第一课' },
    neijing: { pre: '第 2 课', subtitle: '中医理论 · 思维根基' },
    bencao: { pre: '第 3 课', subtitle: '药物学 · 记住每味药的脾性' },
    shanghan: { pre: '第 4 课', subtitle: '辨证论治 · 真正治病的方法' },
    jingui: { pre: '第 5 课', subtitle: '杂病诊治 · 实战集大成' },
  },
};

const displayIcons: Record<string, string> = {
  tianxiang: '☆',
  liuren: '✋',
  neijing: '☯',
};

type NextStep = { href: string; title: string; desc: string };

const nextStepsBySlug: Record<string, NextStep[]> = {
  ziwei: [
    { href: '/knowledge', title: '系统精读 · 星曜与格局', desc: '14 主星 × 12 宫位 × 37 格局，逐项白话精解 —— 把纲要里的概念一个个学透' },
    { href: '/library', title: '研读古籍原典 · 四层精解', desc: '《骨髓赋》《全书》《全集》逐句 —— 白话直译 · 义理阐发 · 实占应用 · 融会贯通' },
    { href: '/chart', title: '亲手起一张命盘 · 实操验证', desc: '把学到的星曜·宫位·四化套到真实命盘上跑一遍 —— 免费起盘，边看边学' },
  ],
  geography: [
    { href: '/library', title: '研读古籍原典 · 四层精解', desc: '《葬书》《青囊经》逐句四层精解 —— 形势与理气两大祖经' },
  ],
  zhenjiu: [
    { href: '/library', title: '研读古籍原典 · 四层精解', desc: '《黄帝内经·素问》逐段四层精解 —— 作传统医学文化研读' },
  ],
};

const defaultLibraryStep: NextStep = {
  href: '/library',
  title: '研读古籍原典 · 四层精解',
  desc: '《骨髓赋》《全书》《全集》逐句 —— 白话直译 · 义理阐发 · 实占应用 · 融会贯通',
};

const disclaimers: Record<SanJiCategory, string> = {
  tianji: '本学科作中华传统命理 / 堪舆文化研读，重义理传承与思维方法 —— 不作吉凶祸福承诺，理性看待，仅供学习参考。',
  diji: '本学科作中华传统命理 / 堪舆文化研读，重义理传承与思维方法 —— 不作吉凶祸福承诺，理性看待，仅供学习参考。',
  renji: '本学科作中华传统医学文化经典研读，重义理源流 —— 不构成任何诊疗建议、不开方、不承诺疗效。身体不适请及时就医、遵医嘱。',
};

export function getModuleBySlug(slug: string): NiModule | null {
  return ALL_SANJI_MODULES.find(module => module.slug === slug) ?? null;
}

export function getCategoryConfig(category: SanJiCategory) {
  return CATEGORY_MAP[category];
}

export function getSiblingModules(module: NiModule): NiModule[] {
  const pool = module.category === 'tianji'
    ? ALL_TIANJI_MODULES
    : module.category === 'diji'
      ? DIJI_MODULES
      : RENJI_MODULES;
  return pool.filter(item => item.slug !== module.slug);
}

export function getModuleSceneSrc(category: SanJiCategory, slug: string) {
  return `/images/scenes/${category}/${slug}.webp`;
}

export function getModuleDisplayIcon(module: NiModule) {
  return displayIcons[module.slug] ?? module.icon;
}

export function getModuleCardSubtitle(module: NiModule) {
  const copy = productionCardCopy[module.category]?.[module.slug];
  if (!copy) return module.subtitle;
  const [line1, line2] = copy.subtitle.split('\n');
  return line2 ?? line1;
}

export function getModuleChapterCount(module: NiModule) {
  const label = productionChapterLabels[module.category]?.[module.slug];
  const match = label?.match(/^(\d+)\s*章节/);
  if (match) return Number(match[1]);
  return module.chapters.length;
}

export function getModuleNextSteps(module: NiModule): NextStep[] {
  return nextStepsBySlug[module.slug] ?? [defaultLibraryStep];
}

export function getModuleDisclaimer(category: SanJiCategory) {
  return disclaimers[category];
}
