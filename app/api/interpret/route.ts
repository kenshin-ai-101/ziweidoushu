import { NextRequest } from 'next/server';
import { DeepSeekStream } from '@/lib/ai/stream';
import {
  QUOTA_COOKIE_NAME,
  buildQuotaCookieValue,
  consumeQuota,
  getQuotaRemaining,
  rollbackQuota,
  type QuotaState,
} from '@/lib/ai/quota';
import { buildSystemPrompt } from '@/lib/ziwei/interpret-prompts';
import { computeChartToken, getChartToken } from '@/lib/ziwei/chart-token';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'edge';

const QUOTA_COOKIE_MAX_AGE = 86_400 * 2;

function quotaCookieHeader(state: QuotaState): string {
  return `${QUOTA_COOKIE_NAME}=${buildQuotaCookieValue(state)}; Path=/; Max-Age=${QUOTA_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export async function POST(req: NextRequest) {
  let consumed:
    | { ok: true; remaining: number; state: import('@/lib/ai/quota').QuotaState; usedBonus: boolean }
    | null = null;

  try {
    const body = await req.json();
    const chart = body.chart as ZiweiChart | undefined;
    const chartToken = body.chartToken as string | undefined;
    const messages = body.messages as Array<{ role: 'user' | 'assistant'; content: string }> | undefined;

    if (!chart?.birthInfo || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: '参数无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expected = chartToken || getChartToken(chart);
    if (expected !== computeChartToken(chart)) {
      return new Response(JSON.stringify({ error: '会话已过期，请回到首页重新填写生辰起盘。' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const preferBonus = req.headers.get('X-Quota-Prefer') === 'bonus';
    const quotaCookie = req.cookies.get(QUOTA_COOKIE_NAME)?.value;
    const quotaResult = consumeQuota(quotaCookie, preferBonus);

    if (!quotaResult.ok) {
      return new Response(JSON.stringify({ error: quotaResult.message }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'X-Quota-Remaining': '0',
        },
      });
    }

    consumed = quotaResult;

    const systemPrompt = buildSystemPrompt(chart);
    const stream = await DeepSeekStream({
      systemPrompt,
      messages,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Quota-Remaining': String(quotaResult.remaining),
        'Set-Cookie': quotaCookieHeader(quotaResult.state),
      },
    });
  } catch (err) {
    console.error('[/api/interpret]', err);

    if (consumed?.ok) {
      const rolled = rollbackQuota(consumed.state, consumed.usedBonus);
      return new Response(JSON.stringify({ error: '解读服务暂时不可用' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Quota-Remaining': String(getQuotaRemaining(rolled)),
          'Set-Cookie': quotaCookieHeader(rolled),
        },
      });
    }

    return new Response(JSON.stringify({ error: '解读服务暂时不可用' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
