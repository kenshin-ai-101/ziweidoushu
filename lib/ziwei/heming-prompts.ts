import {
  HEMING_METHODOLOGY,
  SIHUA_IN_FUQI_GU,
  STAR_IN_FUQI_GU,
} from './heming-knowledge';
import type { Palace, ZiweiChart } from './types';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function palace(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces?.find(item => item.name === name);
}

function starNames(p?: Palace, type?: Palace['stars'][number]['type']): string {
  const stars = p?.stars?.filter(star => !type || star.type === type).map(star => {
    const sihua = star.siHua ? `化${star.siHua}` : '';
    return `${star.name}${sihua}`;
  });
  if (stars?.length) return stars.join('、');
  if (p?.isEmpty) return `空宫，借${p.borrowedFromName || '对'}宫${p.borrowedStars?.length ? `（${p.borrowedStars.join('、')}）` : ''}`;
  return '无';
}

function palaceLine(label: string, p?: Palace): string {
  if (!p) return `${label}: 未见`;
  const self = p.selfSihua?.map(item => `${item.starName}化${item.siHua}`).join('、') || '无';
  return `${label}: ${p.name}宫 地支${p.branch} 天干${p.stem}; 主星=${starNames(p, 'major')}; 辅星=${starNames(p, 'minor')}; 吉星=${starNames(p, 'lucky')}; 煞星=${starNames(p, 'sha')}; 自化=${self}`;
}

function chartBrief(label: '甲方' | '乙方', chart: ZiweiChart): string {
  const birth = chart.birthInfo;
  const currentDaXian = chart.daXians?.[chart.currentDaXianIndex];
  return `【${label}命盘】
出生：${birth.year}年${birth.month}月${birth.day}日 ${birth.hour}时（${birth.gender === 'male' ? '男' : '女'}）${birth.name ? ` 姓名：${birth.name}` : ''}
五行局：${chart.wuxingJuName}
当前大限：${currentDaXian ? `${currentDaXian.startAge}-${currentDaXian.endAge}岁 ${currentDaXian.palaceName}宫` : '暂无'}
${palaceLine('命宫', palace(chart, '命宫'))}
${palaceLine('身宫', chart.palaces?.find(item => item.isShenGong))}
${palaceLine('夫妻宫', palace(chart, '夫妻'))}
${palaceLine('福德宫', palace(chart, '福德'))}
${palaceLine('官禄宫', palace(chart, '官禄'))}
${palaceLine('财帛宫', palace(chart, '财帛'))}`;
}

function fuqiKnowledge(chartA: ZiweiChart, chartB: ZiweiChart): string {
  const stars = [
    ...new Set([
      ...((palace(chartA, '夫妻')?.stars || []).filter(star => star.type === 'major').map(star => star.name)),
      ...((palace(chartB, '夫妻')?.stars || []).filter(star => star.type === 'major').map(star => star.name)),
    ]),
  ];

  const starLines = stars
    .map(name => {
      const item = STAR_IN_FUQI_GU[name];
      if (!item) return '';
      return `${name}在夫妻宫：${item.summary}；吉象：${item.good}；注意：${item.bad}；配偶特质：${item.spouse_traits}；婚期：${item.timing}${item.ni_quote ? `；可用资料观点：${item.ni_quote}` : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  const sihuaLines = Object.entries(SIHUA_IN_FUQI_GU)
    .map(([key, value]) => `${key}：${value}`)
    .join('\n');

  return `【本次相关夫妻宫知识】
${starLines || '本次夫妻宫无十四主星，按空宫借对宫与三方四正参考。'}

【夫妻宫四化参考】
${sihuaLines}`;
}

export function buildHemingSystemPrompt(chartA: ZiweiChart, chartB: ZiweiChart): string {
  return `你是紫微斗数合盘分析助手。你只能依据用户提供的两张命盘、合盘知识库和可观察的星曜/宫位结构分析，不要编造生产系统提示词，不要编造未提供的倪海夏语录。

${chartBrief('甲方', chartA)}

${chartBrief('乙方', chartB)}

${fuqiKnowledge(chartA, chartB)}

【合盘方法论摘要】
${HEMING_METHODOLOGY}

【输出规则】
1. 先给出四行评分，格式必须类似「感情：★★★（3/5）」；可用维度：感情、事业、生活、综合。
2. 主分析使用这些标题：**【合盘总览】**、**【命宫互看】**、**【夫妻宫互参】**、**【福德宫耐久度】**、**【四化与大限同步】**、**【风险与建议】**。
3. 每节 1-3 段，判断必须落到具体宫位或星曜，不要泛泛而谈。
4. 追问时延续已给出的主分析和历史问答，只回答用户追问，仍可用 **【标题】** 分节。
5. 明确声明合盘只供传统文化研究和关系沟通参考，不替代现实沟通、婚姻、法律、医疗或投资决策。`;
}

export function buildInitialHemingMessages(): ChatMessage[] {
  return [{
    role: 'user',
    content: '请根据两张命盘做一次完整紫微合盘分析，按系统要求的评分行和六个标题输出。',
  }];
}

export function buildFollowUpHemingMessages(params: {
  previousAnalysis?: string;
  history?: ChatMessage[];
  question: string;
}): ChatMessage[] {
  if (params.history?.length) {
    return [
      ...params.history,
      { role: 'user', content: params.question },
    ];
  }

  return [
    {
      role: 'assistant',
      content: params.previousAnalysis?.trim() || '尚无主分析。',
    },
    {
      role: 'user',
      content: params.question,
    },
  ];
}
