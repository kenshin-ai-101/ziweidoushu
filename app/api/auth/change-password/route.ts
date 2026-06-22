import { NextRequest, NextResponse } from 'next/server';
import { decodeClientPassword, hashPassword } from '@/lib/auth/crypto';
import {
  buildSessionToken,
  readSession,
  setSessionCookie,
  toPublicUser,
} from '@/lib/auth/session';
import { getUserById, saveUser } from '@/lib/auth/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await req.json() as { p?: string; p2?: string };
    const password = body.p ? decodeClientPassword(body.p) : null;
    const confirm = body.p2 ? decodeClientPassword(body.p2) : null;

    if (!password || password.length < 6 || password.length > 64) {
      return NextResponse.json({ success: false, error: '密码需 6–64 位' }, { status: 400 });
    }
    if (password !== confirm) {
      return NextResponse.json({ success: false, error: '两次输入的密码不一致' }, { status: 400 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    const updated = await saveUser({
      ...user,
      passwordHash: await hashPassword(password),
    });
    const token = await buildSessionToken(updated);
    const res = NextResponse.json({ success: true, user: toPublicUser(updated) });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json({ success: false, error: '密码设置失败' }, { status: 500 });
  }
}
