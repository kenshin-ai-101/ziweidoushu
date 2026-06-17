import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KnowledgeFooter } from '@/components/KnowledgeSection';
import {
  getFortuneLabel,
  getPatternBySlug,
  getRelatedGroupSections,
  PATTERN_REGISTRY,
} from '@/lib/seo/pattern';

export const dynamicParams = false;

export async function generateStaticParams() {
  return PATTERN_REGISTRY.map(p => ({ slug: p.slug }));
}

function PatternSection({
  title,
  children,
  gradient,
}: {
  title: string;
  children: React.ReactNode;
  gradient?: boolean;
}) {
  return (
    <section style={{ marginBottom: gradient ? '32px' : '24px' }}>
      <h2
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: 'var(--ac)',
          fontWeight: 600,
          letterSpacing: '0.2em',
          marginBottom: '12px',
        }}
      >
        <span style={{ width: '4px', height: '14px', background: 'var(--ac)', borderRadius: '2px' }} />
        {title}
      </h2>
      <div
        style={{
          background: gradient
            ? 'linear-gradient(135deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 100%)'
            : 'var(--bg-card)',
          border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: '10px',
          padding: '20px 22px',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = getPatternBySlug(slug);
  if (!pattern) return {};
  return {
    title: `${pattern.name}详解 · ${pattern.level} · 紫微斗数格局 · 倪海夏体系`,
    description: pattern.brief,
    keywords: [
      '紫微斗数',
      '紫微斗数格局',
      '倪海夏',
      pattern.name,
      ...pattern.linkedStars.map(s => s.name),
      ...pattern.auxiliaryStars,
      `${pattern.name}格局`,
      '倪海厦紫微斗数',
    ],
    openGraph: {
      title: `${pattern.name}详解 · ${pattern.level} · 紫微斗数格局 · 倪海夏体系`,
      description: pattern.brief,
      type: 'article',
      url: `https://wdyziweidoushu666.com/knowledge/pattern/${slug}`,
    },
    alternates: {
      canonical: `https://wdyziweidoushu666.com/knowledge/pattern/${slug}`,
    },
  };
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = getPatternBySlug(slug);
  if (!pattern) notFound();

  const fortune = getFortuneLabel(pattern.meta);
  const relatedSections = getRelatedGroupSections(pattern);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${pattern.name} · 紫微斗数格局详解`,
    description: pattern.brief,
    author: { '@type': 'Organization', name: 'Metis · 倪海夏正宗' },
    publisher: { '@type': 'Organization', name: 'Metis', url: 'https://wdyziweidoushu666.com' },
    datePublished: '2026-05-02',
    dateModified: '2026-05-02',
    mainEntityOfPage: `https://wdyziweidoushu666.com/knowledge/pattern/${slug}`,
    articleSection: '紫微斗数 · 格局详解',
    keywords: ['紫微斗数', '紫微斗数格局', pattern.name, ...pattern.linkedStars.map(s => s.name)].join(', '),
  };

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
        <div style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>倪师方法论 · 格局详解</div>
        <Link href="/chart" style={{ fontSize: '14px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          起盘 →
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <nav style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.1em', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>
            首页
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/knowledge" style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>
            知识库
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--ac)' }}>格局</span>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{pattern.name}</span>
        </nav>

        <header style={{ marginBottom: '36px' }}>
          <div className="flex items-center gap-2 mb-3">
            <span
              style={{
                fontSize: '14px',
                padding: '3px 10px',
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid #00033',
                borderRadius: '999px',
                color: '#000',
                fontWeight: 600,
              }}
            >
              {pattern.level}
            </span>
            {fortune && (
              <span
                style={{
                  fontSize: '14px',
                  padding: '3px 10px',
                  background: '#00015',
                  border: '1px solid #00033',
                  borderRadius: '999px',
                  color: '#000',
                  fontWeight: 600,
                }}
              >
                {fortune}
              </span>
            )}
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 700,
              color: 'var(--tx-0)',
              letterSpacing: '0.1em',
              lineHeight: 1.2,
            }}
          >
            {pattern.name}
          </h1>
          {(pattern.linkedStars.length > 0 || pattern.auxiliaryStars.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {pattern.linkedStars.map(star => (
                <Link
                  key={star.slug}
                  href={`/knowledge/${star.slug}/overview`}
                  style={{
                    fontSize: '14px',
                    padding: '4px 12px',
                    background: 'rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,0,0,0.25)',
                    borderRadius: '999px',
                    color: 'var(--ac)',
                    textDecoration: 'none',
                  }}
                >
                  {star.name}星
                </Link>
              ))}
              {pattern.auxiliaryStars.map(star => (
                <span
                  key={star}
                  style={{
                    fontSize: '14px',
                    padding: '4px 12px',
                    background: 'rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '999px',
                    color: 'var(--tx-2)',
                  }}
                >
                  {star}
                </span>
              ))}
            </div>
          )}
        </header>

        {pattern.content.dingdiao && (
          <PatternSection title="一句话定调" gradient>
            <p style={{ fontSize: '17px', color: 'var(--tx-0)', lineHeight: 1.9, fontWeight: 500, letterSpacing: '0.04em', margin: 0 }}>
              {pattern.content.dingdiao}
            </p>
          </PatternSection>
        )}

        {pattern.content.lundian && (
          <PatternSection title="核心论断">
            <div style={{ fontSize: '15px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {pattern.content.lundian}
            </div>
          </PatternSection>
        )}

        {pattern.content.yiju && (
          <PatternSection title="命盘依据">
            <div style={{ fontSize: '14px', color: 'var(--tx-0)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {pattern.content.yiju}
            </div>
          </PatternSection>
        )}

        {pattern.content.chuchu && (
          <PatternSection title="经典出处">
            <div style={{ fontSize: '14px', color: 'var(--tx-2)', lineHeight: 2, letterSpacing: '0.02em', whiteSpace: 'pre-wrap' }}>
              {pattern.content.chuchu}
            </div>
          </PatternSection>
        )}

        {pattern.relatedStars.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <h2
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--ac)',
                fontWeight: 600,
                letterSpacing: '0.2em',
                marginBottom: '12px',
              }}
            >
              <span style={{ width: '4px', height: '14px', background: 'var(--ac)', borderRadius: '2px' }} />
              涉及星曜的详细知识
            </h2>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '10px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {pattern.relatedStars.map(star => (
                  <Link
                    key={star.slug}
                    href={`/knowledge/${star.slug}/overview`}
                    style={{
                      fontSize: '14px',
                      padding: '6px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(0,0,0,0.25)',
                      borderRadius: '999px',
                      color: 'var(--tx-2)',
                      textDecoration: 'none',
                    }}
                  >
                    {star.name}星 · 全面解读 →
                  </Link>
                ))}
              </div>
            </div>
          </section>
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
            想看你命盘有没有{pattern.name}？
          </div>
          <div style={{ fontSize: '14px', color: 'var(--tx-2)', marginBottom: '16px' }}>
            输入生辰起盘 · 自动识别全部格局 · AI 答疑伴学
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

        {relatedSections.map(section => (
          <section key={section.key} style={{ marginBottom: '24px' }}>
            <h2
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--ac)',
                fontWeight: 600,
                letterSpacing: '0.2em',
                marginBottom: '12px',
              }}
            >
              <span style={{ width: '4px', height: '14px', background: 'var(--ac)', borderRadius: '2px' }} />
              {section.title}
            </h2>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '10px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {section.items.map(item => (
                  <Link
                    key={item.slug}
                    href={`/knowledge/pattern/${item.slug}`}
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
        ))}

        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href="/knowledge"
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
            ← 返回知识库
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
