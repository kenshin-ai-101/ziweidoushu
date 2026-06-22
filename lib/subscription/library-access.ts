import { getUserById } from '@/lib/auth/store';
import { isProUser, readServerSession, toPublicUser } from '@/lib/auth/session';

type ProSearchParams = {
  pro?: string;
  mockPro?: string;
  access?: string;
};

export function hasMockProAccess(searchParams: ProSearchParams) {
  const value = searchParams.pro ?? searchParams.mockPro ?? searchParams.access;
  return value === '1' || value === 'true' || value === 'pro';
}

export async function hasLibraryProAccess(searchParams?: ProSearchParams): Promise<boolean> {
  if (hasMockProAccess(searchParams ?? {})) return true;
  const session = await readServerSession();
  if (!session) return false;
  const user = await getUserById(session.userId);
  if (!user) return false;
  return isProUser(toPublicUser(user));
}
