import { NextRequest } from 'next/server';
import { readSession } from '@/lib/auth/session';

export const runtime = 'edge';

/** 云端命盘历史 — 生产环境需登录；本地开源版登录后仍走 localStorage，但 API 会返回 loggedIn */
export async function GET(req: NextRequest) {
  const session = await readSession(req);
  const loggedIn = Boolean(session);

  return Response.json({
    charts: [],
    loggedIn,
    localOnly: true,
  });
}

export async function POST(req: NextRequest) {
  const session = await readSession(req);
  try {
    const body = await req.json();
    return Response.json({
      ok: true,
      localOnly: true,
      loggedIn: Boolean(session),
      message: session
        ? '命盘已保存在本机浏览器（云端同步待接入）'
        : '未登录：命盘已保存在本机浏览器，登录后可同步云端',
      received: Boolean(body?.form),
    });
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await readSession(req);
  return Response.json({ ok: true, localOnly: true, loggedIn: Boolean(session) });
}
