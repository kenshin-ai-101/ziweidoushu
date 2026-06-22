import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationCode } from '@/lib/auth/crypto';
import {
  codeKeyForEmail,
  purgeExpiredCodes,
  setVerificationCode,
} from '@/lib/auth/store';
import { EMAIL_REGEX, isDevAuthMode } from '@/lib/auth/session';

export const runtime = 'nodejs';

const CODE_TTL_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? '';

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: '请输入正确的邮箱' }, { status: 400 });
    }

    await purgeExpiredCodes();
    const code = generateVerificationCode();
    await setVerificationCode(codeKeyForEmail(email), {
      code,
      purpose: 'bind',
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    const payload: { success: true; devCode?: string } = { success: true };
    if (isDevAuthMode()) payload.devCode = code;

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ success: false, error: '验证码发送失败' }, { status: 500 });
  }
}
