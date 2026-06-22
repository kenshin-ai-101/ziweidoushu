import { NextRequest, NextResponse } from 'next/server';
import { establishSession, findOrCreatePhoneUser } from '@/lib/auth/auth-handlers';
import { codeKeyForPhone, consumeVerificationCode } from '@/lib/auth/store';
import { PHONE_REGEX } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { phone?: string; code?: string };
    const phone = body.phone?.trim() ?? '';
    const code = body.code?.trim() ?? '';

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json({ success: false, error: '请输入正确的手机号' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: '请输入 6 位验证码' }, { status: 400 });
    }

    const ok = await consumeVerificationCode(codeKeyForPhone(phone), code, 'login');
    if (!ok) {
      return NextResponse.json({ success: false, error: '验证码无效或已过期' }, { status: 400 });
    }

    const { user, isNewUser } = await findOrCreatePhoneUser(phone);
    return establishSession(user.userId, { isNewUser });
  } catch {
    return NextResponse.json({ success: false, error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
