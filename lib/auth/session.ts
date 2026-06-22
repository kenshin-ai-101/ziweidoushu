import type { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { PublicUser, SessionPayload, UserRecord } from './types';
import { signSessionPayload, verifySessionToken } from './crypto';

export const SESSION_COOKIE_NAME = 'metis_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    userId: user.userId,
    email: user.email,
    phone: user.phone,
    membershipTier: user.membershipTier,
    membershipExpiresAt: user.membershipExpiresAt,
  };
}

export function isProUser(user: Pick<PublicUser, 'membershipTier' | 'membershipExpiresAt'> | null): boolean {
  if (!user) return false;
  if (user.membershipTier === 'lifetime') return true;
  if (user.membershipTier === 'free') return false;
  if (!user.membershipExpiresAt) return false;
  return new Date(user.membershipExpiresAt).getTime() > Date.now();
}

export async function buildSessionToken(user: UserRecord): Promise<string> {
  const payload: SessionPayload = {
    userId: user.userId,
    membershipTier: user.membershipTier,
    membershipExpiresAt: user.membershipExpiresAt,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  return signSessionPayload(payload);
}

export async function readSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken<SessionPayload>(token);
}

export async function readServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken<SessionPayload>(token);
}

export function setSessionCookie(res: NextResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production';
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}

export const PHONE_REGEX = /^1[3-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function isDevAuthMode(): boolean {
  return process.env.AUTH_DEV_MODE !== '0';
}
