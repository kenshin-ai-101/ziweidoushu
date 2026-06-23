export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatSession {
  id: string;
  label: string;
  messages: AiChatMessage[];
  updatedAt: number;
}

const MAX_SESSIONS = 20;

function sessionsKey(userKey: string, chartToken: string) {
  return `ai_sessions_${userKey}_${chartToken}`;
}

function legacyChatKey(userKey: string, chartToken: string) {
  return `ai_chat_${userKey}_${chartToken}`;
}

function sessionLabel(messages: AiChatMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser?.content.trim()) return '新对话';
  return firstUser.content.trim().slice(0, 40);
}

function readSessions(userKey: string, chartToken: string): AiChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(sessionsKey(userKey, chartToken));
    if (raw) {
      const parsed = JSON.parse(raw) as AiChatSession[];
      if (Array.isArray(parsed)) {
        return parsed.filter(s => s && typeof s.id === 'string' && Array.isArray(s.messages));
      }
    }

    const legacyRaw = localStorage.getItem(legacyChatKey(userKey, chartToken));
    if (!legacyRaw) return [];

    const legacy = JSON.parse(legacyRaw) as
      | AiChatMessage[]
      | { messages?: AiChatMessage[]; updatedAt?: number; label?: string };
    const messages = Array.isArray(legacy) ? legacy : legacy.messages;
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const updatedAt = Array.isArray(legacy)
      ? Date.now()
      : typeof legacy.updatedAt === 'number'
        ? legacy.updatedAt
        : Date.now();
    const label = !Array.isArray(legacy) && typeof legacy.label === 'string' && legacy.label.trim()
      ? legacy.label.trim()
      : sessionLabel(messages);

    const session: AiChatSession = {
      id: `legacy-${updatedAt}`,
      label,
      messages,
      updatedAt,
    };
    writeSessions(userKey, chartToken, [session]);
    return [session];
  } catch {
    return [];
  }
}

function writeSessions(userKey: string, chartToken: string, sessions: AiChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS);
    localStorage.setItem(sessionsKey(userKey, chartToken), JSON.stringify(sorted));

    const latest = sorted[0];
    if (latest && latest.messages.length > 0) {
      localStorage.setItem(
        legacyChatKey(userKey, chartToken),
        JSON.stringify({
          messages: latest.messages,
          updatedAt: latest.updatedAt,
          label: latest.label,
        }),
      );
    } else {
      localStorage.removeItem(legacyChatKey(userKey, chartToken));
    }
  } catch {}
}

export function loadAiChatSessions(userKey: string, chartToken: string): AiChatSession[] {
  return readSessions(userKey, chartToken);
}

export function saveAiChatSession(
  userKey: string,
  chartToken: string,
  session: AiChatSession,
): AiChatSession[] {
  const prev = readSessions(userKey, chartToken);
  const next = [
    session,
    ...prev.filter(item => item.id !== session.id),
  ].slice(0, MAX_SESSIONS);
  writeSessions(userKey, chartToken, next);
  return next;
}

export function createAiChatSession(): AiChatSession {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: '新对话',
    messages: [],
    updatedAt: Date.now(),
  };
}

export function deleteAiChatSession(
  userKey: string,
  chartToken: string,
  sessionId: string,
): AiChatSession[] {
  const next = readSessions(userKey, chartToken).filter(item => item.id !== sessionId);
  writeSessions(userKey, chartToken, next);
  return next;
}

export function clearAiChatSessions(userKey: string, chartToken: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(sessionsKey(userKey, chartToken));
    localStorage.removeItem(legacyChatKey(userKey, chartToken));
  } catch {}
}

export function buildSessionFromMessages(
  sessionId: string,
  messages: AiChatMessage[],
): AiChatSession {
  return {
    id: sessionId,
    label: sessionLabel(messages),
    messages,
    updatedAt: Date.now(),
  };
}

export interface AiChatHistoryEntry {
  chartToken: string;
  messages: AiChatMessage[];
  messageCount: number;
  preview: string;
  lastUpdated: number;
}

export function listAllAiChatEntries(userKey: string): AiChatHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  const byToken = new Map<string, AiChatHistoryEntry>();

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const sessionsMatch = key.match(new RegExp(`^ai_sessions_${userKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_(.+)$`));
    if (sessionsMatch) {
      const chartToken = sessionsMatch[1];
      const sessions = readSessions(userKey, chartToken);
      const latest = sessions.find(item => item.messages.length > 0);
      if (!latest) continue;
      byToken.set(chartToken, {
        chartToken,
        messages: latest.messages,
        messageCount: latest.messages.length,
        preview: latest.label,
        lastUpdated: latest.updatedAt,
      });
      continue;
    }

    const chatMatch = key.match(new RegExp(`^ai_chat_${userKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_(.+)$`));
    if (!chatMatch || byToken.has(chatMatch[1])) continue;

    const chartToken = chatMatch[1];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as
        | AiChatMessage[]
        | { messages?: AiChatMessage[]; updatedAt?: number; label?: string };
      const messages = Array.isArray(parsed) ? parsed : parsed.messages;
      if (!Array.isArray(messages) || messages.length === 0) continue;
      const lastUpdated = Array.isArray(parsed)
        ? 0
        : typeof parsed.updatedAt === 'number'
          ? parsed.updatedAt
          : 0;
      const preview = !Array.isArray(parsed) && typeof parsed.label === 'string' && parsed.label.trim()
        ? parsed.label.trim()
        : sessionLabel(messages);
      byToken.set(chartToken, {
        chartToken,
        messages,
        messageCount: messages.length,
        preview,
        lastUpdated,
      });
    } catch {
      /* skip invalid entry */
    }
  }

  return [...byToken.values()].sort((a, b) => b.lastUpdated - a.lastUpdated);
}

export function clearAllAiChatEntries(userKey: string) {
  if (typeof window === 'undefined') return;
  const chatPrefix = `ai_chat_${userKey}_`;
  const sessionPrefix = `ai_sessions_${userKey}_`;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(chatPrefix) || key.startsWith(sessionPrefix))) {
      keys.push(key);
    }
  }
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* skip */
    }
  });
}

export function deleteAiChatEntry(userKey: string, chartToken: string) {
  clearAiChatSessions(userKey, chartToken);
}
