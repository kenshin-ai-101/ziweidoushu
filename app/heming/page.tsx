import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { HEMING_QUOTA_COOKIE_NAME } from '@/lib/ai/heming-quota';
import { QUOTA_COOKIE_NAME } from '@/lib/ai/quota';
import { isProUser, readServerSession } from '@/lib/auth/session';
import {
  FREE_DAILY_INTERPRET_QUOTA,
  PRO_DAILY_INTERPRET_QUOTA,
} from '@/lib/subscription/plans';
import { resolveSharedQuotaSnapshot } from '@/lib/subscription/shared-quota-client';
import HemingPageClient from './HemingPageClient';

export default async function HemingPage() {
  const cookieStore = await cookies();
  const session = await readServerSession();
  const isPro = session
    ? isProUser({
        membershipTier: session.membershipTier,
        membershipExpiresAt: session.membershipExpiresAt,
      })
    : false;
  const dailyLimit = isPro ? PRO_DAILY_INTERPRET_QUOTA : FREE_DAILY_INTERPRET_QUOTA;
  const snapshot = resolveSharedQuotaSnapshot(
    cookieStore.get(QUOTA_COOKIE_NAME)?.value,
    cookieStore.get(HEMING_QUOTA_COOKIE_NAME)?.value,
    dailyLimit,
  );

  return (
    <Suspense fallback={null}>
      <HemingPageClient
        serverQuotaRemaining={snapshot.remaining}
        serverDailyLimit={dailyLimit}
        serverIsLoggedIn={!!session}
      />
    </Suspense>
  );
}
