import { NextRequest } from 'next/server';
import { DeepSeekStream } from '@/lib/ai/stream';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { chart, messages } = await req.json();

    const systemPrompt = buildSystemPrompt(chart);

    const stream = await DeepSeekStream({
      systemPrompt,
      messages,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[/api/interpret]', err);
    return new Response(JSON.stringify({ error: '解读服务暂时不可用' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { buildSystemPrompt } from '@/lib/ziwei/interpret-prompts';
