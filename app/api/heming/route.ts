import { NextRequest } from 'next/server';
import { DeepSeekStream } from '@/lib/ai/stream';
import {
  HEMING_QUOTA_COOKIE_NAME,
  buildQuotaCookieValue as buildHemingQuotaCookieValue,
} from '@/lib/ai/heming-quota';
import {
  QUOTA_COOKIE_NAME,
  buildQuotaCookieValue,
  serializeQuotaState,
  type QuotaState,
} from '@/lib/ai/quota';
import { readSession } from '@/lib/auth/session';
import { resolveInterpretDailyLimit } from '@/lib/subscription/access';
import {
  consumeSharedQuota,
  rollbackSharedQuota,
  snapshotSharedQuota,
} from '@/lib/subscription/shared-quota';
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

function interpretCookieHeader(state: QuotaState): string {
  return `${QUOTA_COOKIE_NAME}=${buildQuotaCookieValue(state)}; Path=/; Max-Age=${QUOTA_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function hemingCookieHeader(state: QuotaState): string {
  return `${HEMING_QUOTA_COOKIE_NAME}=${buildHemingQuotaCookieValue(state)}; Path=/; Max-Age=${QUOTA_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function quotaSetCookieHeaders(interpret: QuotaState, heming: QuotaState): string[] {
  return [interpretCookieHeader(interpret), hemingCookieHeader(heming)];
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
    | {
        ok: true;
        remaining: number;
        usedBonus: boolean;
        interpret: QuotaState;
        heming: QuotaState;
      }
    | null = null;
  let dailyLimit = 3;

  try {
    const session = await readSession(req);
    if (!session) {
      return Response.json({ error: '登录后可使用合盘', code: 'NEED_LOGIN' }, { status: 401 });
    }

    const body = await req.json() as HemingRequestBody;
    const { chartA, chartB } = body;

    if (!isChart(chartA) || !isChart(chartB)) {
      return new Response(JSON.stringify({ error: '参数无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const preferBonus = req.headers.get('X-Quota-Prefer') === 'bonus';
    dailyLimit = await resolveInterpretDailyLimit(req);
    const quotaResult = consumeSharedQuota(
      req.cookies.get(QUOTA_COOKIE_NAME)?.value,
      req.cookies.get(HEMING_QUOTA_COOKIE_NAME)?.value,
      'heming',
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
    console.error('[/api/heming]', err);

    if (consumed?.ok) {
      const rolled = rollbackSharedQuota(
        consumed.interpret,
        consumed.heming,
        'heming',
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
      return new Response(JSON.stringify({ error: '合盘服务暂时不可用' }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: '合盘服务暂时不可用' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
