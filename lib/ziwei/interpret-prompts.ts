/**
 * AI 解读 Prompt — 从生产 InsightPanel TOPIC_PROMPTS + /api/interpret buildSystemPrompt 逆向合并
 */

export const TOPIC_PROMPTS: Record<string, string> = {
  overview: `请生成命格总览，按以下结构输出：

**【命格定性】**
用一句话概括这个命盘的核心格局与命主气质。

**【主星解读】**
命宫主星的核心特质，引用倪海夏原话或观点。

**【三方四正】**
财、官、迁三宫的联动分析及整体格局。

**【当前大限】**
当下大限运势方向与最值得关注的事项。

**【优势与注意】**
命盘天赋优势，以及需要注意的风险或功课。`,

  love: `请深度分析感情婚姻运，按以下结构输出：

**【感情格局】**
一句话定性感情命格。

**【夫妻宫分析】**
夫妻宫主星、四化，以及倪海夏体系的具体解读。

**【三方联动】**
相关宫位对感情的影响。

**【当前大限感情运】**
当下10年感情走向与关键节点。

**【实际建议】**
具体可行的感情建议。`,

  career: `请深度分析事业运，按以下结构输出：

**【事业格局】**
一句话定性事业命格，宜任职或宜创业。

**【官禄宫分析】**
官禄宫主星、四化，以及倪师对这种配置的判断。

**【财帛宫联动】**
财运与事业的关系，财路来源分析。

**【当前大限事业运】**
当下10年事业走向。

**【实际建议】**
适合的方向、行业与策略。`,

  wealth: `请深度分析财运，按以下结构输出：

**【财运格局】**
一句话定性财运模式，是主动财还是被动财。

**【财帛宫分析】**
财帛宫主星、四化，财富来源与流动模式。

**【田宅宫（财库）】**
积蓄能力与不动产运势分析。

**【当前大限财运】**
当下财运走向与注意事项。

**【理财建议】**
具体的财务建议。`,

  health: `请分析健康运势，按以下结构输出：

**【疾厄宫主星】**
疾厄宫星曜与健康含义。

**【主要风险】**
结合倪海夏子午流注理论，分析主要健康隐患与需关注的部位。

**【大限健康走势】**
当下健康趋势与关键时间段。

**【预防建议】**
具体注意事项与养生方向。`,

  personality: `请深度解析性格特质，按以下结构输出：

**【命宫主星性格】**
命宫主星的核心性格特质，引用倪师原话。

**【三方性格综合】**
财、官、迁三宫对性格的影响，全貌描绘。

**【人际关系模式】**
与他人互动方式、待人处世风格。

**【优势与人生课题】**
天赋优势，以及需要面对的人生功课。`,
};

export function buildSystemPrompt(chart: {
  birthInfo: { year: number; month: number; day: number; hour: number; gender: string; name?: string; city?: string; province?: string };
  lunarInfo: { lunarYear: number; lunarMonth: number; lunarDay: number; isLeapMonth?: boolean; yearStem?: number; yearBranch?: number };
  wuxingJuName: string;
  daXians?: Array<{ startAge: number; endAge: number; palaceName: string; palaceBranch?: number; siHua?: { lu: string; quan: string; ke: string; ji: string } }>;
  currentDaXianIndex: number;
  palaces?: Array<{
    name: string;
    branch: number;
    stem?: number;
    stars: Array<{ name: string; type: string; siHua?: string }>;
    selfSihua?: Array<{ starName: string; siHua: string }>;
    isEmpty?: boolean;
    borrowedFromName?: string;
  }>;
}): string {
  const { birthInfo, lunarInfo, wuxingJuName, daXians, currentDaXianIndex, palaces } = chart;

  const currentDaXian = daXians?.[currentDaXianIndex];
  const currentDaXianStr = currentDaXian
    ? `${currentDaXian.startAge}-${currentDaXian.endAge}岁（${currentDaXian.palaceName}宫）`
    : '暂无';

  const palaceLines = (palaces || []).map(p => {
    const majorStars = p.stars.filter(s => s.type === 'major').map(s => s.name).join('、') || '空宫';
    const minorStars = p.stars.filter(s => s.type === 'minor').map(s => s.name).join('、');
    const luckyStars = p.stars.filter(s => s.type === 'lucky').map(s => s.name).join('、');
    const selfSihua = p.selfSihua?.map(s => `${s.starName}化${s.siHua}`).join('、') || '';

    return `${p.name}（${p.branch}宫）:
  主星: ${majorStars}
  小星: ${minorStars || '无'}
  吉星: ${luckyStars || '无'}
  宫干自化: ${selfSihua || '无'}
  ${p.isEmpty ? `(空宫，借${p.borrowedFromName}宫)` : ''}`;
  }).join('\n');

  const daXianLines = (daXians || []).map((d, i) => {
    const label = i === currentDaXianIndex ? '★当前' : '';
    return `${label}${d.startAge}-${d.endAge}岁: ${d.palaceName}宫${d.siHua ? ` (化禄:${d.siHua.lu} 化权:${d.siHua.quan} 化科:${d.siHua.ke} 化忌:${d.siHua.ji})` : ''}`;
  }).join('\n');

  const birthPlace = [birthInfo.province, birthInfo.city].filter(Boolean).join(' ') || '未填';

  return `你是一位精通倪海夏正统紫微斗数的命理师，运用倪师《天纪》学术体系进行精准解读。

【命盘基本信息】
出生：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${birthInfo.hour}时（${birthInfo.gender === 'male' ? '男' : '女'}）
${birthInfo.name ? `姓名：${birthInfo.name}\n` : ''}出生地：${birthPlace}
农历：${lunarInfo.lunarYear}年${lunarInfo.isLeapMonth ? '闰' : ''}${lunarInfo.lunarMonth}月${lunarInfo.lunarDay}日
五行局：${wuxingJuName}

【当前大限】${currentDaXianStr}

【大限一览】
${daXianLines || '暂无'}

【十二宫分布】
${palaceLines || '暂无'}

【解读原则】
1. 严格遵循倪海夏《天纪》体系，以倪师原话和观点为依据，勿混用其他门派术语
2. 结合五行局特性，分析命局结构与三方四正联动
3. 四化飞化（化禄、化权、化科、化忌）须落到具体宫位与人生领域
4. 宫干自化是倪师体系核心，须重点解读其来因与应期
5. 回答具体、有深度，避免空泛套话；可引用古籍但须与盘面星曜对应
6. 用户选择话题（命格/感情/事业/财运/健康/性格）时，按 TOPIC 结构分节输出
7. 用户追问时结合上下文深化，可联动大限、流年、流月层次分析
8. 晚子时（23:00-23:59）按次日排盘，与盘面一致

【输出格式】
- 使用 **【标题】** 分节，每节 2-4 段
- 关键判断加粗，引用倪师观点时注明出处
- 结尾给出 1-3 条可执行建议

请根据以上命盘信息，以倪海夏正统紫微斗数体系进行解读。`;
}
