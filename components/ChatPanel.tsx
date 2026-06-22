'use client';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { buildChatCacheKey, getChartToken } from '@/lib/ziwei/chart-token';
import {
  readInterpretStream,
  requestInterpret,
  writeInterpretCache,
  type InterpretMessage,
} from '@/lib/ziwei/interpret-client';
import { useQuotaRemaining } from '@/hooks/use-quota-remaining';
import {
  syncQuotaRemaining,
} from '@/lib/ziwei/quota-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPanelHandle {
  sendMessage: (text: string, options?: { forceFresh?: boolean }) => Promise<void>;
}

interface ChatPanelProps {
  chart: ZiweiChart;
  /** 嵌入 insight-panel-root 时使用，去掉外层 card 样式 */
  embedded?: boolean;
}

const PRESET_QUESTIONS = [
  '我的整体命格如何？性格特点是什么？',
  '我的感情婚姻运势如何？',
  '我的事业财运如何？适合什么方向？',
  '我现在的大限运势如何？',
  '我的健康需要注意什么？',
  '今年的流年运势如何？',
];

let messageSeq = 0;
function nextMessageId() {
  messageSeq += 1;
  return `msg-${messageSeq}`;
}

function toApiMessages(messages: Message[]): InterpretMessage[] {
  return messages.map(msg => ({ role: msg.role, content: msg.content }));
}

