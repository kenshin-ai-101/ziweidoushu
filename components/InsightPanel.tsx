'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { getChartToken } from '@/lib/ziwei/chart-token';
import {
  CHART_TOPIC_TABS_ALL,
  COLLAPSIBLE_SECTION_TITLES,
  PALACE_ROLES,
  PALACE_TO_TOPIC,
  type TopicKey,
} from '@/lib/ziwei/db-analysis';
import ChatPanel from '@/components/ChatPanel';

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

type PanelMode = 'analysis' | 'chat';
type AnalysisCache = Partial<Record<string, string>>;

const OVERVIEW_AXES = [
  { key: 'career', label: '事业' },
  { key: 'wealth', label: '财运' },
  { key: 'love', label: '感情' },
  { key: 'personality', label: '性格' },
  { key: 'health', label: '健康' },
  { key: 'overall', label: '综合' },
] as const;

function palaceMajorText(chart: ZiweiChart, palaceName: string) {
  const palace = chart.palaces.find(p => p.name === palaceName || (palaceName === '仆役' && p.name === '交友'));
  const majors = palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
  if (majors.length > 0) return majors.join('·');
  if (palace?.borrowedStars?.length) return `借${palace.borrowedStars.join('·')}`;
  return '借天机';
}

function getOverviewHeadline(chart: ZiweiChart) {
  const ming = chart.palaces.find(p => p.isMingGong || p.branch === chart.mingGongBranch);
  const names = new Set([...(ming?.stars ?? []).map(s => s.name), ...(ming?.borrowedStars ?? [])]);
  if (names.has('天机') && names.has('巨门')) return '机敏善谋，智珠在握';
  if (names.has('紫微')) return '帝星临命，格局自开';
  if (names.has('武曲')) return '刚毅守成，财星有力';
  return '天机为智慧星，宜辅佐不宜独当，最忌善变而无成。';
}

function makeAnalysisCacheKey(
  topic: TopicKey,
  options: {
    view: TimeView;
    liunianYear: number;
    liuyueMonth: number;
    liuriDay: number;
    liushiHour: number;
  },
) {
  return [
    topic,
    options.view,
    options.liunianYear,
    options.liuyueMonth,
    options.liuriDay,
    options.liushiHour,
  ].join(':');
}

function findPalace(chart: ZiweiChart, palaceName: string) {
  return chart.palaces.find(p => p.name === palaceName || (palaceName === '仆役' && p.name === '交友'));
}

function palaceScore(palace?: Palace) {
  if (!palace) return 50;
  let score = 52;
  const stars = palace.stars.length > 0 ? palace.stars : (palace.borrowedStars ?? []).map(name => ({ name, type: 'major' as const }));
  for (const star of stars) {
    if (star.type === 'major') score += 9;
    else if (star.type === 'lucky') score += 6;
    else if (star.type === 'sha') score -= 7;
    else score += 1;
    if ('brightness' in star && star.brightness === 'bright') score += 6;
    if ('brightness' in star && star.brightness === 'dim') score -= 6;
    if ('siHua' in star && star.siHua === '禄') score += 8;
    if ('siHua' in star && star.siHua === '权') score += 6;
    if ('siHua' in star && star.siHua === '科') score += 5;
    if ('siHua' in star && star.siHua === '忌') score -= 10;
  }
  return Math.max(32, Math.min(92, score));
}

