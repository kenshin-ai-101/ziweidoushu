import { NextRequest, NextResponse } from 'next/server';
import { decodeClientPassword, hashPassword } from '@/lib/auth/crypto';
import { createEmailUser, establishSession } from '@/lib/auth/auth-handlers';
import { codeKeyForEmail, consumeVerificationCode, findUserByEmail } from '@/lib/auth/store';
import { EMAIL_REGEX } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; p?: string; code?: string };
    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.p ? decodeClientPassword(body.p) : null;
    const code = body.code?.trim() ?? '';

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: '请输入正确的邮箱' }, { status: 400 });
    }
    if (!password || password.length < 6 || password.length > 64) {
      return NextResponse.json({ success: false, error: '请设置至少 6 位密码' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: '请输入 6 位验证码' }, { status: 400 });
    }

    if (await findUserByEmail(email)) {
      return NextResponse.json({ success: false, error: '该邮箱已注册，请切换到「登录」' }, { status: 409 });
    }

    const ok = await consumeVerificationCode(codeKeyForEmail(email), code, 'bind');
    if (!ok) {
      return NextResponse.json({ success: false, error: '验证码无效或已过期' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createEmailUser(email, passwordHash);
    if (!user) {
      return NextResponse.json({ success: false, error: '该邮箱已注册，请切换到「登录」' }, { status: 409 });
    }

    return establishSession(user.userId);
  } catch (err) {
    console.error('[register error]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: '注册失败，请稍后重试: ' + msg }, { status: 500 });
  }
}
