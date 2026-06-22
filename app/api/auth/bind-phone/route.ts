import { NextRequest, NextResponse } from 'next/server';
import {
  buildSessionToken,
  PHONE_REGEX,
  readSession,
  setSessionCookie,
  toPublicUser,
} from '@/lib/auth/session';
import {
  codeKeyForPhone,
  consumeVerificationCode,
  findUserByPhone,
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

    const body = await req.json() as { phone?: string; code?: string };
    const phone = body.phone?.trim() ?? '';
    const code = body.code?.trim() ?? '';

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json({ success: false, error: '请输入正确的手机号' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: '请输入 6 位验证码' }, { status: 400 });
    }

    const ok = await consumeVerificationCode(codeKeyForPhone(phone), code, 'bind');
    if (!ok) {
      return NextResponse.json({ success: false, error: '验证码无效或已过期' }, { status: 400 });
    }

    const existingPhoneUser = await findUserByPhone(phone);
    if (existingPhoneUser && existingPhoneUser.userId !== session.userId) {
      return NextResponse.json({ success: false, error: '该手机号已被其他账号绑定' }, { status: 409 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    const updated = await saveUser({ ...user, phone });
    const token = await buildSessionToken(updated);
    const res = NextResponse.json({ success: true, user: toPublicUser(updated) });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json({ success: false, error: '绑定失败，请稍后重试' }, { status: 500 });
  }
}