function OverviewVisual({ chart }: { chart: ZiweiChart }) {
  const center = 130;
  const radii = [34, 55, 76, 96];
  const axisPalace: Record<string, string> = {
    career: '官禄',
    wealth: '财帛',
    love: '夫妻',
    personality: '命宫',
    health: '疾厄',
    overall: '迁移',
  };
  const values = OVERVIEW_AXES.map(axis => palaceScore(findPalace(chart, axisPalace[axis.key])));
  const points = OVERVIEW_AXES.map((_, i) => {
    const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
    const r = values[i] / 100 * 96;
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  });
  const grid = radii.map(r => OVERVIEW_AXES.map((_, i) => {
    const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
  }).join(' '));

  return (
    <div className="overview-visual">
      <div className="overview-kicker">
        命宫主星 · {palaceMajorText(chart, '命宫')}（智星）
        <span>机月同梁</span>
        <span>命宫空宫 · 借星论</span>
      </div>
      <h2 className="overview-title">{getOverviewHeadline(chart)}</h2>
      <div className="overview-radar-wrap">
        <svg className="overview-radar" viewBox="0 0 260 260" aria-hidden="true">
          {grid.map((pts, i) => (
            <polygon key={i} points={pts} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
          ))}
          {OVERVIEW_AXES.map((_, i) => {
            const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
            return (
              <line
                key={_.key}
                x1={center}
                y1={center}
                x2={center + Math.cos(angle) * 108}
                y2={center + Math.sin(angle) * 108}
                stroke="rgba(0,0,0,0.07)"
              />
            );
          })}
          <polygon points={points.map(p => p.join(',')).join(' ')} fill="rgba(85,91,210,0.16)" stroke="rgb(86,91,206)" strokeWidth="2" />
          {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="rgb(86,91,206)" />)}
        </svg>
        {OVERVIEW_AXES.map((axis, i) => {
          const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
          const x = center + Math.cos(angle) * 126;
          const y = center + Math.sin(angle) * 116;
          return (
            <div key={axis.key} className="overview-axis-label" style={{ left: `${x / 260 * 100}%`, top: `${y / 260 * 100}%` }}>
              <strong>{axis.label}</strong>
              <span>{palaceMajorText(chart, axisPalace[axis.key])}</span>
            </div>
          );
        })}
      </div>
      <p className="overview-footnote">六维强度依本盘星曜庙旺与格局推算，仅供参考</p>
      <div className="overview-cards">
        <div>
          <span>优</span>
          <strong>核心优势</strong>
          <p>策划应变一流，能于乱中看见先机，是天生的军师。</p>
        </div>
        <div>
          <span>合</span>
          <strong>关系模式</strong>
          <p>重沟通、喜知心，遇善解人意者方能交心。</p>
        </div>
        <div>
          <span>课</span>
          <strong>成长课题</strong>
          <p>思虑过动易摇摆，定守一处、做深一件，方能成器。</p>
        </div>
      </div>
    </div>
  );
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
    <div style={{ paddingTop: index === 0 ? 0 : isH2 ? 20 : 18, paddingBottom: 6 }}>
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
          className={
            isOverview
              ? 'insight-section-title insight-section-title--overview'
              : isH2
                ? 'insight-section-title insight-section-title--h2'
                : 'insight-section-title'
          }
        >
          {section.title.replace(/^【|】$/g, '')}
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
  if (line.trim() === '---') return <div className="insight-separator" />;
  const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
  if (sectionMatch) {
    return (
      <div className="pt-2 pb-0.5">
        <span className="insight-inline-marker">
          【{sectionMatch[1]}】
        </span>
      </div>
    );
  }
  const isQuote = line.trim().startsWith('>');
  const cleanLine = isQuote ? line.trim().replace(/^>\s*/, '') : line;
  const parts = cleanLine.split(/\*\*(.+?)\*\*/);
  return (
    <div className={isQuote ? 'insight-body-line insight-body-line--quote' : 'insight-body-line'}>
      {parts.map((part, j) =>
        j % 2 === 0
          ? part
          : <strong key={j}>{part}</strong>,
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
      current = { title: h1[1], level: 'h1', body: [], collapsible: isCollapsibleSection(h1[1]) };
      continue;
    }
    const h2 = line.match(/^#{2,3}\s+(.+)$/);
    if (h2) {
      flush();
      current = { title: h2[1], level: 'h2', body: [], collapsible: isCollapsibleSection(h2[1]) };
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

function extractHeadline(text: string): string | null {
  const match = text.match(/\*\*【一句话定调】\*\*\s*\n(.+?)(?:\n|$)/);
  return match?.[1]?.trim() ?? null;
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
  onExport,
}: {
  chart: ZiweiChart;
  timeView?: TimeView;
  liunianYear?: number;
  liuyueMonth?: number;
  liuriDay?: number;
  liushiHour?: number;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
  onExport?: () => void;
}) {
  const [panelMode, setPanelMode] = useState<PanelMode>('analysis');
  const [tabCache, setTabCache] = useState<AnalysisCache>({});
  const tabCacheRef = useRef(tabCache);
  tabCacheRef.current = tabCache;

  const [content, setContent] = useState('');
  const [activeTopic, setActiveTopic] = useState<TopicKey>('overview');
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);

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
    const cacheKey = makeAnalysisCacheKey(topic, analysisOptions);
    const cached = tabCacheRef.current[cacheKey];
    if (cached) {
      setContent(cached);
      return;
    }
    setContent('正在生成…');
    try {
      const text = await fetchAnalysis(chart, topic, analysisOptions);
      if (activeTopicRef.current !== topic) return;
      setTabCache(prev => ({ ...prev, [cacheKey]: text }));
      setContent(text);
    } catch (err) {
      if (activeTopicRef.current !== topic) return;
      setContent(err instanceof Error ? err.message : '分析获取失败，请稍后重试');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, chartToken, timeView, liunianYear, liuyueMonth, liuriDay, liushiHour]);

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
          const seededTabs = Object.fromEntries(
            Object.entries(data.tabs as Record<TopicKey, string>).map(([topic, text]) => [
              makeAnalysisCacheKey(topic as TopicKey, analysisOptions),
              text,
            ]),
          );
          setTabCache(prev => ({ ...seededTabs, ...prev }));
          const current = activeTopicRef.current;
          if (data.tabs[current] && analysisOptions.view === 'mingpan') setContent(data.tabs[current]);
        }
      } catch { /* fallback */ }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chart, chartToken, timeView, liunianYear, liuyueMonth, liuriDay, liushiHour]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    activeTopicRef.current = 'overview';
    setActiveTopic('overview');
    void loadTopic('overview');
  }, [chart, chartToken]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setPanelMode('analysis');

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

      setPanelMode('analysis');
      const prompt = `请分析【${viewLabel}${selectedSiHua.starName}化${selectedSiHua.siHua}】落于【${palaceName}】的飞化影响，按结构输出：
**【一句话结论】** **【核心判断】** **【命盘依据】** **【风险提醒】** **【行动建议】**`;

      setContent('正在生成…');
      void streamFollowUp(prompt);
    }
  }, [selectedPalace, selectedSiHua, chart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicClick = async (topic: TopicKey) => {
    lastFocusKey.current = '';
    activeTopicRef.current = topic;
    setActiveTopic(topic);
    setPanelMode('analysis');
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

  if (panelMode === 'chat') {
    return (
      <div className="insight-panel-root insight-panel-root--chat">
        <div className="insight-flip-bar">
          <div className="insight-flip-seg">
            <button type="button" onClick={() => setPanelMode('analysis')}>命盘分析</button>
            <button type="button" className="active" onClick={() => setPanelMode('chat')}>AI 对话</button>
          </div>
          <button type="button" className="insight-flip-util" aria-label="下载命盘" onClick={onExport}>↓</button>
        </div>
        <ChatPanel chart={chart} embedded />
      </div>
    );
  }

  const headline = activeTopic === 'overview' ? extractHeadline(content) : null;

  return (
    <div className="insight-panel-root">
      <div className="insight-flip-bar">
        <div className="insight-flip-seg">
          <button type="button" className="active" onClick={() => setPanelMode('analysis')}>命盘分析</button>
          <button type="button" onClick={() => setPanelMode('chat')}>AI 对话</button>
        </div>
        <button type="button" className="insight-flip-util" aria-label="下载命盘" onClick={onExport}>↓</button>
      </div>

      <div className="insight-topics">
        <div className="insight-topic-seg insight-topic-seg--wrap">
          {CHART_TOPIC_TABS_ALL.map(t => (
            <button
              key={t.key}
              type="button"
              className={activeTopic === t.key ? 'seg-active' : ''}
              onClick={() => void handleTopicClick(t.key)}
              disabled={loading || followUpLoading}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={bodyRef} className="insight-analysis-body">
        {!content && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="insight-loading-text animate-pulse">命格解读生成中…</p>
          </div>
        )}
        {content && activeTopic === 'overview' && !followUpLoading && !content.startsWith('正在生成') && (
          <>
            <OverviewVisual chart={chart} />
            <div className="overview-detail overview-detail--api">
              <AiContent text={content} streaming={followUpLoading} />
            </div>
          </>
        )}
        {content && activeTopic !== 'overview' && (
          <>
            {headline && (
              <h2 className="insight-headline">{headline}</h2>
            )}
            <div className="insight-kicker mb-2 flex items-center gap-1.5">
              <span className="insight-kicker-mark">✦</span>
              命理解读
            </div>
            <AiContent text={content} streaming={followUpLoading} />
          </>
        )}
      </div>

      <div className="insight-ai-input">
        <div className="flex gap-2">
          <input
            type="text"
            value={followUp}
            onChange={e => setFollowUp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleFollowUp()}
            placeholder="继续追问，如：今年的事业格局有什么特点？"
            disabled={followUpLoading || loading}
          />
          <button
            type="button"
            onClick={handleFollowUp}
            disabled={followUpLoading || loading || !followUp.trim()}
          >
            {followUpLoading ? '…' : '追问'}
          </button>
        </div>
      </div>
    </div>
  );
}
