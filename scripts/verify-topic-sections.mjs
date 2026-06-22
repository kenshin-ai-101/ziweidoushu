#!/usr/bin/env node
/**
 * 验证 12 个非 overview 主题均输出生产统一 9 段结构
 * 用法: node scripts/verify-topic-sections.mjs
 */
import { generateChart } from '../lib/ziwei/algorithm.ts';
import { buildAllTopicAnalysisTabs } from '../lib/ziwei/chart-analysis.ts';

const TOPIC_LABEL = {
  wealth: '财运',
  career: '事业',
  love: '感情',
  personality: '性格',
  health: '健康',
  family: '兄弟合伙',
  children: '子女',
  move: '迁移外出',
  friends: '人际贵人',
  home: '田宅',
  spirit: '福德',
  parents: '父母长辈',
};

const TOPICS = [
  'wealth', 'career', 'love', 'personality', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
];

const chart = generateChart({
  year: 1986,
  month: 9,
  day: 7,
  hour: 0,
  gender: 'male',
  longitude: 121.4,
});

const tabs = buildAllTopicAnalysisTabs(chart, TOPICS);

const HEALTH_EXTRA_SECTIONS = [
  '年干四化·关键宫位影响',
  '倪师疾厄论 · 宫位主轴',
  '星曜辅助 · 五行加重',
];

const HEALTH_FOOTER_MARKERS = [
  '## 🌿 倪师人纪方案参考',
  '## ⚙ 主辅煞组合精细论断',
  '【倪师《天纪》· 星曜法则】',
];

let failed = 0;
for (const topic of TOPICS) {
  const text = tabs[topic] ?? '';
  const headers = [...text.matchAll(/\*\*【([^】]+)】\*\*/g)].map(m => m[1]);
  const required = topic === 'health'
    ? [
        `${TOPIC_LABEL[topic]}总览`,
        '一句话定调',
        '核心论断',
        '命盘推演',
        '三方四正联动',
        ...HEALTH_EXTRA_SECTIONS,
        '命盘依据',
        '经典出处',
        '⚠️ 风险提醒',
      ]
    : [
        `${TOPIC_LABEL[topic]}总览`,
        '一句话定调',
        '核心论断',
        '命盘推演',
        '三方四正联动',
        '四化路径分析 · 落到你这盘',
        '命盘依据',
        '经典出处',
        '⚠️ 风险提醒',
      ];
  const hasSihua = headers.some(h => h.startsWith('四化路径'));
  const missing = required.filter(h => !headers.includes(h));
  if (topic !== 'health' && !hasSihua) {
    missing.push('四化路径（四化路径分析 · 落到你这盘 或 四化路径 · 你这盘）');
  }
  if (topic === 'health' && !hasSihua) {
    missing.push('四化路径（四化路径分析 · 落到你这盘 或 四化路径 · 你这盘）');
  }
  const missingFooter = topic === 'health'
    ? HEALTH_FOOTER_MARKERS.filter(m => !text.includes(m))
    : [];
  if (missing.length || missingFooter.length) {
    failed++;
    console.log(`✗ ${topic}`);
    if (missing.length) console.log('  missing:', missing.join(', '));
    if (missingFooter.length) console.log('  missing footer:', missingFooter.join(', '));
  } else {
    console.log(`✓ ${topic} (${headers.length} sections${topic === 'health' ? ' + health footer' : ''})`);
  }
}

if (failed) {
  console.log(`\n${failed} topic(s) failed`);
  process.exit(1);
}
console.log('\n✅ All 12 topics match production 9-section structure');
