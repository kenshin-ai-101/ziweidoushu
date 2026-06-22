'use client';

import { useSyncExternalStore } from 'react';
import { FREE_DAILY_QUOTA } from '@/lib/ai/quota';
import { HEMING_FREE_DAILY_QUOTA } from '@/lib/ai/heming-quota';
import {
  getClientHemingQuotaRemaining,
  subscribeHemingQuotaStore,
} from '@/lib/ziwei/heming-quota-client';
import {
  getClientQuotaRemaining,
  subscribeQuotaStore,
} from '@/lib/ziwei/quota-client';

/** Hydration-safe AI interpret quota from quota cookie. */
export function useQuotaRemaining(serverRemaining = FREE_DAILY_QUOTA): number {
  return useSyncExternalStore(
    subscribeQuotaStore,
    getClientQuotaRemaining,
    () => serverRemaining,
  );
}

/** Hydration-safe heming quota from heming quota cookie. */
export function useHemingQuotaRemaining(serverRemaining = HEMING_FREE_DAILY_QUOTA): number {
  return useSyncExternalStore(
    subscribeHemingQuotaStore,
    getClientHemingQuotaRemaining,
    () => serverRemaining,
  );
}
