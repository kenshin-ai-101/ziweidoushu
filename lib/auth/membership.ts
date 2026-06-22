import { getUserById, saveUser } from './store';
import type { UserRecord } from './types';

export async function upgradeUserToLifetime(userId: string): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  return saveUser({
    ...user,
    membershipTier: 'lifetime',
    membershipExpiresAt: undefined,
  });
}
