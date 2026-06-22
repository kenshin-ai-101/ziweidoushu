import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { UserRecord, VerificationCode } from './types';

interface AuthStoreData {
  users: Record<string, UserRecord>;
  codes: Record<string, VerificationCode>;
}

const STORE_PATH = path.join(process.cwd(), '.data', 'auth-store.json');

let cache: AuthStoreData | null = null;

function emptyStore(): AuthStoreData {
  return { users: {}, codes: {} };
}

async function loadStore(): Promise<AuthStoreData> {
  if (cache) return cache;
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(raw) as AuthStoreData;
    return cache;
  } catch {
    cache = emptyStore();
    return cache;
  }
}

async function persistStore(data: AuthStoreData): Promise<void> {
  cache = data;
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const store = await loadStore();
  return store.users[userId] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const store = await loadStore();
  return Object.values(store.users).find(user => user.email === normalized) ?? null;
}

export async function findUserByPhone(phone: string): Promise<UserRecord | null> {
  const store = await loadStore();
  return Object.values(store.users).find(user => user.phone === phone) ?? null;
}

export async function saveUser(user: UserRecord): Promise<UserRecord> {
  const store = await loadStore();
  store.users[user.userId] = user;
  await persistStore(store);
  return user;
}

export async function createUserId(): Promise<string> {
  return `u_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export async function setVerificationCode(
  key: string,
  code: VerificationCode,
): Promise<void> {
  const store = await loadStore();
  store.codes[key] = code;
  await persistStore(store);
}

export async function consumeVerificationCode(
  key: string,
  code: string,
  purpose: VerificationCode['purpose'],
): Promise<boolean> {
  const store = await loadStore();
  const entry = store.codes[key];
  if (!entry) return false;
  if (entry.purpose !== purpose) return false;
  if (entry.expiresAt <= Date.now()) {
    delete store.codes[key];
    await persistStore(store);
    return false;
  }
  if (entry.code !== code) return false;
  delete store.codes[key];
  await persistStore(store);
  return true;
}

export async function purgeExpiredCodes(): Promise<void> {
  const store = await loadStore();
  const now = Date.now();
  let changed = false;
  for (const [key, entry] of Object.entries(store.codes)) {
    if (entry.expiresAt <= now) {
      delete store.codes[key];
      changed = true;
    }
  }
  if (changed) await persistStore(store);
}

export function codeKeyForPhone(phone: string): string {
  return `phone:${phone}`;
}

export function codeKeyForEmail(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}
