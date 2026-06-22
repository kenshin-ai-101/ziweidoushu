import { NextRequest } from 'next/server';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const info = await req.json() as BirthInfo;
    const chart = generateChart(info);
    return Response.json(chart);
  } catch (err) {
    console.error('[/api/generate]', err);
    return Response.json({ error: '排盘失败，请检查出生信息' }, { status: 400 });
  }
}
