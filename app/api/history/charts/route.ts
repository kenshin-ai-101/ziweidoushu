import { NextRequest } from 'next/server';

export const runtime = 'edge';

/** 云端命盘历史 — 生产环境需登录；本地开源版返回 localOnly，由 useHistory 写 localStorage */
export async function GET() {
  return Response.json({
    charts: [],
    loggedIn: false,
    localOnly: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return Response.json({
      ok: true,
      localOnly: true,
      message: '未登录：命盘已保存在本机浏览器，登录后可同步云端',
      received: Boolean(body?.form),
    });
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE() {
  return Response.json({ ok: true, localOnly: true });
}
