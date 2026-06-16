import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { chartA, chartB, question } = await req.json() as {
      chartA: ZiweiChart;
      chartB: ZiweiChart;
      question?: string;
    };

    const text = buildLocalHeming(chartA, chartB, question);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunkText(text, 42)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: chunk } })}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 8));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[/api/heming]', err);
    return Response.json({ error: '合盘分析失败' }, { status: 400 });
  }
}

function buildLocalHeming(chartA: ZiweiChart, chartB: ZiweiChart, question?: string) {
  const aMing = palaceSummary(chartA, '命宫');
  const bMing = palaceSummary(chartB, '命宫');
  const aFuqi = palaceSummary(chartA, '夫妻');
  const bFuqi = palaceSummary(chartB, '夫妻');
  const aFude = palaceSummary(chartA, '福德');
  const bFude = palaceSummary(chartB, '福德');
  const focus = question ? `\n\n**【本次追问】**\n${question}\n` : '';

  return `**【合盘总览】**
甲方命宫为 ${aMing}，乙方命宫为 ${bMing}。本地开发版先用命宫、夫妻宫、福德宫三组核心宫位做结构化合盘；正式 AI 后端可在此基础上继续加入四化互参与大限同步。

**【命宫互看】**
甲方的基本气质落在 ${aMing}，乙方的基本气质落在 ${bMing}。若双方命宫星性一刚一柔，关系更偏互补；若同为强势或变动型星曜，则需要更清楚的边界和沟通规则。

**【夫妻宫互参】**
甲方夫妻宫为 ${aFuqi}，乙方夫妻宫为 ${bFuqi}。夫妻宫代表对亲密关系的期待：一方期待的伴侣形象，若能在另一方命宫或三方四正中被看见，缘分感会更强。

**【福德宫耐久度】**
甲方福德宫为 ${aFude}，乙方福德宫为 ${bFude}。倪师体系看婚姻不能只看夫妻宫，还要看福德宫；福德宫稳定，关系更容易越相处越安心。

**【相处建议】**
先把关系定义说清楚，再谈长期承诺。合盘适合用来发现双方互动模式，不适合替代现实沟通。遇到强烈冲突时，优先处理作息、财务、家庭边界这些可执行问题。${focus}`;
}

function palaceSummary(chart: ZiweiChart, palaceName: string) {
  const palace = chart.palaces.find(item => item.name === palaceName);
  if (!palace) return '未见对应宫位';
  const majors = palace.stars.filter(star => star.type === 'major').map(star => star.name);
  return majors.length > 0 ? `${palace.name}（${majors.join('、')}）` : `${palace.name}（空宫，借对宫参考）`;
}

function chunkText(text: string, size: number) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}
