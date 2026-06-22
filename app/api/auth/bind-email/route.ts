import { NextRequest, NextResponse } from 'next/server';
import { decodeClientPassword, hashPassword } from '@/lib/auth/crypto';
import {
  buildSessionToken,
  EMAIL_REGEX,
  readSession,
  setSessionCookie,
  toPublicUser,
} from '@/lib/auth/session';
import {
  codeKeyForEmail,
  consumeVerificationCode,
  findUserByEmail,
  getUserById,
  saveUser,
} from '@/lib/auth/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await req.json() as { email?: string; code?: string; p?: string };
    const email = body.email?.trim().toLowerCase() ?? '';
    const code = body.code?.trim() ?? '';
    const password = body.p ? decodeClientPassword(body.p) : null;

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: '请输入正确的邮箱' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: '请输入 6 位验证码' }, { status: 400 });
    }
    if (password && (password.length < 6 || password.length > 64)) {
      return NextResponse.json({ success: false, error: '密码需 6–64 位' }, { status: 400 });
    }

    const ok = await consumeVerificationCode(codeKeyForEmail(email), code, 'bind');
    if (!ok) {
      return NextResponse.json({ success: false, error: '验证码无效或已过期' }, { status: 400 });
    }

    const existingEmailUser = await findUserByEmail(email);
    if (existingEmailUser && existingEmailUser.userId !== session.userId) {
      return NextResponse.json({ success: false, error: '该邮箱已被其他账号绑定' }, { status: 409 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    const updated = await saveUser({
      ...user,
      email,
      passwordHash: password ? await hashPassword(password) : user.passwordHash,
    });
    const token = await buildSessionToken(updated);
    const res = NextResponse.json({ success: true, user: toPublicUser(updated) });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json({ success: false, error: '绑定失败，请稍后重试' }, { status: 500 });
  }
}
