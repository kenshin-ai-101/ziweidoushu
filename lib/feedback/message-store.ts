import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type FeedbackCategory = 'bug' | 'feature' | 'other';

export interface FeedbackMessage {
  t: number;
  message: string;
  contact?: string;
  category: FeedbackCategory;
  page?: string;
  reply?: {
    reply: string;
    replyAt: number;
  };
}

interface FeedbackStore {
  users: Record<string, FeedbackMessage[]>;
}

const STORE_PATH = path.join(process.cwd(), '.data', 'feedback-messages.json');
const MAX_MESSAGES = 100;

let cache: FeedbackStore | null = null;

function emptyStore(): FeedbackStore {
  return { users: {} };
}

async function loadStore(): Promise<FeedbackStore> {
  if (cache) return cache;
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(raw) as FeedbackStore;
    return cache;
  } catch {
    cache = emptyStore();
    return cache;
  }
}

async function persistStore(data: FeedbackStore): Promise<void> {
  cache = data;
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function listMessages(userId: string): Promise<FeedbackMessage[]> {
  const store = await loadStore();
  return [...(store.users[userId] ?? [])].sort((a, b) => b.t - a.t);
}

export async function addMessage(
  userId: string,
  input: Pick<FeedbackMessage, 'message' | 'contact' | 'category' | 'page'>,
): Promise<FeedbackMessage> {
  const store = await loadStore();
  const entry: FeedbackMessage = {
    t: Date.now(),
    message: input.message,
    contact: input.contact,
    category: input.category,
    page: input.page,
  };
  const prev = store.users[userId] ?? [];
  store.users[userId] = [entry, ...prev].slice(0, MAX_MESSAGES);
  await persistStore(store);
  return entry;
}
