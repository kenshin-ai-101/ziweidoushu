import { NextRequest, NextResponse } from 'next/server';
import { HEMING_QUOTA_COOKIE_NAME } from '@/lib/ai/heming-quota';
import { QUOTA_COOKIE_NAME } from '@/lib/ai/quota';
import type { AccountQuotaResponse } from '@/lib/auth/account-quota';
import { getUserById } from '@/lib/auth/store';
import { isProUser, readSession, toPublicUser } from '@/lib/auth/session';
import {
  FREE_DAILY_INTERPRET_QUOTA,
  PRO_DAILY_INTERPRET_QUOTA,
} from '@/lib/subscription/plans';
import { snapshotSharedQuota } from '@/lib/subscription/shared-quota';
import { toAccountQuotaResponse } from '@/lib/subscription/shared-quota-client';

export const runtime = 'nodejs';

export type { AccountQuotaResponse };

export async function GET(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  const isPro = user ? isProUser(toPublicUser(user)) : false;
  const max = isPro ? PRO_DAILY_INTERPRET_QUOTA : FREE_DAILY_INTERPRET_QUOTA;

  const interpretRaw = req.cookies.get(QUOTA_COOKIE_NAME)?.value;
  const hemingRaw = req.cookies.get(HEMING_QUOTA_COOKIE_NAME)?.value;
  const snapshot = snapshotSharedQuota(interpretRaw, hemingRaw, max);

  const payload: AccountQuotaResponse = toAccountQuotaResponse(snapshot, max);

  return NextResponse.json(payload);
}
