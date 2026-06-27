import { NextRequest, NextResponse } from 'next/server';
import { decodeClientPassword, hashPassword, verifyPassword } from '@/lib/auth/crypto';
import { establishSession } from '@/lib/auth/auth-handlers';
import { findUserByEmail } from '@/lib/auth/store';
import { EMAIL_REGEX } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; p?: string };
    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.p ? decodeClientPassword(body.p) : null;

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: '请输入正确的邮箱' }, { status: 400 });
    }
    if (!password || password.length < 6 || password.length > 64) {
      return NextResponse.json({ success: false, error: '密码至少 6 位' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user?.passwordHash) {
      return NextResponse.json({ success: false, error: '登录失败，请检查邮箱或密码' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: '登录失败，请检查邮箱或密码' }, { status: 401 });
    }

    return establishSession(user.userId);
  } catch (err) {
    console.error('[login-password error]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: '登录失败，请稍后重试: ' + msg }, { status: 500 });
  }
}
