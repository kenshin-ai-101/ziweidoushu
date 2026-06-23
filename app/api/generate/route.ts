import { NextRequest } from 'next/server';
import { generateChart } from '@/lib/ziwei/algorithm';
import { DEFAULT_WENMO_CONFIG, normalizeWenmoConfig } from '@/lib/ziwei/school-config';
import type { BirthInfo } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as BirthInfo & {
      wenmoConfig?: unknown;
      brightnessSchool?: string;
    };
    const { wenmoConfig: rawWenmo, brightnessSchool, ...birthInfo } = body;
    const wenmoConfig = normalizeWenmoConfig(
      rawWenmo ?? (brightnessSchool ? { ...DEFAULT_WENMO_CONFIG, brightnessSchool } : DEFAULT_WENMO_CONFIG),
    );
    const chart = generateChart(birthInfo, { wenmoConfig });
    return Response.json(chart);
  } catch (err) {
    console.error('[/api/generate]', err);
    return Response.json({ error: '排盘失败，请检查出生信息' }, { status: 400 });
  }
}
