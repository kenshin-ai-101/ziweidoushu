import { cookies } from 'next/headers';
import { HEMING_QUOTA_COOKIE_NAME } from '@/lib/ai/heming-quota';
import { QUOTA_COOKIE_NAME } from '@/lib/ai/quota';
import { FREE_DAILY_INTERPRET_QUOTA } from '@/lib/subscription/plans';
import { resolveSharedQuotaSnapshot } from '@/lib/subscription/shared-quota-client';
import HemingPageClient from './HemingPageClient';

export default async function HemingPage() {
  const cookieStore = await cookies();
  const snapshot = resolveSharedQuotaSnapshot(
    cookieStore.get(QUOTA_COOKIE_NAME)?.value,
    cookieStore.get(HEMING_QUOTA_COOKIE_NAME)?.value,
    FREE_DAILY_INTERPRET_QUOTA,
  );

  return <HemingPageClient serverQuotaRemaining={snapshot.remaining} />;
}
