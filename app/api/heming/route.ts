import { NextRequest } from 'next/server';
import { DeepSeekStream } from '@/lib/ai/stream';
import {
  HEMING_QUOTA_COOKIE_NAME,
  buildQuotaCookieValue,
  consumeHemingQuota,
  getHemingQuotaRemaining,
  rollbackHemingQuota,
} from '@/lib/ai/heming-quota';
import type { QuotaState } from '@/lib/ai/quota';
import {
  buildFollowUpHemingMessages,
  buildHemingSystemPrompt,
  buildInitialHemingMessages,
} from '@/lib/ziwei/heming-prompts';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'edge';

const QUOTA_COOKIE_MAX_AGE = 86_400 * 2;

type HemingMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type HemingRequestBody = {
  chartA?: ZiweiChart;
  chartB?: ZiweiChart;
  question?: string;
  previousAnalysis?: string;
  messages?: HemingMessage[];
};

function quotaCookieHeader(state: QuotaState): string {
  return `${HEMING_QUOTA_COOKIE_NAME}=${buildQuotaCookieValue(state)}; Path=/; Max-Age=${QUOTA_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function isChart(value: unknown): value is ZiweiChart {
  const chart = value as Partial<ZiweiChart> | undefined;
  return !!chart?.birthInfo && Array.isArray(chart.palaces) && chart.palaces.length > 0;
}

function cleanMessages(messages: HemingMessage[] | undefined): HemingMessage[] | undefined {
  if (!Array.isArray(messages)) return undefined;
  return messages
    .filter(item => (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string' && item.content.trim())
    .slice(-12)
    .map(item => ({ role: item.role, content: item.content.slice(0, 12000) }));
}

export async function POST(req: NextRequest) {
  let consumed:
    | { ok: true; remaining: number; state: QuotaState; usedBonus: boolean }
    | null = null;

  try {
    const body = await req.json() as HemingRequestBody;
    const { chartA, chartB } = body;

    if (!isChart(chartA) || !isChart(chartB)) {
      return new Response(JSON.stringify({ error: '参数无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const preferBonus = req.headers.get('X-Quota-Prefer') === 'bonus';
    const quotaCookie = req.cookies.get(HEMING_QUOTA_COOKIE_NAME)?.value;
    const quotaResult = consumeHemingQuota(quotaCookie, preferBonus);

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

    const question = body.question?.trim();
    const messages = question
      ? buildFollowUpHemingMessages({
          previousAnalysis: body.previousAnalysis,
          history: cleanMessages(body.messages),
          question,
        })
      : (cleanMessages(body.messages) || buildInitialHemingMessages());

    const stream = await DeepSeekStream({
      systemPrompt: buildHemingSystemPrompt(chartA, chartB),
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
    console.error('[/api/heming]', err);

    if (consumed?.ok) {
      const rolled = rollbackHemingQuota(consumed.state, consumed.usedBonus);
      return new Response(JSON.stringify({ error: '合盘服务暂时不可用' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Quota-Remaining': String(getHemingQuotaRemaining(rolled)),
          'Set-Cookie': quotaCookieHeader(rolled),
        },
      });
    }

    return new Response(JSON.stringify({ error: '合盘服务暂时不可用' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
