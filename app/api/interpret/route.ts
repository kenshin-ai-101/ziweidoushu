import { NextRequest } from 'next/server';
import { DeepSeekStream } from '@/lib/ai/stream';
import {
  HEMING_QUOTA_COOKIE_NAME,
  buildQuotaCookieValue as buildHemingQuotaCookieValue,
} from '@/lib/ai/heming-quota';
import {
  consumeSharedQuota,
  rollbackSharedQuota,
  snapshotSharedQuota,
} from '@/lib/subscription/shared-quota';
import {
  QUOTA_COOKIE_NAME,
  buildQuotaCookieValue,
  serializeQuotaState,
  type QuotaState,
} from '@/lib/ai/quota';
import { resolveInterpretDailyLimit } from '@/lib/subscription/access';
import { FREE_DAILY_INTERPRET_QUOTA } from '@/lib/subscription/plans';
import { buildSystemPrompt } from '@/lib/ziwei/interpret-prompts';
import { computeChartToken, getChartToken } from '@/lib/ziwei/chart-token';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'edge';

const QUOTA_COOKIE_MAX_AGE = 86_400 * 2;

function interpretCookieHeader(state: QuotaState): string {
  return `${QUOTA_COOKIE_NAME}=${buildQuotaCookieValue(state)}; Path=/; Max-Age=${QUOTA_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function hemingCookieHeader(state: QuotaState): string {
  return `${HEMING_QUOTA_COOKIE_NAME}=${buildHemingQuotaCookieValue(state)}; Path=/; Max-Age=${QUOTA_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function quotaSetCookieHeaders(interpret: QuotaState, heming: QuotaState): string[] {
  return [interpretCookieHeader(interpret), hemingCookieHeader(heming)];
}

export async function POST(req: NextRequest) {
  let consumed:
    | {
        ok: true;
        remaining: number;
        usedBonus: boolean;
        interpret: QuotaState;
        heming: QuotaState;
      }
    | null = null;
  let dailyLimit = FREE_DAILY_INTERPRET_QUOTA;

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
    dailyLimit = await resolveInterpretDailyLimit(req);
    const quotaResult = consumeSharedQuota(
      req.cookies.get(QUOTA_COOKIE_NAME)?.value,
      req.cookies.get(HEMING_QUOTA_COOKIE_NAME)?.value,
      'interpret',
      preferBonus,
      dailyLimit,
    );

    if (!quotaResult.ok) {
      return new Response(JSON.stringify({ error: quotaResult.message }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'X-Quota-Remaining': '0',
          'X-Quota-Daily': String(dailyLimit),
        },
      });
    }

    consumed = {
      ok: true,
      remaining: quotaResult.remaining,
      usedBonus: quotaResult.usedBonus,
      interpret: quotaResult.interpret,
      heming: quotaResult.heming,
    };

    const systemPrompt = buildSystemPrompt(chart);
    const stream = await DeepSeekStream({
      systemPrompt,
      messages,
    });

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Quota-Remaining': String(quotaResult.remaining),
    });
    for (const cookie of quotaSetCookieHeaders(quotaResult.interpret, quotaResult.heming)) {
      headers.append('Set-Cookie', cookie);
    }

    return new Response(stream, { headers });
  } catch (err) {
    console.error('[/api/interpret]', err);

    if (consumed?.ok) {
      const rolled = rollbackSharedQuota(
        consumed.interpret,
        consumed.heming,
        'interpret',
        consumed.usedBonus,
      );
      const remaining = snapshotSharedQuota(
        serializeQuotaState(rolled.interpret),
        serializeQuotaState(rolled.heming),
        dailyLimit,
      ).remaining;
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Quota-Remaining': String(remaining),
      });
      for (const cookie of quotaSetCookieHeaders(rolled.interpret, rolled.heming)) {
        headers.append('Set-Cookie', cookie);
      }
      return new Response(JSON.stringify({ error: '解读服务暂时不可用' }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: '解读服务暂时不可用' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
