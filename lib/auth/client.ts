import type { PublicUser } from './types';

export const ME_STORAGE_KEY = 'metis_me_v1';

export function readCachedUser(): PublicUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicUser;
    return parsed && typeof parsed.userId === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedUser(user: PublicUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) window.localStorage.setItem(ME_STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(ME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

let meRequest: Promise<PublicUser | null> | null = null;
const listeners = new Set<() => void>();

export function invalidateAuthCache(): void {
  meRequest = null;
  listeners.forEach(listener => listener());
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function fetchCurrentUser(retry = false): Promise<PublicUser | null> {
  if (!meRequest) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    meRequest = fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .finally(() => window.clearTimeout(timeout))
      .then(async res => {
        if (res.ok) {
          const data = await res.json() as { user?: PublicUser | null };
          const user = data.user ?? null;
          writeCachedUser(user);
          return user;
        }
        meRequest = null;
        if (!retry) {
          await new Promise(resolve => window.setTimeout(resolve, 1500));
          return fetchCurrentUser(true);
        }
        return readCachedUser();
      })
      .catch(async () => {
        meRequest = null;
        if (!retry) {
          await new Promise(resolve => window.setTimeout(resolve, 1500));
          return fetchCurrentUser(true);
        }
        return readCachedUser();
      });
  }
  return meRequest;
}

export function encodeClientPassword(password: string): string {
  return btoa(encodeURIComponent(password));
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function isProUser(user: PublicUser | null): boolean {
  if (!user) return false;
  if (user.membershipTier === 'lifetime') return true;
  if (user.membershipTier === 'free') return false;
  if (!user.membershipExpiresAt) return false;
  return new Date(user.membershipExpiresAt).getTime() > Date.now();
}
