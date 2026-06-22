'use client';

import Link from 'next/link';
import { MembershipEditionButton } from '@/components/MembershipEditionButton';
import { useEffect, useMemo, useState } from 'react';
import { ALL_STARS, ALL_TOPICS, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { TOPIC_PALACE_NAME } from '@/lib/ziwei/db-analysis';
import { COMBO_REGISTRY, COMBO_TOPIC_META, COMBO_TOPIC_ORDER } from '@/lib/seo/combo';
import patternRegistry from '@/lib/seo/pattern-registry.json';
import { OracleFooter } from '@/components/OracleFooter';

const TOPIC_DISPLAY: Record<string, string> = {
  overview: '命格总览',
  personality: '性格特质',
  love: '感情婚姻',
  career: '事业职业',
  wealth: '财富运势',
  health: '健康运势',
  family: '兄弟合伙',
  children: '子女缘分',
  move: '迁移外出',
  friends: '人际贵人',
  home: '田宅不动产',
  spirit: '福德精神',
  parents: '父母长辈',
};

const PATTERN_GROUPS = [
  { key: 'excellent', label: '上格' },
  { key: 'good', label: '中格' },
  { key: 'support', label: '助力格' },
  { key: 'caution', label: '恶格' },
  { key: 'basic', label: '基础格局' },
] as const;

type PatternItem = {
  slug: string;
  name: string;
  meta: string;
  searchText: string;
  group?: string;
  groupLabel?: string;
};

const PATTERNS = patternRegistry as PatternItem[];

function cardStyle(hidden: boolean): React.CSSProperties {
  return {
    display: hidden ? 'none' : 'block',
    transition: 'all 0.2s',
  };
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3">
      <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.4))' }} />
      <span style={{ fontSize: '14px', color: 'var(--ac)', letterSpacing: '0.4em' }}>{label}</span>
      <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.4))' }} />
    </div>
  );
}

function MetisHeader() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 'clamp(14px, 2vw, 24px) clamp(16px, 3vw, 32px)',
        pointerEvents: 'none',
      }}
    >
      <Link
        aria-label="回到首页"
        href="/"
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer',
          textDecoration: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(26px, 3vw, 42px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: '#000',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          }}
        >
          METIS
        </div>
      </Link>

      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
            <Link
              className="obys-pill-link"
              style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }}
              href="/chart"
            >
              起盘
            </Link>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
            <span style={{ color: '#d4d4d4', fontSize: 'var(--fs-10)' }}>·</span>
            <Link
              className="obys-pill-link"
              style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }}
              href="/heming"
            >
              合盘
            </Link>
          </span>
          <MembershipEditionButton variant="obys" />
        </div>
      </div>
    </header>
  );
}

