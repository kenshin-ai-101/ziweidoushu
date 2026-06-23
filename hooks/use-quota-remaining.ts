'use client';

import { useSyncExternalStore } from 'react';
import { FREE_DAILY_INTERPRET_QUOTA } from '@/lib/subscription/plans';
import {
  getClientSharedQuotaRemaining,
  subscribeSharedQuotaStore,
} from '@/lib/subscription/shared-quota-client';

/** Hydration-safe shared AI quota (interpret + heming). */
export function useQuotaRemaining(
  dailyLimit = FREE_DAILY_INTERPRET_QUOTA,
  serverRemaining = dailyLimit,
): number {
  return useSyncExternalStore(
    subscribeSharedQuotaStore,
    () => getClientSharedQuotaRemaining(dailyLimit),
    () => serverRemaining,
  );
}

/** Alias — same shared pool as interpret quota. */
export function useHemingQuotaRemaining(
  dailyLimit = FREE_DAILY_INTERPRET_QUOTA,
  serverRemaining = dailyLimit,
): number {
  return useSyncExternalStore(
    subscribeSharedQuotaStore,
    () => getClientSharedQuotaRemaining(dailyLimit),
    () => serverRemaining,
  );
}
