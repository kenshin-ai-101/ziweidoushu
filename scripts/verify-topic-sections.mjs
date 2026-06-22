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

let failed = 0;
for (const topic of TOPICS) {
  const text = tabs[topic] ?? '';
  const headers = [...text.matchAll(/\*\*【([^】]+)】\*\*/g)].map(m => m[1]);
  const required = [
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
  const missing = required.filter(h => !headers.includes(h));
  const extra = headers.filter(h => !required.includes(h));
  if (missing.length || extra.length) {
    failed++;
    console.log(`✗ ${topic}`);
    if (missing.length) console.log('  missing:', missing.join(', '));
    if (extra.length) console.log('  extra:', extra.join(', '));
  } else {
    console.log(`✓ ${topic} (${headers.length} sections)`);
  }
}

if (failed) {
  console.log(`\n${failed} topic(s) failed`);
  process.exit(1);
}
console.log('\n✅ All 12 topics match production 9-section structure');