export default function KnowledgeHomePage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const el = document.getElementById(hash);
      if (el) {
        window.setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const matches = (text: string) => !normalizedQuery || text.toLowerCase().includes(normalizedQuery);

  const patternsByGroup = useMemo(() => {
    const map: Record<string, PatternItem[]> = {};
    for (const group of PATTERN_GROUPS) map[group.key] = [];
    for (const item of PATTERNS) {
      const key = item.group ?? 'basic';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, []);

  return (
    <div id="main-content" className="knowledge-page" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <MetisHeader />

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '72px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/images/scenes/hero-bg-light.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.85,
              filter: 'grayscale(1)',
              transition: 'opacity 0.6s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, var(--bg-page,#f7f7f7) 0%, rgba(247,247,247,0.46) 26%, rgba(247,247,247,0.58) 62%, var(--bg-page,#f7f7f7) 100%)',
            }}
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.4))' }} />
              <span style={{ fontSize: '14px', color: 'var(--ac)', letterSpacing: '0.4em' }}>KNOWLEDGE BASE</span>
              <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.4))' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '12px' }}>
              紫微斗数知识库
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.08em', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
              14 主星 × 13 宫位 = <strong style={{ color: 'var(--ac)' }}>182</strong> 项专题 +{' '}
              <strong style={{ color: 'var(--ac)' }}>24</strong> 组双星同宫 +{' '}
              <strong style={{ color: 'var(--ac)' }}>37</strong> 种格局
              <br />
              基于倪海夏《天纪》体系编纂 · 含古籍引证
            </p>
            <div
              style={{
                marginTop: '20px',
                maxWidth: '720px',
                margin: '20px auto 0',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px 16px',
                fontSize: '14px',
                color: 'var(--tx-3)',
                letterSpacing: '0.04em',
              }}
            >
              <span><strong style={{ color: 'var(--ac)' }}>8.7 万字</strong> 精校论断</span>
              <span>·</span>
              <span><strong style={{ color: 'var(--ac)' }}>644 处</strong> 古籍/讲座引证</span>
              <span>·</span>
              <span><strong style={{ color: 'var(--ac)' }}>496 句</strong> 倪师原话</span>
              <span>·</span>
              <span>每条均含 <strong style={{ color: 'var(--ac)' }}>「定调/论断/依据/出处」</strong> 4 段结构</span>
            </div>
            <div style={{ maxWidth: '460px', margin: '0 auto 28px', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '14px',
                    color: 'var(--tx-3)',
                    pointerEvents: 'none',
                    opacity: 0.7,
                  }}
                >
                  ⌕
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="搜索主星、双星组合、格局名称…"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 36px',
                    fontSize: '14px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    color: 'var(--tx-0)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    letterSpacing: '0.05em',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.3em', textAlign: 'center', marginBottom: '24px' }}>
          十四主星
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_STARS.map(star => {
            const searchText = `${star} ${STAR_BRIEF_SEO[star] ?? ''}`;
            const hidden = !matches(searchText);
            return (
              <Link
                key={star}
                data-search-item="true"
                data-search-text={searchText}
                href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
                className="glass-static hover:border-black/40"
                style={{
                  ...cardStyle(hidden),
                  padding: '14px 10px',
                  background: 'var(--bg-card)',
                  border: '0.5px solid rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em' }}>{star}</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 space-y-4">
          {ALL_STARS.map(star => {
            const searchText = `${star}星 ${STAR_BRIEF_SEO[star] ?? ''}`;
            const hidden = !matches(searchText);
            return (
              <div
                key={star}
                data-search-item="true"
                data-search-text={searchText}
                style={{
                  ...cardStyle(hidden),
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(0,0,0,0.18)',
                  borderRadius: '12px',
                  padding: '18px 22px',
                }}
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>{star}星</span>
                  <span style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>ZI WEI · 14 STARS</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '12px' }}>
                  {STAR_BRIEF_SEO[star]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_TOPICS.map(topic => {
                    const k = getKnowledge(star, topic);
                    if (!k.exists) return null;
                    return (
                      <Link
                        key={topic}
                        href={`/knowledge/${STAR_TO_SLUG[star]}/${topic}`}
                        style={{
                          fontSize: '14px',
                          padding: '4px 10px',
                          background: 'rgba(0,0,0,0.06)',
                          border: '0.5px solid rgba(0,0,0,0.15)',
                          borderRadius: '999px',
                          color: 'var(--tx-2)',
                          textDecoration: 'none',
                        }}
                      >
                        入{TOPIC_PALACE_NAME[topic] ?? k.palaceName} · {TOPIC_DISPLAY[topic] ?? k.topicLabel}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div id="dual-star" className="mt-20 knowledge-hash-anchor">
          <div className="text-center mb-8">
            <SectionEyebrow label="DUAL STAR COMBOS" />
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.12em', marginBottom: '8px' }}>
              双星同宫组合
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.06em', maxWidth: '540px', margin: '0 auto', lineHeight: 1.7 }}>
              紫微斗数 14 主星按固定轨道两两同宫，共 <strong style={{ color: 'var(--ac)' }}>24</strong> 种组合
              <br />
              双星同宫产生独特化学效应，不可简单等于单星相加
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
            {COMBO_REGISTRY.map(combo => {
              const hidden = !matches(combo.searchText);
              return (
                <Link
                  key={combo.slug}
                  data-search-item="true"
                  data-search-text={combo.searchText}
                  href={`/knowledge/combo/${combo.slug}`}
                  className="glass-static hover:border-black/40"
                  style={{
                    display: hidden ? 'none' : 'block',
                    padding: '12px 8px',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>{combo.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--tx-3)', marginTop: '4px' }}>{combo.palace}</div>
                </Link>
              );
            })}
          </div>
          <div className="space-y-4">
            {COMBO_REGISTRY.map(combo => {
              const hidden = !matches(combo.searchText);
              return (
                <div
                  key={combo.slug}
                  data-search-item="true"
                  data-search-text={combo.searchText}
                  style={{
                    ...cardStyle(hidden),
                    background: 'var(--bg-card)',
                    border: '0.5px solid rgba(0,0,0,0.18)',
                    borderRadius: '12px',
                    padding: '18px 22px',
                  }}
                >
                  <div className="flex items-baseline gap-3 mb-2">
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.08em' }}>
                      {combo.name}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--ac-dim, var(--tx-3))', letterSpacing: '0.1em' }}>
                      {combo.stars[0]} + {combo.stars[1]} · {combo.palace}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '10px' }}>{combo.brief}</p>
                  <div className="flex flex-wrap gap-2">
                    {COMBO_TOPIC_ORDER.map(topic => {
                      if (!combo.topics[topic]) return null;
                      const meta = COMBO_TOPIC_META[topic];
                      return (
                        <Link
                          key={topic}
                          href={`/knowledge/combo/${combo.slug}#${topic}`}
                          style={{
                            fontSize: '14px',
                            padding: '4px 10px',
                            background: 'rgba(0,0,0,0.06)',
                            border: '0.5px solid rgba(0,0,0,0.15)',
                            borderRadius: '999px',
                            color: 'var(--tx-2)',
                            textDecoration: 'none',
                          }}
                        >
                          {meta.palace} · {meta.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="patterns" className="mt-20 knowledge-hash-anchor">
          <div className="text-center mb-8">
            <SectionEyebrow label="PATTERNS & FORMATIONS" />
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.12em', marginBottom: '8px' }}>
              古典格局详解
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.06em', maxWidth: '540px', margin: '0 auto', lineHeight: 1.7 }}>
              紫微斗数 <strong style={{ color: 'var(--ac)' }}>37</strong> 种古典格局
              <br />
              上格 · 中格 · 助力格 · 恶格 · 基础格局 — 五类分明
            </p>
          </div>
          {PATTERN_GROUPS.map(group => {
            const items = patternsByGroup[group.key] ?? [];
            if (!items.length) return null;
            const visible = items.filter(item => matches(item.searchText));
            if (normalizedQuery && !visible.length) return null;
            return (
              <div key={group.key} style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--tx-0)',
                    letterSpacing: '0.1em',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ width: '4px', height: '16px', background: 'var(--ac)', borderRadius: '2px' }} />
                  {group.label}
                  <span style={{ fontSize: '14px', color: 'var(--tx-3)', fontWeight: 400 }}>({items.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {items.map(item => {
                    const hidden = !matches(item.searchText);
                    return (
                      <Link
                        key={item.slug}
                        data-search-item="true"
                        data-search-text={item.searchText}
                        href={`/knowledge/pattern/${item.slug}`}
                        className="glass-static hover:border-black/40"
                        style={{
                          ...cardStyle(hidden),
                          padding: '12px 10px',
                          background: 'var(--bg-card)',
                          border: '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.08em' }}>{item.name}</div>
                        <div style={{ fontSize: '14px', color: 'var(--tx-3)', marginTop: '4px' }}>{item.meta}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OracleFooter showBackLink={false} />
    </div>
  );
}
