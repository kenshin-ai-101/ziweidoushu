import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  COMBO_REGISTRY,
  COMBO_TOPIC_META,
  COMBO_TOPIC_ORDER,
  getComboBySlug,
  getOtherCombos,
} from '@/lib/seo/combo';
import type { ComboTopicKey } from '@/lib/seo/combo-data.generated';
import { KnowledgeFooter, KnowledgeSection } from '@/components/KnowledgeSection';

export const dynamicParams = false;

export async function generateStaticParams() {
  return COMBO_REGISTRY.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const combo = getComboBySlug(slug);
  if (!combo) return {};
  return {
    title: `${combo.name}详解 · 双星同宫 · 倪海夏紫微斗数体系`,
    description: `${combo.brief}${combo.name}（${combo.stars[0]}+${combo.stars[1]}）同宫于${combo.palace}，基于倪海夏《天纪》体系的完整解读，含命宫、夫妻、事业、财运四宫论断。`,
    keywords: ['紫微斗数', '倪海夏', '双星同宫', combo.name, combo.stars[0], combo.stars[1], '倪海厦紫微斗数', '紫微斗数全集'],
    openGraph: {
      title: `${combo.name}详解 · 双星同宫 · 倪海夏紫微斗数体系`,
      description: combo.brief,
      type: 'article',
      url: `https://wdyziweidoushu666.com/knowledge/combo/${slug}`,
    },
    alternates: {
      canonical: `https://wdyziweidoushu666.com/knowledge/combo/${slug}`,
    },
  };
}

export default async function ComboPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const combo = getComboBySlug(slug);
  if (!combo) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${combo.name} · 双星同宫详解`,
    description: combo.brief,
    author: { '@type': 'Organization', name: 'Metis · 倪海夏正宗' },
    publisher: { '@type': 'Organization', name: 'Metis', url: 'https://wdyziweidoushu666.com' },
    datePublished: '2026-05-02',
    dateModified: '2026-05-02',
    mainEntityOfPage: `https://wdyziweidoushu666.com/knowledge/combo/${slug}`,
    articleSection: '紫微斗数 · 双星同宫',
    keywords: ['紫微斗数', '双星同宫', combo.name, combo.stars[0], combo.stars[1]].join(', '),
  };

  const otherCombos = getOtherCombos(slug);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.15)', background: 'var(--bg-page)' }}
      >
        <Link href="/knowledge" style={{ fontSize: '14px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← 知识库
        </Link>
        <div style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>倪师方法论 · 双星同宫</div>
        <Link href="/chart" style={{ fontSize: '14px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          起盘 →
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <nav style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.1em', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>首页</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/knowledge" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>知识库</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--ac)' }}>双星同宫</span>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{combo.name}</span>
        </nav>

        <header style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.25em', marginBottom: '8px' }}>
            双星同宫 · 倪海夏体系详解
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em', lineHeight: 1.2 }}>
            {combo.name}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span
              style={{
                fontSize: '14px',
                padding: '4px 12px',
                background: 'rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.25)',
                borderRadius: '999px',
                color: 'var(--ac)',
              }}
            >
              {combo.stars[0]} + {combo.stars[1]}
            </span>
            <span
              style={{
                fontSize: '14px',
                padding: '4px 12px',
                background: 'rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '999px',
                color: 'var(--tx-2)',
              }}
            >
              限{combo.palace}宫
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--tx-2)', marginTop: '14px', lineHeight: 1.8 }}>{combo.brief}</p>
        </header>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '28px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
          }}
        >
          {COMBO_TOPIC_ORDER.map(topic => {
            const meta = COMBO_TOPIC_META[topic];
            if (!combo.topics[topic]) return null;
            return (
              <a
                key={topic}
                href={`#${topic}`}
                style={{
                  fontSize: '14px',
                  padding: '6px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '999px',
                  color: 'var(--tx-2)',
                  textDecoration: 'none',
                }}
              >
                {meta.palace} · {meta.label}
              </a>
            );
          })}
        </div>

        {COMBO_TOPIC_ORDER.map(topic => {
          const content = combo.topics[topic as ComboTopicKey];
          if (!content) return null;
          const meta = COMBO_TOPIC_META[topic];
          return (
            <div key={topic} id={topic} style={{ marginBottom: '40px', scrollMarginTop: '96px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingTop: '8px' }}>
                <span
                  style={{
                    width: '4px',
                    height: '24px',
                    background: 'linear-gradient(180deg, var(--ac) 0%, rgba(0,0,0,0.3) 100%)',
                    borderRadius: '2px',
                  }}
                />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.12em', margin: 0 }}>
                  {combo.name}入{meta.palace}
                </h2>
                <span style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>{meta.label}</span>
              </div>

              {content.dingdiao && (
                <KnowledgeSection title="一句话定调" gradient>
                  <p style={{ fontSize: '16px', color: 'var(--tx-0)', lineHeight: 1.9, fontWeight: 500, letterSpacing: '0.04em', margin: 0 }}>
                    {content.dingdiao}
                  </p>
                </KnowledgeSection>
              )}
              {content.lundian && (
                <KnowledgeSection title="核心论断">
                  <div style={{ fontSize: '15px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
                    {content.lundian}
                  </div>
                </KnowledgeSection>
              )}
              {content.yiju && (
                <KnowledgeSection title="命盘依据">
                  <div style={{ fontSize: '14px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
                    {content.yiju}
                  </div>
                </KnowledgeSection>
              )}
              {content.chuchu && (
                <KnowledgeSection title="经典出处">
                  <div style={{ fontSize: '14px', color: 'var(--tx-2)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
                    {content.chuchu}
                  </div>
                </KnowledgeSection>
              )}
            </div>
          );
        })}

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
            想看你命盘中有没有{combo.name}？
          </div>
          <div style={{ fontSize: '14px', color: 'var(--tx-2)', marginBottom: '16px' }}>输入生辰起盘 · 倪师正宗解读 · AI 答疑伴学</div>
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

        <section style={{ marginBottom: '16px' }}>
          <h3
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--ac)',
              fontWeight: 600,
              letterSpacing: '0.2em',
              marginBottom: '8px',
            }}
          >
            <span style={{ width: '3px', height: '12px', background: 'var(--ac)', borderRadius: '2px', opacity: 0.7 }} />
            其他双星同宫组合
          </h3>
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {otherCombos.map(item => (
                <Link
                  key={item.slug}
                  href={`/knowledge/combo/${item.slug}`}
                  style={{
                    fontSize: '14px',
                    padding: '6px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(0,0,0,0.25)',
                    borderRadius: '999px',
                    color: 'var(--tx-2)',
                    textDecoration: 'none',
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href="/knowledge#dual-star"
            style={{
              flex: '1 1 200px',
              padding: '14px 18px',
              background: 'rgba(0,0,0,0.04)',
              border: '1px dashed rgba(0,0,0,0.25)',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--ac)',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textDecoration: 'none',
            }}
          >
            ← 返回知识库 · 14 主星 × 13 宫位
          </Link>
          <Link
            href="/library"
            style={{
              flex: '1 1 200px',
              padding: '14px 18px',
              background: 'rgba(0,0,0,0.04)',
              border: '1px dashed rgba(0,0,0,0.25)',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--ac)',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textDecoration: 'none',
            }}
          >
            📜 查阅古籍原典库 →
          </Link>
        </div>
      </article>

      <KnowledgeFooter />
    </div>
  );
}
