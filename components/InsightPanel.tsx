'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { getChartToken } from '@/lib/ziwei/chart-token';
import {
  CHART_TOPIC_TABS_MAIN,
  CHART_TOPIC_TABS_EXTENDED,
  COLLAPSIBLE_SECTION_TITLES,
  FREE_TOPIC_KEYS,
  PALACE_ROLES,
  PALACE_TO_TOPIC,
  type TopicKey,
} from '@/lib/ziwei/db-analysis';

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  timeView?: TimeView;
  liunianYear?: number;
  liuyueMonth?: number;
  liuriDay?: number;
  liushiHour?: number;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

function useChartPro() {
  const isPro = process.env.NEXT_PUBLIC_CHART_PRO === 'true';
  return { isPro, isLoggedIn: true, loading: false };
}

function isCollapsibleSection(title: string): boolean {
  return COLLAPSIBLE_SECTION_TITLES.some(k => title.includes(k));
}

function AiSection({
  section,
  index,
  streaming,
}: {
  section: { title: string; level: 'h1' | 'h2'; body: string[]; collapsible: boolean };
  index: number;
  streaming?: boolean;
}) {
  const [open, setOpen] = useState(!section.collapsible);
  const isOverview = section.title.includes('总览');
  const isH2 = section.level === 'h2';

  if (!section.title) {
    return (
      <>
        {section.body.map((line, i) => (
          <AiLine key={i} line={line} streaming={streaming && i === section.body.length - 1} />
        ))}
      </>
    );
  }

  return (
    <div
      style={{
        paddingTop: index === 0 ? 0 : isH2 ? 20 : 18,
        paddingBottom: 6,
      }}
    >
      <div
        role={section.collapsible ? 'button' : undefined}
        tabIndex={section.collapsible ? 0 : undefined}
        aria-expanded={section.collapsible ? open : undefined}
        onClick={section.collapsible ? () => setOpen(v => !v) : undefined}
        onKeyDown={section.collapsible ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(v => !v);
          }
        } : undefined}
        className={section.collapsible ? 'insight-section-toggle' : undefined}
      >
        <span
          style={{
            fontSize: isOverview ? 22 : isH2 ? 15 : 18,
            fontWeight: 600,
            color: 'var(--t-text, var(--tx-1))',
            letterSpacing: '-0.01em',
          }}
        >
          {section.title.startsWith('【') ? section.title : `【${section.title}】`}
        </span>
        {section.collapsible && (
          <span className="insight-section-chevron" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>
            ›
          </span>
        )}
      </div>
      {(!section.collapsible || open) && section.body.map((line, i) => (
        <AiLine key={i} line={line} streaming={streaming && i === section.body.length - 1} />
      ))}
    </div>
  );
}

function AiLine({ line, streaming }: { line: string; streaming?: boolean }) {
  if (line.trim() === '') return <div className="h-1" />;
  const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
  if (sectionMatch) {
    return (
      <div className="pt-2 pb-0.5">
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
          【{sectionMatch[1]}】
        </span>
      </div>
    );
  }
  const parts = line.split(/\*\*(.+?)\*\*/);
  return (
    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2, var(--tx-2))' }}>
      {parts.map((part, j) =>
        j % 2 === 0
          ? part
          : <strong key={j} className="font-medium" style={{ color: 'var(--t-text, var(--tx-1))' }}>{part}</strong>,
      )}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

function parseSections(text: string) {
  const lines = text.split('\n');
  const sections: {
    title: string;
    level: 'h1' | 'h2';
    body: string[];
    collapsible: boolean;
  }[] = [];
  let current: (typeof sections)[number] | null = null;

  const flush = () => {
    if (current) sections.push(current);
    current = null;
  };

  for (const line of lines) {
    const h1 = line.match(/^\*\*【(.+?)】\*\*$/);
    if (h1) {
      flush();
      current = {
        title: h1[1],
        level: 'h1',
        body: [],
        collapsible: isCollapsibleSection(h1[1]),
      };
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      current = {
        title: h2[1],
        level: 'h2',
        body: [],
        collapsible: isCollapsibleSection(h2[1]),
      };
      continue;
    }
    if (!current) {
      current = { title: '', level: 'h1', body: [], collapsible: false };
    }
    current.body.push(line);
  }
  flush();
  return sections;
}

function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const sections = parseSections(text);
  return (
    <div className={`space-y-0.5${streaming ? ' ai-streaming' : ''}`}>
      {sections.map((section, i) => (
        <AiSection key={i} section={section} index={i} streaming={streaming} />
      ))}
    </div>
  );
}

