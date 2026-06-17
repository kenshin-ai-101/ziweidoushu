import { NextRequest, NextResponse } from 'next/server';
import { buildAllTopicAnalysisTabs } from '@/lib/ziwei/chart-analysis';
import { CHART_TOPIC_TABS_ALL } from '@/lib/ziwei/db-analysis';
import { computeChartToken, getChartToken } from '@/lib/ziwei/chart-token';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chart = body.chart as ZiweiChart | undefined;
    const chartToken = body.chartToken as string | undefined;

    if (!chart?.birthInfo) {
      return NextResponse.json({ source: 'unavailable' }, { status: 200 });
    }

    const expected = chartToken || getChartToken(chart);
    if (expected !== computeChartToken(chart)) {
      return NextResponse.json({ source: 'unavailable' }, { status: 200 });
    }

    const topics = CHART_TOPIC_TABS_ALL.map(t => t.key);
    const tabs = buildAllTopicAnalysisTabs(chart, topics);
    return NextResponse.json({ source: 'db', tabs });
  } catch (err) {
    console.error('[/api/lookup-tabs]', err);
    return NextResponse.json({ source: 'unavailable' }, { status: 200 });
  }
}
