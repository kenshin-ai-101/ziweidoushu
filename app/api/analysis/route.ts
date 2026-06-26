import { NextRequest, NextResponse } from 'next/server';
import { buildChartAnalysisText, buildSiHuaFocusText } from '@/lib/ziwei/chart-analysis';
import { computeChartToken, getChartToken } from '@/lib/ziwei/chart-token';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

const VALID_TOPICS = new Set<TopicKey>([
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chart = body.chart as ZiweiChart | undefined;
    const chartToken = body.chartToken as string | undefined;
    const topic = body.topic as TopicKey | undefined;
    const options = body.options;
    const sihuaFocus = body.sihuaFocus as { starName: string; siHua: string; view: string } | undefined;
    const userId = typeof body.userId === 'string' ? body.userId : undefined;
    void userId;

    if (!chart?.birthInfo) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const expected = chartToken || getChartToken(chart);
    const actual = computeChartToken(chart);
    if (expected !== actual) {
      return NextResponse.json({ error: '会话已过期，请回到首页重新填写生辰起盘。' }, { status: 401 });
    }

    if (sihuaFocus?.starName && sihuaFocus.siHua && sihuaFocus.view) {
      const text = buildSiHuaFocusText(chart, sihuaFocus);
      return NextResponse.json({ text });
    }

    if (!topic || !VALID_TOPICS.has(topic)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const text = buildChartAnalysisText(chart, topic, options);
    return NextResponse.json({ text });
  } catch (err) {
    console.error('[/api/analysis]', err);
    return NextResponse.json({ error: '服务暂时不可用，请稍后重试' }, { status: 500 });
  }
}
