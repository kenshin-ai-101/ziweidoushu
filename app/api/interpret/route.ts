import { NextRequest } from 'next/server';
import { DeepSeekStream } from '@/lib/ai/stream';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { chart, messages } = await req.json();

    const systemPrompt = buildSystemPrompt(chart);

    const stream = await DeepSeekStream({
      systemPrompt,
      messages,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[/api/interpret]', err);
    return new Response(JSON.stringify({ error: '解读服务暂时不可用' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function buildSystemPrompt(chart: any): string {
  const { birthInfo, lunarInfo, wuxingJuName, daXians, currentDaXianIndex, palaces } = chart;

  const currentDaXian = daXians?.[currentDaXianIndex];
  const currentDaXianStr = currentDaXian
    ? `${currentDaXian.startAge}-${currentDaXian.endAge}岁（${currentDaXian.palaceName}宫）`
    : '暂无';

  const palaceLines = (palaces || []).map((p: any) => {
    const majorStars = p.stars.filter((s: any) => s.type === 'major').map((s: any) => s.name).join('、') || '空宫';
    const minorStars = p.stars.filter((s: any) => s.type === 'minor').map((s: any) => s.name).join('、');
    const luckyStars = p.stars.filter((s: any) => s.type === 'lucky').map((s: any) => s.name).join('、');
    const selfSihua = p.selfSihua?.map((s: any) => `${s.starName}化${s.siHua}`).join('、') || '';

    return `${p.name}（${p.branch}宫）:
  主星: ${majorStars}
  小星: ${minorStars || '无'}
  吉星: ${luckyStars || '无'}
  宫干自化: ${selfSihua || '无'}
  ${p.isEmpty ? `(空宫，借${p.borrowedFromName}宫)` : ''}`;
  }).join('\n');

  const daXianLines = (daXians || []).map((d: any, i: number) => {
    const label = i === currentDaXianIndex ? '★当前' : '';
    return `${label}${d.startAge}-${d.endAge}岁: ${d.palaceName}宫${d.siHua ? ` (化禄:${d.siHua.lu} 化权:${d.siHua.quan} 化科:${d.siHua.ke} 化忌:${d.siHua.ji})` : ''}`;
  }).join('\n');

  return `你是一位精通倪海夏正统紫微斗数的命理师，运用倪师学术体系进行精准解读。

【命盘基本信息】
出生：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${birthInfo.hour}时（${birthInfo.gender === 'male' ? '男' : '女'}）
农历：${lunarInfo.lunarYear}年${Math.abs(lunarInfo.lunarMonth)}月${lunarInfo.lunarDay}日${lunarInfo.isLeapMonth ? '（闰月）' : ''}
五行局：${wuxingJuName}

【当前大限】${currentDaXianStr}

【大限一览】
${daXianLines || '暂无'}

【十二宫分布】
${palaceLines || '暂无'}

【解读原则】
1. 严格遵循倪海夏学术体系，以倪师原话和观点为依据
2. 结合五行局特性，分析命局结构
3. 重点关注四化飞化（化禄、化权、化科、化忌）的实际影响
4. 宫干自化是倪师体系的核心，需重点解读
5. 回答要具体、有深度，避免泛泛而谈
6. 根据用户选择的话题（命格/感情/事业/财运/健康/性格）针对性解读
7. 用户追问时结合上下文深化分析

请根据以上命盘信息，以倪海夏正统紫微斗数体系进行解读。`;
}
