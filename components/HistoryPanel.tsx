'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useHistory } from '@/lib/ziwei/history';
import { formToSearchParams } from '@/lib/ziwei/share';
import {
  clearHemingHistory,
  HEMING_HISTORY_UPDATE_EVENT,
  loadHemingHistory,
  removeHemingHistory,
  type HemingHistoryEntry,
} from '@/lib/ziwei/heming-history';
import {
  clearAllAiChatEntries,
  deleteAiChatEntry,
  listAllAiChatEntries,
  type AiChatHistoryEntry,
} from '@/lib/ziwei/ai-chat-history';

type TabKey = 'chart' | 'heming' | 'aichat';

function actionBtn(variant: 'default' | 'danger' = 'default') {
  return {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--bdr)',
    background: variant === 'danger' ? 'transparent' : 'var(--bg-2)',
    color: variant === 'danger' ? 'var(--ji, #b04545)' : 'var(--tx-2)',
    fontSize: '14px',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  } as const;
}

function formatTime(value: number) {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function HistoryRow({
  title,
  subtitle,
  badge,
  onOpen,
  onDelete,
}: {
  title: string;
  subtitle: string;
  badge: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="history-panel-row"
      onMouseEnter={event => {
        event.currentTarget.style.borderColor = 'var(--ac)';
        event.currentTarget.style.background = 'var(--bg-1)';
      }}
      onMouseLeave={event => {
        event.currentTarget.style.borderColor = 'var(--bdr)';
        event.currentTarget.style.background = 'transparent';
      }}
    >
      <span className="history-panel-badge">{badge}</span>
      <div className="history-panel-row-main">
        <div className="history-panel-row-title">{title}</div>
        <div className="history-panel-row-subtitle">{subtitle}</div>
      </div>
      <button type="button" onClick={onOpen} style={actionBtn()}>查看</button>
      <button
        type="button"
        onClick={() => {
          if (confirm('确定删除这条记录吗?')) onDelete();
        }}
        style={actionBtn('danger')}
        title="删除"
      >
        ✕
      </button>
    </div>
  );
}

function EmptyState({ text, cta, link }: { text: string; cta: string; link: string }) {
  return (
    <div className="history-panel-empty">
      <p>{text}</p>
      <Link href={link}>{cta} →</Link>
    </div>
  );
}

export default function HistoryPanel({
  embedded = false,
  active = true,
}: {
  embedded?: boolean;
  active?: boolean;
}) {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const { history, remove, clearAll } = useHistory();
  const [tab, setTab] = useState<TabKey>('chart');
  const [search, setSearch] = useState('');
  const [hemingHistory, setHemingHistory] = useState<HemingHistoryEntry[]>([]);
  const [aiChats, setAiChats] = useState<AiChatHistoryEntry[]>([]);
  const [activeChatToken, setActiveChatToken] = useState<string | null>(null);

  const userKey = user?.userId || 'anon';

  const reloadLocalHistory = useCallback(() => {
    setHemingHistory(loadHemingHistory());
    if (typeof window !== 'undefined') {
      setAiChats(listAllAiChatEntries(userKey));
    }
  }, [userKey]);

  useEffect(() => {
    if (loading) return;
    reloadLocalHistory();
  }, [loading, reloadLocalHistory]);

  useEffect(() => {
    if (!active || loading) return;
    reloadLocalHistory();
  }, [active, loading, reloadLocalHistory]);

  useEffect(() => {
    if (tab !== 'heming' || !active || loading) return;
    setHemingHistory(loadHemingHistory());
  }, [tab, active, loading]);

  useEffect(() => {
    const refreshHeming = () => setHemingHistory(loadHemingHistory());
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'heming_history_v1' || event.key === null) {
        refreshHeming();
      }
    };
    window.addEventListener(HEMING_HISTORY_UPDATE_EVENT, refreshHeming);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refreshHeming);
    return () => {
      window.removeEventListener(HEMING_HISTORY_UPDATE_EVENT, refreshHeming);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refreshHeming);
    };
  }, []);

  const filteredCharts = useMemo(() => {
    if (!search) return history;
    const q = search.toLowerCase();
    return history.filter(item => item.label.toLowerCase().includes(q));
  }, [history, search]);

  const filteredHeming = useMemo(() => {
    if (!search) return hemingHistory;
    const q = search.toLowerCase();
    return hemingHistory.filter(item =>
      item.labelA.toLowerCase().includes(q) || item.labelB.toLowerCase().includes(q),
    );
  }, [hemingHistory, search]);

  const filteredAiChats = useMemo(() => {
    if (!search) return aiChats;
    const q = search.toLowerCase();
    return aiChats.filter(item => item.preview.toLowerCase().includes(q));
  }, [aiChats, search]);

  const activeChat = useMemo(
    () => (activeChatToken ? aiChats.find(item => item.chartToken === activeChatToken) ?? null : null),
    [activeChatToken, aiChats],
  );

  const counts = {
    chart: history.length,
    heming: hemingHistory.length,
    aichat: aiChats.length,
  };

  const exportCurrentTab = () => {
    let data: unknown;
    let filename: string;
    if (tab === 'chart') {
      data = history;
      filename = `紫微-命盘历史-${Date.now()}.json`;
    } else if (tab === 'heming') {
      data = hemingHistory;
      filename = `紫微-合盘历史-${Date.now()}.json`;
    } else {
      data = aiChats;
      filename = `紫微-AI对话历史-${Date.now()}.json`;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const clearCurrentTab = () => {
    const message = tab === 'chart'
      ? '清空所有命盘历史?'
      : tab === 'heming'
        ? '清空所有合盘历史?'
        : '清空所有 AI 对话历史?';
    if (!confirm(`${message}\n\n此操作不可撤销。`)) return;

    if (tab === 'chart') {
      clearAll();
    } else if (tab === 'heming') {
      clearHemingHistory();
      setHemingHistory([]);
    } else {
      clearAllAiChatEntries(userKey);
      setAiChats([]);
      setActiveChatToken(null);
    }
  };

  if (loading) {
    return <div className="history-panel-loading">加载中…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="history-panel-login">
        <h2>登录后查看你的记录</h2>
        <p>命盘、合盘、AI 对话记录都保存在你的账号里，登录后换设备也能随时查看。未登录时排盘不会保存。</p>
        <Link href="/">返回首页登录 →</Link>
      </div>
    );
  }

  return (
    <div className={embedded ? 'history-panel history-panel--embedded' : 'history-panel'}>
      <div className="history-panel-tabs">
        {([
          { key: 'chart' as const, label: `命盘 (${counts.chart})`, desc: '你起过的盘' },
          { key: 'heming' as const, label: `合盘 (${counts.heming})`, desc: '你做过的合盘' },
          { key: 'aichat' as const, label: `AI 对话 (${counts.aichat})`, desc: '与 AI 的聊天记录' },
        ]).map(item => (
          <button
            key={item.key}
            type="button"
            className={tab === item.key ? 'is-active' : ''}
            onClick={() => setTab(item.key)}
            title={item.desc}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="history-panel-toolbar">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="搜索…"
        />
        <button type="button" onClick={exportCurrentTab} style={actionBtn()} title="导出当前 tab 数据为 JSON 文件 (个保法 §15 数据可携权)">
          导出 JSON
        </button>
        <button type="button" onClick={clearCurrentTab} style={actionBtn('danger')} title="清空当前 tab 所有记录 (个保法 §47 删除权)">
          清空
        </button>
      </div>

      <div>
        {tab === 'chart' && (
          filteredCharts.length === 0
            ? <EmptyState text="还没有命盘记录" cta="去起一张盘" link="/chart" />
            : filteredCharts.map(item => (
              <HistoryRow
                key={item.id}
                badge="命盘"
                title={item.label}
                subtitle={formatTime(item.savedAt)}
                onOpen={() => router.push(`/chart?${formToSearchParams(item.form).toString()}`)}
                onDelete={() => remove(item.id)}
              />
            ))
        )}

        {tab === 'heming' && (
          filteredHeming.length === 0
            ? <EmptyState text="还没有合盘记录" cta="去做一次合盘" link="/heming" />
            : filteredHeming.map(item => (
              <HistoryRow
                key={item.id}
                badge="合盘"
                title={`${item.labelA}  ✦  ${item.labelB}`}
                subtitle={formatTime(item.savedAt)}
                onOpen={() => {
                  try {
                    localStorage.setItem('heming_session_v1', JSON.stringify({
                      formA: item.formA,
                      formB: item.formB,
                      chartA: null,
                      chartB: null,
                      analysis: '',
                      followUps: [],
                      savedAt: Date.now(),
                    }));
                  } catch {}
                  router.push('/heming');
                }}
                onDelete={() => {
                  removeHemingHistory(item.id);
                  setHemingHistory(loadHemingHistory());
                }}
              />
            ))
        )}

        {tab === 'aichat' && (
          filteredAiChats.length === 0
            ? <EmptyState text="还没有 AI 对话历史" cta="去问 AI 一个问题" link="/chart" />
            : filteredAiChats.map(item => (
              <HistoryRow
                key={item.chartToken}
                badge="AI 对话"
                title={`${item.preview}${item.preview.length >= 40 ? '…' : ''}`}
                subtitle={`共 ${item.messageCount} 条消息`}
                onOpen={() => setActiveChatToken(item.chartToken)}
                onDelete={() => {
                  deleteAiChatEntry(userKey, item.chartToken);
                  setAiChats(prev => prev.filter(chat => chat.chartToken !== item.chartToken));
                  if (activeChatToken === item.chartToken) setActiveChatToken(null);
                }}
              />
            ))
        )}
      </div>

      <div className="history-panel-privacy">
        <p><strong>关于您的数据</strong></p>
        <p>
          登录后,命盘记录保存在你的账号中(服务器),换设备登录也能查看,可随时在本页删除;合盘与 AI 对话记录目前仍保存在本机浏览器(localStorage)。未登录时不保存任何记录。 您随时可通过本页&quot;导出 JSON / 清空&quot;行使《个人信息保护法》§15 数据可携权与 §47 删除权。
        </p>
      </div>

      {activeChat && (
        <div className="history-panel-chat-overlay" onClick={() => setActiveChatToken(null)}>
          <div className="history-panel-chat-modal" onClick={event => event.stopPropagation()}>
            <div className="history-panel-chat-head">
              <span>✦</span>
              <div className="history-panel-chat-title">{activeChat.preview}</div>
              <span>共 {activeChat.messageCount} 条</span>
              <button type="button" onClick={() => setActiveChatToken(null)} style={actionBtn()} title="关闭">✕</button>
            </div>
            <div className="history-panel-chat-body">
              {activeChat.messages.map((message, index) => (
                message.role === 'user' ? (
                  <div key={index} className="history-panel-chat-user">
                    <div>{message.content}</div>
                  </div>
                ) : (
                  <div key={index} className="history-panel-chat-assistant">
                    <div>{message.content}</div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
