import { NextRequest } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { addMessage, listMessages, type FeedbackCategory } from '@/lib/feedback/message-store';

export const runtime = 'nodejs';

const VALID_CATEGORIES = new Set<FeedbackCategory>(['bug', 'feature', 'other']);

export async function GET(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await listMessages(session.userId);
  return Response.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return Response.json({ error: '请先登录' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return Response.json({ error: '请填写留言内容' }, { status: 400 });
  }
  if (message.length > 1000) {
    return Response.json({ error: '留言不能超过 1000 字' }, { status: 400 });
  }

  const category = VALID_CATEGORIES.has(body?.category) ? body.category as FeedbackCategory : 'other';
  const contact = typeof body?.contact === 'string' ? body.contact.trim().slice(0, 100) : undefined;
  const page = typeof body?.page === 'string' ? body.page.slice(0, 200) : undefined;

  const entry = await addMessage(session.userId, { message, contact, category, page });
  return Response.json({ ok: true, message: entry });
}
