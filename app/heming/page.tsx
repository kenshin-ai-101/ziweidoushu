import { cookies } from 'next/headers';
import { HEMING_QUOTA_COOKIE_NAME } from '@/lib/ai/heming-quota';
import { resolveHemingQuotaRemaining } from '@/lib/ziwei/heming-quota-client';
import HemingPageClient from './HemingPageClient';

export default async function HemingPage() {
  const cookieStore = await cookies();
  const serverQuotaRemaining = resolveHemingQuotaRemaining(
    cookieStore.get(HEMING_QUOTA_COOKIE_NAME)?.value,
  );

  return <HemingPageClient serverQuotaRemaining={serverQuotaRemaining} />;
}
