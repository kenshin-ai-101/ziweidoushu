/**
 * /knowledge/[star]/[topic] — SEO 落地页
 *
 * 14 主星 × 13 topic = 182 个独立 URL
 * 每页含完整的 STAR_DB 4 段论断（一句话定调/核心论断/命盘依据/经典出处）
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  KnowledgeFooter,
  KnowledgeRichText,
  KnowledgeSection,
  KnowledgeTopBar,
  PILL_LINK_STYLE,
} from '@/components/KnowledgeSection';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import {
  ALL_STARS,
  ALL_TOPICS,
  formatPalaceLabel,
  getKnowledge,
  getAllKnowledgeRoutes,
  STAR_BRIEF_SEO,
  STAR_TO_SLUG,
  SLUG_TO_STAR,
} from '@/lib/seo/knowledge';

export const dynamicParams = false;

export async function generateStaticParams() {
  const routes = getAllKnowledgeRoutes();
  return routes.map(r => ({ star: r.slug, topic: r.topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) return {};
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) return {};

  const palace = formatPalaceLabel(data.palaceName);
  const title = `${star}入${palace} · ${data.topicLabel} · 倪海夏体系详解`;
  const description = data.parsed.dingdiao
    || `${star}入${palace}的紫微斗数解读 — 基于倪海夏《天纪》体系与古籍《紫微斗数全集》《骨髓赋》。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://wdyziweidoushu666.com/knowledge/${slug}/${topic}`,
    },
    alternates: {
      canonical: `https://wdyziweidoushu666.com/knowledge/${slug}/${topic}`,
    },
    keywords: [
      '紫微斗数', '倪海夏', star, data.palaceName, data.topicLabel,
      `${star}${data.palaceName}`, `${star}入${data.palaceName}`,
      `紫微斗数 ${star}`, '倪海厦紫微斗数', '紫微斗数全集',
    ],
  };
}

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) notFound();
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) notFound();

  const palace = formatPalaceLabel(data.palaceName);
  const otherTopicsForStar = ALL_TOPICS.filter(t => t !== topic && getKnowledge(star, t).exists);
  const otherStarsForTopic = ALL_STARS.filter(s => s !== star && getKnowledge(s, topic as TopicKey).exists);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${star}入${palace} · ${data.topicLabel}`,
    description: data.parsed.dingdiao,
    author: { '@type': 'Organization', name: '紫微研究 · 倪海夏正宗' },
    publisher: {
      '@type': 'Organization',
      name: '紫微研究',
      url: 'https://wdyziweidoushu666.com',
    },
    datePublished: '2026-04-28',
    dateModified: '2026-04-28',
    mainEntityOfPage: `https://wdyziweidoushu666.com/knowledge/${slug}/${topic}`,
    articleSection: '紫微斗数 · 倪海夏体系',
    keywords: [`紫微斗数`, star, data.palaceName, data.topicLabel].join(', '),
  };

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <KnowledgeTopBar
        backHref="/"
        backLabel="← 首页"
        center="倪师方法论 · 知识库"
        actionHref="/chart"
        actionLabel="起盘 →"
      />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <nav style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.1em', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>首页</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/knowledge" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>知识库</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{star}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <span style={{ color: 'var(--ac)' }}>{palace}</span>
        </nav>

        <header style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.25em', marginBottom: '8px' }}>
            {data.topicLabel} · 倪海夏体系详解
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em', lineHeight: 1.2 }}>
            {star}入{palace}
          </h1>
          {STAR_BRIEF_SEO[star] && (
            <p style={{ fontSize: '14px', color: 'var(--tx-2)', marginTop: '14px', lineHeight: 1.8 }}>
              {STAR_BRIEF_SEO[star]}
            </p>
          )}
        </header>

        {data.parsed.dingdiao && (
          <KnowledgeSection title="一句话定调" gradient>
            <p style={{ fontSize: '17px', color: 'var(--tx-0)', lineHeight: 1.9, fontWeight: 500, letterSpacing: '0.04em', margin: 0 }}>
              {data.parsed.dingdiao}
            </p>
          </KnowledgeSection>
        )}

        {data.parsed.lundian && (
          <KnowledgeSection title="核心论断">
            <div style={{ fontSize: '15px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {data.parsed.lundian}
            </div>
          </KnowledgeSection>
        )}

        {data.parsed.yiju && (
          <KnowledgeSection title="命盘依据">
            <KnowledgeRichText text={data.parsed.yiju} emphasizeBullets bodySize="14px" />
          </KnowledgeSection>
        )}

        {data.parsed.chuchu && (
          <KnowledgeSection title="经典出处" minimal>
            <KnowledgeRichText text={data.parsed.chuchu} muted bodySize="14px" />
          </KnowledgeSection>
        )}

        <div
          style={{
            margin: '40px 0 30px',
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.06) 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--tx-0)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '6px' }}>
            想看你自己命盘的{data.topicLabel}？
          </div>
          <div style={{ fontSize: '14px', color: 'var(--tx-2)', marginBottom: '16px' }}>
            输入生辰起盘 · 倪师正宗解读 · AI 答疑伴学
          </div>
          <Link
            href="/chart"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #000 0%, #000 100%)',
              color: 'white',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            立即起盘 →
          </Link>
        </div>

        <KnowledgeSection title={`${star}星的其他宫位解读`} minimal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {otherTopicsForStar.map(t => {
              const d = getKnowledge(star, t);
              return (
                <Link key={t} href={`/knowledge/${slug}/${t}`} style={PILL_LINK_STYLE}>
                  {star}入{formatPalaceLabel(d.palaceName)}
                </Link>
              );
            })}
          </div>
        </KnowledgeSection>

        <KnowledgeSection title={`其他主星入${palace}的解读`} minimal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {otherStarsForTopic.slice(0, 13).map(s => (
              <Link key={s} href={`/knowledge/${STAR_TO_SLUG[s]}/${topic}`} style={PILL_LINK_STYLE}>
                {s}入{palace}
              </Link>
            ))}
          </div>
        </KnowledgeSection>

        <div
          style={{
            marginTop: '40px',
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.04)',
            border: '1px dashed rgba(0,0,0,0.25)',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--ac-dim)', letterSpacing: '0.15em', marginBottom: '6px' }}>
            想读原典？
          </div>
          <Link
            href="/library"
            style={{ fontSize: '14px', color: 'var(--ac)', fontWeight: 500, letterSpacing: '0.1em', textDecoration: 'none' }}
          >
            📜 查阅古籍原典库 — 紫微斗数全集 / 全书 / 骨髓赋 →
          </Link>
        </div>
      </article>

      <KnowledgeFooter />
    </div>
  );
}
