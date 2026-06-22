import { cookies } from 'next/headers';
import AccountPageClient from './AccountPageClient';
import { HEMING_QUOTA_COOKIE_NAME } from '@/lib/ai/heming-quota';
import { QUOTA_COOKIE_NAME } from '@/lib/ai/quota';
import type { AccountQuotaResponse } from '@/lib/auth/account-quota';
import { getUserById } from '@/lib/auth/store';
import { isProUser, readServerSession, toPublicUser } from '@/lib/auth/session';
import {
  FREE_DAILY_INTERPRET_QUOTA,
  PRO_DAILY_INTERPRET_QUOTA,
} from '@/lib/subscription/plans';
import {
  resolveSharedQuotaSnapshot,
  toAccountQuotaResponse,
} from '@/lib/subscription/shared-quota-client';

export const metadata = {
  title: '我的账户 · Metis',
  description: '查看登录信息、会员状态与 AI 额度。',
  robots: { index: false, follow: false },
};

async function resolveInitialQuota(): Promise<AccountQuotaResponse | null> {
  const session = await readServerSession();
  if (!session) return null;

  const user = await getUserById(session.userId);
  const isPro = user ? isProUser(toPublicUser(user)) : false;
  const max = isPro ? PRO_DAILY_INTERPRET_QUOTA : FREE_DAILY_INTERPRET_QUOTA;

  const cookieStore = await cookies();
  const snapshot = resolveSharedQuotaSnapshot(
    cookieStore.get(QUOTA_COOKIE_NAME)?.value,
    cookieStore.get(HEMING_QUOTA_COOKIE_NAME)?.value,
    max,
  );

  return toAccountQuotaResponse(snapshot, max);
}

export default async function AccountPage() {
  const initialQuota = await resolveInitialQuota();
  return <AccountPageClient initialQuota={initialQuota} />;
}
