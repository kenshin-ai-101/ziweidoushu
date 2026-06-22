'use client';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import {
  syncHemingQuotaRemaining,
} from '@/lib/ziwei/heming-quota-client';
import { useHemingQuotaRemaining } from '@/hooks/use-quota-remaining';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { generateChart as buildChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';

interface HemingMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── AiContent 渲染器（与 InsightPanel 一致）────────────────
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} style={{ paddingTop: i === 0 ? 0 : '14px', paddingBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ac)', letterSpacing: '0.04em' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} style={{ height: '4px' }} />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} style={{ fontSize: '13px', lineHeight: 1.75, color: 'var(--tx-2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} style={{ fontWeight: 500, color: 'var(--tx-0)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span style={{
          display: 'inline-block', width: '7px', height: '13px',
          background: 'var(--ac)', opacity: 0.5, borderRadius: '2px',
          animation: 'pulse 1s ease-in-out infinite',
          verticalAlign: 'middle', marginLeft: '2px',
        }} />
      )}
    </div>
  );
}

export default function HemingPageClient({ serverQuotaRemaining }: { serverQuotaRemaining: number }) {
  // ─── 双方命盘状态 ─────────────────────────────────────────
  const [chartA, setChartA] = useState<ZiweiChart | null>(null);
  const [chartB, setChartB] = useState<ZiweiChart | null>(null);
  // 双方表单状态由 BirthForm onFormSave 同步到此处，统一按钮触发起盘
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);

  // ─── AI 合盘分析状态 ─────────────────────────────────────
  const [analysis, setAnalysis] = useState('');
  const [chatMessages, setChatMessages] = useState<HemingMessage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const quotaRemaining = useHemingQuotaRemaining(serverQuotaRemaining);
  const analysisRef = useRef<HTMLDivElement>(null);

  // ─── 起盘（本地算法，避免 dev 下 /api/generate 缓存异常）──
  const resolveChart = useCallback((info: BirthInfo): ZiweiChart | null => {
    try {
      return buildChart(info);
    } catch (err) {
      console.error('[heming] generateChart', err);
      return null;
    }
  }, []);

  // 表单是否填齐
  const isFormReady = (f: BirthFormState | null): boolean =>
    !!(f && f.year && f.month && f.day && f.gender && (f.unknownTime || (f.clockHour !== '' && f.clockMinute !== '')));

  // ─── 统一入口：起盘 + 合盘分析 ─────────────────────────────
  const runAnalysis = useCallback(async (q?: string) => {
    setFormError(null);
    if (!isFormReady(formA) || !isFormReady(formB)) {
      setFormError('请先填写双方完整出生信息');
      return;
    }
    if (quotaRemaining <= 0) {
      setAnalysisError('合盘今日免费次数已用完，明日 0 点（北京时间）重置');
      return;
    }

    const trimmedQuestion = q?.trim();
    const isFollowUp = Boolean(trimmedQuestion && analysis && chatMessages.length > 0);
    setAnalyzing(true);
    if (!isFollowUp) {
      setAnalysis('');
      setChatMessages([]);
    } else {
      setChatMessages(items => [
        ...items,
        { role: 'user', content: trimmedQuestion! },
        { role: 'assistant', content: '' },
      ]);
    }
    setAnalysisError(null);

    try {
      let cA = chartA;
      let cB = chartB;
      const newA = cA ?? resolveChart(formToBirthInfo(formA!));
      const newB = cB ?? resolveChart(formToBirthInfo(formB!));
      cA = newA;
      cB = newB;
      if (!cA || !cB) {
        setAnalysisError('起盘失败，请检查双方出生信息');
        setAnalyzing(false);
        return;
      }
      if (!chartA) setChartA(cA);
      if (!chartB) setChartB(cB);

      const res = await fetch('/api/heming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isFollowUp
            ? { chartA: cA, chartB: cB, question: trimmedQuestion, previousAnalysis: analysis, messages: chatMessages }
            : { chartA: cA, chartB: cB, question: trimmedQuestion || undefined },
        ),
      });

      const quotaHeader = res.headers.get('X-Quota-Remaining');
      if (quotaHeader) {
        const remaining = Number.parseInt(quotaHeader, 10);
        if (Number.isFinite(remaining)) {
          syncHemingQuotaRemaining(remaining);
        }
      }

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        setAnalysisError(payload.error ?? '合盘今日免费次数已用完');
        if (isFollowUp) setChatMessages(items => items.slice(0, -2));
        return;
      }

      if (!res.ok || !res.body) throw new Error('request_failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            text += delta;
            if (isFollowUp) {
              setChatMessages(items => {
                const next = [...items];
                if (next.length > 0) next[next.length - 1] = { role: 'assistant', content: text };
                return next;
              });
            } else {
              setAnalysis(text);
            }
          } catch { /* skip */ }
        }
      }

      const nextMessages: HemingMessage[] = isFollowUp
        ? [...chatMessages, { role: 'user', content: trimmedQuestion! }, { role: 'assistant', content: text }]
        : [
            { role: 'user', content: trimmedQuestion || '请对甲乙双方进行完整紫微合盘分析' },
            { role: 'assistant', content: text },
          ];
      setChatMessages(nextMessages);
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      if (isFollowUp) setChatMessages(items => items.slice(0, -2));
      setAnalysisError('分析暂时不可用，请重试');
    } finally {
      setAnalyzing(false);
    }
  }, [chartA, chartB, chatMessages, formA, formB, resolveChart, quotaRemaining]);

  const cardStyle = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.8) 100%)',
    border: '0.5px solid rgba(0,0,0,0.2)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(28px) saturate(190%) brightness(1.08)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%) brightness(1.08)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(255,255,255,0.1)',
  };

  const labelStyle = {
    fontSize: '14px', letterSpacing: '0.4em', color: '#666',
    marginBottom: '16px', display: 'block',
  };

  const followUpPairs = chatMessages.slice(2).reduce<Array<{ question: string; answer: string }>>((items, message) => {
    if (message.role === 'user') {
      items.push({ question: message.content, answer: '' });
    } else if (items.length > 0) {
      items[items.length - 1].answer = message.content;
    }
    return items;
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#000' }}>
      {/* 顶栏 */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 'clamp(14px, 2vw, 24px) clamp(16px, 3vw, 32px)',
        pointerEvents: 'none',
      }} className="heming-obys-header">
        <Link
          href="/"
          aria-label="回到首页"
          style={{
            pointerEvents: 'auto', cursor: 'pointer', textDecoration: 'none',
            position: 'relative', zIndex: 1,
          }}
        >
          <div style={{
            fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 900,
            letterSpacing: '-0.02em', lineHeight: 1, color: '#000',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          }}>METIS</div>
        </Link>
        <div style={{
          pointerEvents: 'auto', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: '10px', position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
            <span className="heming-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
              <Link className="heming-pill-link" href="/chart">起盘</Link>
            </span>
            <span className="heming-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
              <span style={{ color: '#d4d4d4', fontSize: '10px' }}>·</span>
              <Link className="heming-pill-link" href="/heming">合盘</Link>
            </span>
            <button type="button" className="heming-obys-btn">普通版</button>
            <button aria-label="打开菜单" aria-expanded="false" className="heming-nav-burger">☰</button>
          </div>
        </div>
      </header>

      <div style={{
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(100px, 14vh, 140px) 24px 0', gap: '16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          padding: '12px 0', width: '100%', maxWidth: '1200px',
          margin: '0 auto', gap: '16px',
        }}>
          <span style={{ fontSize: '14px', color: '#6b6b6b', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            02 / SYNASTRY · 合盘分析
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '14px', color: '#6b6b6b' }}>感情 · 合伙 · 亲子 · 朋友</span>
        </div>
      </div>

      {/* 主体 */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '24px' }}>
          <div style={{ fontSize: '14px', letterSpacing: '0.3em', color: '#6b6b6b', marginBottom: '14px', textTransform: 'uppercase' }}>
            02 / SYNASTRY
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: '#000', marginBottom: '12px' }}>
            紫微合盘
          </h1>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, maxWidth: '540px', margin: '12px auto 0' }}>
            输入两个人的出生信息，AI 基于倪海夏体系分析双方命盘的缘分匹配度、感情走向与相处建议
          </p>
          <div style={{ height: '1px', background: '#000', marginTop: '32px', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }} />
        </div>

        {/* 双栏表单 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}
          className="heming-grid">
          {/* 甲方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>甲方 — A</span>
            <BirthForm
              hideSubmit
              appearance="light"
              onSubmit={() => {}}
              onFormSave={setFormA}
            />
          </div>

          {/* 乙方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>乙方 — B</span>
            <BirthForm
              hideSubmit
              appearance="light"
              onSubmit={() => {}}
              onFormSave={setFormB}
            />
          </div>
        </div>

        {/* ═══ 大合盘分析框（视觉中心，始终显示）════════════════ */}
        <div ref={analysisRef} style={{
          ...cardStyle,
          minHeight: '320px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: (!analysis && !analyzing) ? 'center' : 'flex-start',
        }}>
          {/* 区块标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (analysis || analyzing) ? '20px' : '24px' }}>
            <span style={{ color: 'var(--ac)', opacity: 0.6 }}>◉</span>
            <span style={{ fontSize: '14px', letterSpacing: '0.3em', color: 'var(--tx-3)' }}>合盘分析 · HEMING</span>
            <span style={{ flex: 1 }} />
            <span title="合盘每日免费 10 次，北京时间 0 点重置" style={{
              fontSize: '14px', color: quotaRemaining > 0 ? 'var(--tx-3)' : '#dc2626',
              background: 'rgba(0,0,0,0.06)',
              border: '0.5px solid rgba(0,0,0,0.20)', padding: '2px 8px',
              borderRadius: 'var(--r-pill)', letterSpacing: '0.04em',
            }}>今日剩余 {quotaRemaining} 次</span>
          </div>

          {/* 状态分支 */}
          {!analysis && !analyzing && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '14px', color: 'var(--tx-3)', marginBottom: '24px', lineHeight: 1.7 }}>
                填好双方出生信息后，点击下方按钮<br />
                AI 将基于倪海夏体系深度分析两人缘分匹配度
              </div>
              <button
                onClick={() => runAnalysis()}
                disabled={quotaRemaining <= 0}
                className="liquid-btn"
                style={{
                  padding: '14px 40px', borderRadius: 'var(--r-pill)', border: '0.5px solid rgba(0,0,0,0.4)',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.85) 100%)',
                  color: '#fff', fontSize: '14px', fontWeight: 600,
                  letterSpacing: '0.15em', cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                开始合盘分析
              </button>
              {formError && (
                <div style={{ marginTop: '20px', fontSize: '13px', color: '#dc2626' }}>
                  {formError}
                </div>
              )}
            </div>
          )}

          {analyzing && !analysis && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0', color: 'var(--tx-3)', fontSize: '13px' }}>
              <div style={{
                width: '14px', height: '14px',
                border: '2px solid var(--bdr-med)', borderTopColor: 'var(--ac)',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              正在对比双方命盘…
            </div>
          )}

          {analysis && <AiContent text={analysis} streaming={analyzing && followUpPairs.length === 0} />}

          {analysis && followUpPairs.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {followUpPairs.map((item, index) => {
                const isPending = analyzing && index === followUpPairs.length - 1;
                return (
                  <div key={`${item.question}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        maxWidth: '82%',
                        padding: '11px 16px',
                        borderRadius: '18px 18px 4px 18px',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.10) 100%)',
                        border: '0.5px solid rgba(0,0,0,0.30)',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        color: 'var(--tx-1)',
                      }}>
                        {item.question}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--tx-3)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--ac)', opacity: 0.5 }}>✦</span>
                        合盘追问
                      </div>
                      {item.answer
                        ? <AiContent text={item.answer} streaming={isPending} />
                        : <div style={{ fontSize: '13px', color: 'var(--tx-3)' }}>AI 正在针对你的问题深度分析…</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {analysisError && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', background: 'var(--bg-card)', fontSize: '13px', color: 'var(--tx-2)', marginTop: '12px' }}>
              {analysisError}
            </div>
          )}
        </div>

        {/* ═══ 针对合盘的追问聊天框（仅分析完成后显示）═══════════ */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--tx-3)', marginBottom: '4px' }}>
              针对此次合盘继续追问
            </div>

            {/* 快捷问题 */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                '感情匹配度如何？',
                '适合合伙创业吗？',
                '两人结婚是否合适？',
                '哪方面最容易产生矛盾？',
                '财运是否互补？',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); runAnalysis(q); }}
                  disabled={analyzing}
                  style={{
                    fontSize: '12px', padding: '6px 14px',
                    borderRadius: 'var(--r-pill)',
                    border: '1px solid var(--bdr-med)',
                    background: 'transparent', color: 'var(--tx-2)',
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    opacity: analyzing ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!analyzing) (e.currentTarget as HTMLElement).style.borderColor = 'var(--ac-bdr)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bdr-med)'; }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 输入框 + 追问按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !analyzing && question.trim()) {
                    const next = question.trim();
                    setQuestion('');
                    runAnalysis(next);
                  }
                }}
                placeholder="继续追问，如：哪几年是两人感情关键期？"
                disabled={analyzing}
                className="input-base"
                style={{ fontSize: '13px', flex: 1 }}
              />
              <button
                onClick={() => {
                  const next = question.trim();
                  if (!next) return;
                  setQuestion('');
                  runAnalysis(next);
                }}
                disabled={analyzing || !question.trim()}
                style={{
                  padding: '10px 20px', borderRadius: 'var(--r-sm)', border: 'none',
                  background: analyzing ? 'var(--bg-2)' : 'var(--tx-0)',
                  color: analyzing ? 'var(--tx-3)' : 'white',
                  fontSize: '13px', fontWeight: 500,
                  cursor: analyzing || !question.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                  opacity: !analyzing && !question.trim() ? 0.45 : 1,
                }}
              >
                {analyzing ? '分析中…' : '继续追问'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .heming-pill-link {
          color: #000;
          text-decoration: none;
          border-radius: 999px;
          font-size: clamp(11px, 1.1vw, 13px);
          padding: clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px);
          line-height: 1.2;
          transition: background 0.18s ease;
        }
        .heming-pill-link:hover { background: rgba(0,0,0,0.06); }
        .heming-obys-btn {
          font-size: clamp(11px, 1.1vw, 13px);
          padding: clamp(4px, 0.5vw, 5px) clamp(10px, 1.2vw, 14px);
          margin-left: clamp(4px, 0.6vw, 8px);
          border-radius: 999px;
          background: #fff;
          color: #1a1a1a;
          border: 1px solid rgba(0,0,0,0.28);
          font-weight: 500;
          cursor: pointer;
          line-height: 1.2;
        }
        .heming-nav-burger {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #000;
          font-size: 20px;
          line-height: 1;
          padding: 4px 2px 4px 8px;
        }
        .liquid-btn:hover { transform: translateY(-1px); }
        @media (max-width: 680px) {
          .heming-grid { grid-template-columns: 1fr !important; }
          .heming-nav-desktop { display: none !important; }
          .heming-nav-burger { display: inline-flex; }
        }
      `}</style>
    </div>
  );
}
