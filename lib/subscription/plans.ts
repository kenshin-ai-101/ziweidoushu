/** Production parity — subscription pricing & benefit copy from wdyziweidoushu666.com/subscription */

export const PRO_LIST_PRICE_CENTS = 16800;
export const PRO_SALE_PRICE_CENTS = 14800;
export const PRO_DISCOUNT_LABEL = '88折';

export const FREE_DAILY_INTERPRET_QUOTA = Number.parseInt(
  process.env.AI_FREE_DAILY_QUOTA ?? '10',
  10,
);
export const PRO_DAILY_INTERPRET_QUOTA = Number.parseInt(
  process.env.AI_PRO_DAILY_QUOTA ?? '20',
  10,
);
export const FREE_DAILY_HEMING_QUOTA = Number.parseInt(
  process.env.HEMING_FREE_DAILY_QUOTA ?? '10',
  10,
);
export const PRO_DAILY_HEMING_QUOTA = Number.parseInt(
  process.env.HEMING_PRO_DAILY_QUOTA ?? '20',
  10,
);

export type BenefitIcon =
  | 'sparkle'
  | 'grid'
  | 'chat'
  | 'lock'
  | 'key'
  | 'compass'
  | 'mountain'
  | 'heart'
  | 'clock'
  | 'download'
  | 'book'
  | 'phone';

export interface PlanBenefit {
  icon: BenefitIcon;
  text: string;
}

export const FREE_PLAN_BENEFITS: PlanBenefit[] = [
  {
    icon: 'sparkle',
    text: '命盘 6 大核心维度：命盘总览 · 财务规划启示 · 事业发展方向 · 人际关系学习 · 性格特质认知 · 健康生活参考',
  },
  { icon: 'grid', text: '本命盘 + 大限流年 排盘' },
  { icon: 'chat', text: `AI 文化研读助手 · 每日 ${FREE_DAILY_INTERPRET_QUOTA} 次解读对话` },
  { icon: 'lock', text: 'AI 对话数据本地化 · 不上云，隐私不外流' },
];

export const PRO_PLAN_BENEFITS: PlanBenefit[] = [
  {
    icon: 'key',
    text: '全部解读项目解锁（再 +7 项：兄弟 · 子女 · 迁移 · 人际 · 田宅 · 福德 · 父母）',
  },
  { icon: 'clock', text: '全部排盘 · 本命 · 大限 · 流年 · 流月 · 流日 · 时辰' },
  { icon: 'sparkle', text: `AI 文化研读助手 · 每日 ${PRO_DAILY_INTERPRET_QUOTA} 次解读对话` },
  { icon: 'lock', text: 'AI 对话数据本地化 · 不上云，隐私不外流' },
  { icon: 'compass', text: '自接大模型（API Key）· 接入自有模型' },
  { icon: 'compass', text: '《天纪》：紫微斗数 · 易经 · 推命学 · 面相学 · 字理文化' },
  { icon: 'mountain', text: '《地纪》：风水地理 · 形势 · 理气 · 阳宅阴宅' },
  { icon: 'heart', text: '《人纪》：针灸 · 黄帝内经 · 神农本草 · 伤寒 · 金匮' },
  { icon: 'download', text: '紫微斗数全盘分析报告 · 完整下载（可自定义名称为「命盘分析报告」）' },
  { icon: 'book', text: '六部古籍 · 四层精解全开 + 倪师批注' },
  { icon: 'phone', text: '手机端 APP 专业版优先开放体验，数据同步（开发中，优先 iOS 平台上架）' },
];

export function formatPriceYuan(cents: number): string {
  return String(Math.round(cents / 100));
}
