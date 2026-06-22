import { NextRequest, NextResponse } from 'next/server';
import {
  createUserId,
  findUserByEmail,
  findUserByPhone,
  getUserById,
  saveUser,
} from '@/lib/auth/store';
import {
  buildSessionToken,
  clearSessionCookie,
  readSession,
  setSessionCookie,
  toPublicUser,
} from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function establishSession(
  userId: string,
  extra?: Record<string, unknown>,
): Promise<NextResponse> {
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
  }
  const token = await buildSessionToken(user);
  const res = NextResponse.json({ success: true, user: toPublicUser(user), ...extra });
  setSessionCookie(res, token);
  return res;
}

export async function findOrCreatePhoneUser(phone: string): Promise<{ user: Awaited<ReturnType<typeof saveUser>>; isNewUser: boolean }> {
  const existing = await findUserByPhone(phone);
  if (existing) return { user: existing, isNewUser: false };
  const user = await saveUser({
    userId: await createUserId(),
    phone,
    membershipTier: 'free',
    createdAt: new Date().toISOString(),
  });
  return { user, isNewUser: true };
}

export async function createEmailUser(email: string, passwordHash: string) {
  const existing = await findUserByEmail(email);
  if (existing) return null;
  return saveUser({
    userId: await createUserId(),
    email: email.trim().toLowerCase(),
    passwordHash,
    membershipTier: 'free',
    createdAt: new Date().toISOString(),
  });
}

export async function getMeResponse(req: NextRequest): Promise<NextResponse> {
  const session = await readSession(req);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    const res = NextResponse.json({ user: null });
    clearSessionCookie(res);
    return res;
  }

  const token = await buildSessionToken(user);
  const res = NextResponse.json({ user: toPublicUser(user) });
  setSessionCookie(res, token);
  return res;
}

export async function logoutResponse(): Promise<NextResponse> {
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
