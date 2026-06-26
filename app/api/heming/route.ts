import { NextRequest } from 'next/server';
import { DeepSeekStream, createLocalTextStream } from '@/lib/ai/stream';
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
import { FREE_DAILY_INTERPRET_QUOTA } from '@/lib/subscription/plans';
import {
  consumeSharedQuota,
  rollbackSharedQuota,
  snapshotSharedQuota,
} from '@/lib/subscription/shared-quota';
import { buildLocalHemingText } from '@/lib/ziwei/heming-facts';
import {
  buildFollowUpHemingMessages,
  buildHemingSystemPrompt,
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

function isChart(value: unknown): value is ZiweiChart {
  const chart = value as Partial<ZiweiChart> | undefined;
  return !!chart?.birthInfo && Array.isArray(chart.palaces) && chart.palaces.length > 0;
}

export async function POST(req: NextRequest) {
  let consumed:
    | {
        remaining: number;
        usedBonus: boolean;
        interpret: QuotaState;
        heming: QuotaState;
      }
    | null = null;
  let dailyLimit = FREE_DAILY_INTERPRET_QUOTA;

  try {
    const session = await readSession(req);
    if (!session) {
      return new Response(JSON.stringify({ error: '登录后可使用合盘', code: 'NEED_LOGIN' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
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
    const question = body.question?.trim();
    const isFollowUp = Boolean(question);

    dailyLimit = await resolveInterpretDailyLimit(req);
    const interpretRaw = req.cookies.get(QUOTA_COOKIE_NAME)?.value;
    const hemingRaw = req.cookies.get(HEMING_QUOTA_COOKIE_NAME)?.value;

    let quotaRemaining: number;
    let interpretState: QuotaState;
    let hemingState: QuotaState;

    if (isFollowUp) {
      const quotaResult = consumeSharedQuota(
        interpretRaw,
        hemingRaw,
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
        remaining: quotaResult.remaining,
        usedBonus: quotaResult.usedBonus,
        interpret: quotaResult.interpret,
        heming: quotaResult.heming,
      };
      quotaRemaining = quotaResult.remaining;
      interpretState = quotaResult.interpret;
      hemingState = quotaResult.heming;
    } else {
      const snapshot = snapshotSharedQuota(interpretRaw, hemingRaw, dailyLimit);
      quotaRemaining = snapshot.remaining;
      interpretState = snapshot.interpret;
      hemingState = snapshot.heming;
    }

    const stream = isFollowUp
      ? await DeepSeekStream({
          systemPrompt: buildHemingSystemPrompt(chartA, chartB),
          messages: buildFollowUpHemingMessages({
            previousAnalysis: body.previousAnalysis,
            question: question!,
          }),
        })
      : createLocalTextStream(buildLocalHemingText(chartA, chartB));

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Quota-Remaining': String(quotaRemaining),
      'X-Quota-Daily': String(dailyLimit),
    });

    if (consumed) {
      headers.append('Set-Cookie', interpretCookieHeader(interpretState));
      headers.append('Set-Cookie', hemingCookieHeader(hemingState));
    }

    return new Response(stream, { headers });
  } catch (err) {
    console.error('[/api/heming]', err);

    if (consumed) {
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
      headers.append('Set-Cookie', interpretCookieHeader(rolled.interpret));
      headers.append('Set-Cookie', hemingCookieHeader(rolled.heming));

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