const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(function ChatPanel(
  { chart, embedded },
  ref,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const quotaRemaining = useQuotaRemaining();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const loadingRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);
  const chartToken = getChartToken(chart);

  messagesRef.current = messages;
  loadingRef.current = loading;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
  }, []);

  const scheduleScrollToBottom = useCallback(() => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      scrollToBottom('auto');
    });
  }, [scrollToBottom]);

  useEffect(() => () => {
    if (scrollRafRef.current != null) {
      window.cancelAnimationFrame(scrollRafRef.current);
    }
  }, []);

  const applyQuotaResult = (remaining?: number) => {
    if (remaining != null && Number.isFinite(remaining)) {
      syncQuotaRemaining(Math.max(0, remaining));
    }
  };

  const sendMessage = useCallback(async (text: string, options?: { forceFresh?: boolean }) => {
    const trimmed = text.trim();
    if (!trimmed || loadingRef.current) return;

    const userMsg: Message = { id: nextMessageId(), role: 'user', content: trimmed };
    const requestMessages = [...messagesRef.current, userMsg];
    const apiMessages = toApiMessages(requestMessages);
    const cacheKey = buildChatCacheKey(chartToken, apiMessages);

    messagesRef.current = requestMessages;
    loadingRef.current = true;
    setMessages(requestMessages);
    setInput('');
    setLoading(true);
    scheduleScrollToBottom();

    const assistantId = nextMessageId();

    const appendAssistant = (content: string) => {
      const withAssistant = [
        ...requestMessages,
        { id: assistantId, role: 'assistant' as const, content },
      ];
      messagesRef.current = withAssistant;
      setMessages(withAssistant);
      scheduleScrollToBottom();
    };

    const updateAssistant = (content: string) => {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        updated[updated.length - 1] = { ...last, content };
        messagesRef.current = updated;
        return updated;
      });
      scheduleScrollToBottom();
    };

    try {
      const result = await requestInterpret({
        chart,
        messages: apiMessages,
        forceFresh: options?.forceFresh,
        cacheKey,
      });

      if (!result.ok) {
        applyQuotaResult(result.quotaRemaining);
        appendAssistant(result.error);
        return;
      }

      applyQuotaResult(result.quotaRemaining);

      if (result.cached) {
        appendAssistant(result.text);
        return;
      }

      appendAssistant('');
      const assistantText = await readInterpretStream(result.reader, updateAssistant);
      if (assistantText) writeInterpretCache(cacheKey, assistantText);
    } catch {
      appendAssistant('解读失败，请检查API配置或稍后重试。');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      scheduleScrollToBottom();
    }
  }, [chart, chartToken, scheduleScrollToBottom]);

  useImperativeHandle(ref, () => ({ sendMessage }), [sendMessage]);

  const renderMessage = (msg: Message, index: number) => {
    const bubble = (
      <div
        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed"
          style={msg.role === 'user' ? {
            background: 'rgba(212,168,67,0.1)',
            border: '1px solid rgba(212,168,67,0.2)',
            color: 'var(--t-gold)',
          } : {
            background: 'var(--t-card)',
            border: '1px solid var(--t-border)',
            color: 'var(--t-text)',
          }}
        >
          {msg.role === 'assistant' && (
            <div className="text-[10px] mb-1" style={{ color: 'var(--t-faint)' }}>命理师 ·</div>
          )}
          <div className="whitespace-pre-wrap text-xs leading-relaxed">
            {msg.content}
            {loading && index === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
              <span
                className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
                style={{ background: 'var(--t-gold)', opacity: 0.6 }}
              />
            )}
          </div>
        </div>
      </div>
    );

    if (embedded) {
      return <div key={msg.id}>{bubble}</div>;
    }

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed"
          style={msg.role === 'user' ? {
            background: 'rgba(212,168,67,0.1)',
            border: '1px solid rgba(212,168,67,0.2)',
            color: 'var(--t-gold)',
          } : {
            background: 'var(--t-card)',
            border: '1px solid var(--t-border)',
            color: 'var(--t-text)',
          }}
        >
          {msg.role === 'assistant' && (
            <div className="text-[10px] mb-1" style={{ color: 'var(--t-faint)' }}>命理师 ·</div>
          )}
          <div className="whitespace-pre-wrap text-xs leading-relaxed">
            {msg.content}
            {loading && index === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
              <span
                className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
                style={{ background: 'var(--t-gold)', opacity: 0.6 }}
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={embedded ? 'insight-chat-embedded insight-chat-layout' : 'flex flex-col h-full rounded-xl overflow-hidden card-glass'}>
      {embedded ? (
        <aside className="insight-chat-sidebar">
          <button
            type="button"
            className="insight-chat-new"
            onClick={() => {
              messagesRef.current = [];
              setMessages([]);
            }}
            disabled={loading}
          >
            + 新对话
          </button>
          <p className="insight-chat-sidebar-empty">历史对话将显示在这里</p>
        </aside>
      ) : null}

      <div className={embedded ? 'insight-chat-main' : 'flex flex-col h-full min-h-0 flex-1'}>
      {!embedded && (
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <h3 className="text-xs font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>AI 命盘解读</h3>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--t-faint)' }}>倪海夏正宗紫微斗数 · 智慧解析</p>
      </div>
      )}

      <div ref={scrollRef} className={embedded ? 'insight-chat-messages p-4 space-y-3 flex-1 overflow-y-auto min-h-0' : 'flex-1 overflow-y-auto p-4 space-y-3 min-h-0'}>
        {messages.length === 0 && (
          embedded ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.15 }}>✦</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--t-faint)' }}>
                问我关于这张盘的任何事
              </p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.15 }}>✦</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--t-faint)' }}>
                命盘已生成，可直接提问<br />或从下方选择常见问题开始解读
              </p>
            </motion.div>
          )
        )}

        {embedded ? (
          messages.map(renderMessage)
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(renderMessage)}
          </AnimatePresence>
        )}
      </div>

      {messages.length === 0 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => void sendMessage(q, { forceFresh: true })}
                disabled={loading || quotaRemaining <= 0}
                className="text-left text-[10px] rounded-lg px-2.5 py-2 transition-all line-clamp-2"
                style={{
                  color: 'var(--t-text2)',
                  border: '1px solid var(--t-border)',
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(212,168,67,0.3)';
                  e.currentTarget.style.color = 'var(--t-gold)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--t-border)';
                  e.currentTarget.style.color = 'var(--t-text2)';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={embedded ? 'insight-ai-input' : 'px-3 pb-3 pt-2 flex-shrink-0'} style={embedded ? undefined : { borderTop: '1px solid var(--t-border)' }}>
        {embedded ? (
          <div className="insight-chat-quota" title="每日 0 点（北京时间）重置">
            今日剩余 {quotaRemaining} 次
          </div>
        ) : null}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && void sendMessage(input)}
            placeholder={embedded ? '继续追问，如：今年的事业格局有什么特点？' : '输入问题，如：我的感情运势如何？'}
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={loading || !input.trim() || quotaRemaining <= 0}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {embedded ? '发送' : '解读'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
});

export default ChatPanel;
