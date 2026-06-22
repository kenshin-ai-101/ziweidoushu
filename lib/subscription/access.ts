import type { NextRequest } from 'next/server';
import { isProUser, readSession } from '@/lib/auth/session';
import {
  FREE_DAILY_HEMING_QUOTA,
  FREE_DAILY_INTERPRET_QUOTA,
  PRO_DAILY_HEMING_QUOTA,
  PRO_DAILY_INTERPRET_QUOTA,
} from '@/lib/subscription/plans';

function isProSession(
  session: { membershipTier: string; membershipExpiresAt?: string } | null,
): boolean {
  if (!session) return false;
  return isProUser({
    membershipTier: session.membershipTier as 'free' | 'monthly' | 'yearly' | 'lifetime',
    membershipExpiresAt: session.membershipExpiresAt,
  });
}

export async function resolveInterpretDailyLimit(req: NextRequest): Promise<number> {
  const session = await readSession(req);
  return isProSession(session) ? PRO_DAILY_INTERPRET_QUOTA : FREE_DAILY_INTERPRET_QUOTA;
}

export async function resolveHemingDailyLimit(req: NextRequest): Promise<number> {
  const session = await readSession(req);
  return isProSession(session) ? PRO_DAILY_HEMING_QUOTA : FREE_DAILY_HEMING_QUOTA;
}

export async function resolveUserProFromRequest(req: NextRequest): Promise<boolean> {
  const session = await readSession(req);
  return isProSession(session);
}
