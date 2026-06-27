import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationCode } from '@/lib/auth/crypto';
import {
  codeKeyForPhone,
  purgeExpiredCodes,
  setVerificationCode,
} from '@/lib/auth/store';
import { isDevAuthMode, PHONE_REGEX } from '@/lib/auth/session';

export const runtime = 'nodejs';

const CODE_TTL_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { phone?: string; purpose?: string };
    const phone = body.phone?.trim() ?? '';
    const purpose = body.purpose === 'bind' ? 'bind' : 'login';

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json({ success: false, error: '请输入正确的手机号' }, { status: 400 });
    }

    await purgeExpiredCodes();
    const code = generateVerificationCode();
    await setVerificationCode(codeKeyForPhone(phone), {
      code,
      purpose,
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    const payload: { success: true; devCode?: string } = { success: true };
    if (isDevAuthMode()) payload.devCode = code;

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[send-code error]', err);
    return NextResponse.json({ success: false, error: '验证码发送失败' }, { status: 500 });
  }
}
