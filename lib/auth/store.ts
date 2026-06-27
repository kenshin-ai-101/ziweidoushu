import { query } from '@/lib/db/pool';
import { initDb } from '@/lib/db/init';
import type { UserRecord, VerificationCode } from './types';

let dbInitialized = false;

async function ensureDb(): Promise<void> {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  await ensureDb();
  const result = await query<{
    user_id: string;
    email: string | null;
    phone: string | null;
    password_hash: string | null;
    membership_tier: string;
    membership_expires_at: string | null;
    created_at: string;
  }>(
    'SELECT user_id, email, phone, password_hash, membership_tier, membership_expires_at, created_at FROM auth_users WHERE user_id = $1',
    [userId],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    userId: r.user_id,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    passwordHash: r.password_hash ?? undefined,
    membershipTier: r.membership_tier as UserRecord['membershipTier'],
    membershipExpiresAt: r.membership_expires_at ?? undefined,
    createdAt: r.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureDb();
  const normalized = email.trim().toLowerCase();
  const result = await query<{
    user_id: string;
    email: string | null;
    phone: string | null;
    password_hash: string | null;
    membership_tier: string;
    membership_expires_at: string | null;
    created_at: string;
  }>(
    'SELECT user_id, email, phone, password_hash, membership_tier, membership_expires_at, created_at FROM auth_users WHERE email = $1',
    [normalized],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    userId: r.user_id,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    passwordHash: r.password_hash ?? undefined,
    membershipTier: r.membership_tier as UserRecord['membershipTier'],
    membershipExpiresAt: r.membership_expires_at ?? undefined,
    createdAt: r.created_at,
  };
}

export async function findUserByPhone(phone: string): Promise<UserRecord | null> {
  await ensureDb();
  const result = await query<{
    user_id: string;
    email: string | null;
    phone: string | null;
    password_hash: string | null;
    membership_tier: string;
    membership_expires_at: string | null;
    created_at: string;
  }>(
    'SELECT user_id, email, phone, password_hash, membership_tier, membership_expires_at, created_at FROM auth_users WHERE phone = $1',
    [phone],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    userId: r.user_id,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    passwordHash: r.password_hash ?? undefined,
    membershipTier: r.membership_tier as UserRecord['membershipTier'],
    membershipExpiresAt: r.membership_expires_at ?? undefined,
    createdAt: r.created_at,
  };
}

export async function saveUser(user: UserRecord): Promise<UserRecord> {
  await ensureDb();
  await query(
    `INSERT INTO auth_users (user_id, email, phone, password_hash, membership_tier, membership_expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       password_hash = EXCLUDED.password_hash,
       membership_tier = EXCLUDED.membership_tier,
       membership_expires_at = EXCLUDED.membership_expires_at,
       updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT`,
    [
      user.userId,
      user.email ?? null,
      user.phone ?? null,
      user.passwordHash ?? null,
      user.membershipTier,
      user.membershipExpiresAt ?? null,
      user.createdAt,
    ],
  );
  return user;
}

export async function createUserId(): Promise<string> {
  return `u_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export async function setVerificationCode(
  key: string,
  code: VerificationCode,
): Promise<void> {
  await ensureDb();
  await query(
    `INSERT INTO auth_codes (key, code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key) DO UPDATE SET code = EXCLUDED.code, purpose = EXCLUDED.purpose, expires_at = EXCLUDED.expires_at`,
    [key, code.code, code.purpose, code.expiresAt],
  );
}

export async function consumeVerificationCode(
  key: string,
  code: string,
  purpose: VerificationCode['purpose'],
): Promise<boolean> {
  await ensureDb();
  const result = await query<{ key: string }>(
    `DELETE FROM auth_codes WHERE key = $1 AND code = $2 AND purpose = $3 AND expires_at > $4 RETURNING key`,
    [key, code, purpose, Date.now()],
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function purgeExpiredCodes(): Promise<void> {
  await ensureDb();
  await query('DELETE FROM auth_codes WHERE expires_at <= $1', [Date.now()]);
}

export function codeKeyForPhone(phone: string): string {
  return `phone:${phone}`;
}

export function codeKeyForEmail(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}
