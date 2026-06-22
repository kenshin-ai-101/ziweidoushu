'use client';

import { useCallback, useEffect, useState } from 'react';
import RightDrawer from '@/components/RightDrawer';
import { useAuth } from '@/hooks/use-auth';
import type { FeedbackCategory } from '@/lib/feedback/message-store';

const FEEDBACK_REPLY_READ_AT = 'feedback_reply_read_at';

const CATEGORY_LABELS: Record<FeedbackCategory, { label: string }> = {
  bug: { label: '故障 / 问题' },
  feature: { label: '建议 / 期待' },
  other: { label: '其他' },
};

interface FeedbackMessage {
  t: number;
  message: string;
  category?: FeedbackCategory;
  reply?: {
    reply: string;
    replyAt: number;
  };
}

interface ChartFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChartFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [latestReplyAt, setLatestReplyAt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user-message')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const messages = Array.isArray(data?.messages) ? data.messages as FeedbackMessage[] : [];
        const replyAt = messages.reduce((max, item) => {
          const value = item.reply?.replyAt ?? 0;
          return value > max ? value : max;
        }, 0);
        setLatestReplyAt(replyAt);
        if (!replyAt) return;
        let readAt = 0;
        try {
          readAt = Number(localStorage.getItem(FEEDBACK_REPLY_READ_AT)) || 0;
        } catch {}
        if (replyAt > readAt) setHasUnread(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="chart-topbar-toolbtn chart-topbar-toolbtn--feedback"
        title="留言反馈"
        onClick={event => {
          if (latestReplyAt > 0) {
            try {
              localStorage.setItem(FEEDBACK_REPLY_READ_AT, String(latestReplyAt));
            } catch {}
          }
          setHasUnread(false);
          setOpen(true);
          event.currentTarget.blur();
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5a2 2 0 0 1-2 2H8l-4 3.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        </svg>
        反馈
        {hasUnread && <span className="chart-topbar-feedback-dot" aria-label="有新回复" />}
      </button>
      <ChartFeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default function ChartFeedbackModal({ open, onClose }: ChartFeedbackModalProps) {
  const { isLoggedIn, loading } = useAuth();
  const [tab, setTab] = useState<'form' | 'history'>('form');
  const [category, setCategory] = useState<FeedbackCategory>('other');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const resetForm = useCallback(() => {
    setMessage('');
    setContact('');
    setCategory('other');
    setSubmitted(false);
    setError('');
    setTab('form');
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    window.setTimeout(resetForm, 300);
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open || tab !== 'history') return;
    let cancelled = false;
    setLoadingMessages(true);
    fetch('/api/user-message')
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setMessages(Array.isArray(data?.messages) ? data.messages : []);
        }
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab]);

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('请填写留言内容');
      return;
    }
    if (trimmed.length > 1000) {
      setError('留言不能超过 1000 字');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/user-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          contact: contact.trim() || undefined,
          category,
          page: window.location.pathname,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || '提交失败');
      }
      setSubmitted(true);
      window.setTimeout(handleClose, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RightDrawer open={open} onClose={handleClose} title="反馈 / 留言" width={440}>
      <div className="chart-feedback-drawer">
        <div className="chart-feedback-tabs" aria-label="反馈类型">
          {([
            ['form', '留言'],
            ['history', '我的记录'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'active' : ''}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="chart-feedback-note">
          <div className="chart-feedback-note-title">已知问题修复</div>
          <div>• AI 解读「请求被取消」已修复，超时从 35s→65s</div>
          <div>• 额度回滚已加强：断线不再扣次数</div>
          <div className="chart-feedback-note-date">更新于 2026-06-09</div>
        </div>

        {tab === 'form' ? (
          loading || isLoggedIn ? (
            submitted ? (
              <div className="chart-feedback-success">
                <div>感谢你的留言！</div>
                <div>我们会认真阅读每一条反馈</div>
              </div>
            ) : (
              <>
                <div className="chart-feedback-categories">
                  {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map(key => (
                    <button
                      key={key}
                      type="button"
                      className={category === key ? 'active' : ''}
                      onClick={() => setCategory(key)}
                    >
                      {CATEGORY_LABELS[key].label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="说说你遇到的问题、想要的功能，或任何反馈…"
                  rows={5}
                  maxLength={1000}
                />
                <div className="chart-feedback-counter">{message.length} / 1000</div>
                <input
                  type="text"
                  value={contact}
                  onChange={event => setContact(event.target.value)}
                  placeholder="联系方式（手机/邮箱/微信，选填）"
                  maxLength={100}
                />
                {error && <div className="chart-feedback-error">{error}</div>}
                <div className="chart-feedback-actions">
                  <button type="button" onClick={handleClose}>取消</button>
                  <button type="button" onClick={submit} disabled={submitting}>
                    {submitting ? '提交中…' : '提交留言'}
                  </button>
                </div>
              </>
            )
          ) : (
            <div className="chart-feedback-login">
              <div>登录后才能留言反馈</div>
              <p>
                留言将关联到你的账号——站长回复、问题补偿都能准确找到你。
                <br />
                请点击页面右上角「登录」，登录后回来即可留言。
              </p>
            </div>
          )
        ) : (
          <div className="chart-feedback-history">
            {loadingMessages ? (
              <div className="chart-feedback-history-empty">加载中…</div>
            ) : messages.length === 0 ? (
              <div className="chart-feedback-history-empty">
                暂无留言记录
                <div>切到「留言」提交反馈后可在此查看</div>
              </div>
            ) : (
              messages.map(item => (
                <div key={item.t} className="chart-feedback-history-item">
                  <div className="chart-feedback-history-message">{item.message}</div>
                  <div className="chart-feedback-history-meta">
                    {item.category && <span>{CATEGORY_LABELS[item.category]?.label ?? item.category}</span>}
                    {new Date(item.t).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {item.reply && (
                    <div className="chart-feedback-history-reply">
                      <div className="chart-feedback-history-reply-title">站长回复</div>
                      <div>{item.reply.reply}</div>
                      <div className="chart-feedback-history-meta">
                        {new Date(item.reply.replyAt).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </RightDrawer>
  );
}
