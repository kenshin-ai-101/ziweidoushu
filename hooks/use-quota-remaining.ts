'use client';

import { useSyncExternalStore } from 'react';
import { FREE_DAILY_QUOTA } from '@/lib/ai/quota';
import { HEMING_FREE_DAILY_QUOTA } from '@/lib/ai/heming-quota';
import {
  getClientSharedQuotaRemaining,
  subscribeSharedQuotaStore,
} from '@/lib/subscription/shared-quota-client';

/** Hydration-safe shared AI quota (interpret + heming). */
export function useQuotaRemaining(serverRemaining = FREE_DAILY_QUOTA): number {
  return useSyncExternalStore(
    subscribeSharedQuotaStore,
    () => getClientSharedQuotaRemaining(FREE_DAILY_QUOTA),
    () => serverRemaining,
  );
}

/** Alias — same shared pool as interpret quota. */
export function useHemingQuotaRemaining(serverRemaining = HEMING_FREE_DAILY_QUOTA): number {
  return useSyncExternalStore(
    subscribeSharedQuotaStore,
    () => getClientSharedQuotaRemaining(HEMING_FREE_DAILY_QUOTA),
    () => serverRemaining,
  );
}