async function fetchAnalysis(
  chart: ZiweiChart,
  topic: TopicKey,
  options: {
    view: TimeView;
    liunianYear: number;
    liuyueMonth: number;
    liuriDay: number;
    liushiHour: number;
  },
): Promise<string> {
  const chartToken = getChartToken(chart);
  if (!chartToken) return '会话已过期，请回到首页重新填写生辰起盘。';

  const res = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chart, chartToken, topic, options }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))).error;
    throw new Error(err || `分析获取失败 (${res.status})`);
  }

  const data = await res.json();
  return data.text as string;
}

export default function InsightPanel({
  chart,
  timeView = 'mingpan',
  liunianYear = new Date().getFullYear(),
  liuyueMonth = new Date().getMonth() + 1,
  liuriDay = new Date().getDate(),
  liushiHour = 0,
  selectedPalace,
  selectedSiHua,
}: InsightPanelProps) {
  const { isPro, loading: proLoading } = useChartPro();
  const [tabCache, setTabCache] = useState<Partial<Record<TopicKey, string>>>({});
  const tabCacheRef = useRef(tabCache);
  tabCacheRef.current = tabCache;

  const [content, setContent] = useState('');
  const [activeTopic, setActiveTopic] = useState<TopicKey>('overview');
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [showProGate, setShowProGate] = useState(false);

  const activeTopicRef = useRef<TopicKey>('overview');
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastFocusKey = useRef('');
  const skipTopicEffect = useRef(false);
  const chartToken = getChartToken(chart);

  const analysisOptions = {
    view: timeView,
    liunianYear,
    liuyueMonth,
    liuriDay,
    liushiHour,
  };

  const loadTopic = useCallback(async (topic: TopicKey) => {
    const cached = tabCacheRef.current[topic];
    if (cached) {
      setContent(cached);
      return;
    }
    setContent('正在生成…');
    try {
      const text = await fetchAnalysis(chart, topic, analysisOptions);
      if (activeTopicRef.current !== topic) return;
      setTabCache(prev => ({ ...prev, [topic]: text }));
      setContent(text);
    } catch (err) {
      if (activeTopicRef.current !== topic) return;
      setContent(err instanceof Error ? err.message : '分析获取失败，请稍后重试');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, chartToken, timeView, liunianYear, liuyueMonth, liuriDay, liushiHour]);

  // Preload db tabs (生产 lookup-tabs)
  useEffect(() => {
    if (!chartToken) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/lookup-tabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chart, chartToken }),
        });
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (data?.source === 'db' && data.tabs) {
          setTabCache(prev => ({ ...data.tabs, ...prev }));
          const current = activeTopicRef.current;
          if (data.tabs[current]) setContent(data.tabs[current]);
        }
      } catch { /* fallback to per-tab fetch */ }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chart, chartToken]);

  // Initial overview
  useEffect(() => {
    activeTopicRef.current = 'overview';
    setActiveTopic('overview');
    void loadTopic('overview');
  }, [chart, chartToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Topic switch
  useEffect(() => {
    if (skipTopicEffect.current) {
      skipTopicEffect.current = false;
      return;
    }
    if (lastFocusKey.current) return;
    void loadTopic(activeTopic);
  }, [activeTopic, loadTopic]);

  const streamFollowUp = async (prompt: string) => {
    setFollowUpLoading(true);
    const prefixRef = { value: '' };
    setContent(prev => {
      prefixRef.value = prev && !prev.startsWith('正在生成') ? `${prev}\n\n---\n\n` : '';
      return prefixRef.value;
    });
    let assistantText = '';
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok || !res.body) throw new Error('请求失败');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            assistantText += JSON.parse(data).delta?.text ?? '';
            setContent(`${prefixRef.value}${assistantText}`);
          } catch { /* skip */ }
        }
      }
    } catch {
      setContent(`${prefixRef.value}解读失败，请稍后重试。`);
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Palace / 四化 focus（生产 focus 模式 → AI 追问结构）
  useEffect(() => {
    if (selectedPalace) {
      const key = `palace-${selectedPalace.branch}`;
      if (key === lastFocusKey.current) return;
      lastFocusKey.current = key;

      const majors = selectedPalace.stars.filter(s => s.type === 'major');
      const starDesc = majors.length > 0
        ? majors.map(s => `${s.name}${s.siHua ? `化${s.siHua}` : ''}`).join('、')
        : '空宫（借对宫）';
      const role = PALACE_ROLES[selectedPalace.name] ?? '';
      const topic = PALACE_TO_TOPIC[selectedPalace.name] ?? 'overview';

      skipTopicEffect.current = true;
      activeTopicRef.current = topic;
      setActiveTopic(topic);

      const prompt = `请重点分析【${selectedPalace.name}】（主管：${role}），主星：${starDesc}，按结构输出：
**【一句话结论】** **【核心判断】** **【命盘依据】** **【风险提醒】** **【行动建议】**`;

      setContent('正在生成…');
      void streamFollowUp(prompt);
      return;
    }

    if (selectedSiHua) {
      const key = `sihua-${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
      if (key === lastFocusKey.current) return;
      lastFocusKey.current = key;

      const palaceOfStar = chart.palaces.find(p => p.stars.some(s => s.name === selectedSiHua.starName));
      const palaceName = palaceOfStar?.name ?? '';
      const viewLabel =
        selectedSiHua.view === 'daxian' ? '大限'
          : selectedSiHua.view === 'liunian' ? '流年'
            : selectedSiHua.view === 'liuyue' ? '流月'
              : selectedSiHua.view === 'liuri' ? '流日'
                : selectedSiHua.view === 'liushi' ? '流时'
                  : '本命';

      const prompt = `请分析【${viewLabel}${selectedSiHua.starName}化${selectedSiHua.siHua}】落于【${palaceName}】的飞化影响，按结构输出：
**【一句话结论】** **【核心判断】** **【命盘依据】** **【风险提醒】** **【行动建议】**`;

      setContent('正在生成…');
      void streamFollowUp(prompt);
    }
  }, [selectedPalace, selectedSiHua, chart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicClick = async (topic: TopicKey) => {
    if (!FREE_TOPIC_KEYS.has(topic) && !isPro && !proLoading) {
      setShowProGate(true);
      return;
    }
    lastFocusKey.current = '';
    activeTopicRef.current = topic;
    setActiveTopic(topic);
    setLoading(true);
    bodyRef.current && (bodyRef.current.scrollTop = 0);
    await loadTopic(topic);
    setLoading(false);
  };

  const handleFollowUp = () => {
    const text = followUp.trim();
    if (!text || followUpLoading) return;
    setFollowUp('');
    void streamFollowUp(text);
  };

  return (
    <div className="insight-panel flex flex-col h-full rounded-xl overflow-hidden card-glass">
      {showProGate && (
        <div className="insight-pro-gate" onClick={() => setShowProGate(false)}>
          <div className="insight-pro-gate-card" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>专业版专属维度</p>
            <p className="text-[11px] mt-2" style={{ color: 'var(--t-faint)' }}>
              兄弟合伙、子女、迁移外出等 7 个深度维度需开通专业版。本地开发可设置环境变量 <code>NEXT_PUBLIC_CHART_PRO=true</code> 解锁。
            </p>
            <button type="button" className="insight-pro-gate-close" onClick={() => setShowProGate(false)}>
              知道了
            </button>
          </div>
        </div>
      )}

      <div className="insight-topic-bar flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="insight-topic-segments">
          {CHART_TOPIC_TABS_MAIN.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => void handleTopicClick(t.key)}
                disabled={loading || followUpLoading}
                className={isActive ? 'seg-active' : ''}
              >
                {t.label}
              </button>
            );
          })}
          <span className="insight-topic-divider" aria-hidden />
          {CHART_TOPIC_TABS_EXTENDED.map(t => {
            const isActive = activeTopic === t.key;
            const locked = !isPro && !proLoading;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => void handleTopicClick(t.key)}
                disabled={loading || followUpLoading}
                className={`${isActive ? 'seg-active' : ''}${locked ? ' seg-locked' : ''}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={bodyRef} className="insight-analysis-body flex-1 overflow-y-auto p-4 min-h-0">
        {!content && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>命格解读生成中…</p>
          </div>
        )}
        {content && (
          <>
            <div className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
              <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
              命理解读
            </div>
            <AiContent text={content} streaming={followUpLoading} />
          </>
        )}
      </div>

      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={followUp}
            onChange={e => setFollowUp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleFollowUp()}
            placeholder="继续追问，如：今年的事业格局有什么特点？"
            disabled={followUpLoading || loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            type="button"
            onClick={handleFollowUp}
            disabled={followUpLoading || loading || !followUp.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {followUpLoading ? '…' : '追问'}
          </button>
        </div>
      </div>
    </div>
  );
}
