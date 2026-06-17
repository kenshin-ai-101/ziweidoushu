/**
 * /library/[book]/[chapter] — 单章节阅读页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getChapter } from '@/lib/classics';

type ChapterSearchParams = {
  pro?: string;
  mockPro?: string;
  access?: string;
};

export async function generateStaticParams() {
  return ALL_BOOKS.flatMap(b =>
    b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx, 10));
  if (!result) return {};
  return {
    title: `${result.chapter.title} · 《${result.book.title}》· 紫微斗数古籍`,
    description: result.chapter.subtitle || `《${result.book.title}》${result.chapter.title}原文`,
  };
}

function hasMockProAccess(searchParams: ChapterSearchParams) {
  const value = searchParams.pro ?? searchParams.mockPro ?? searchParams.access;
  return value === '1' || value === 'true' || value === 'pro';
}

function MetisHeader() {
  return (
    <header className="metis-library-header">
      <Link className="metis-library-logo" aria-label="回到首页" href="/">METIS</Link>
      <nav className="metis-library-nav" aria-label="主导航">
        <Link className="obys-pill-link" style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }} href="/chart">起盘</Link>
        <span style={{ color: '#d4d4d4', fontSize: 'var(--fs-10)' }}>·</span>
        <Link className="obys-pill-link" style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }} href="/heming">合盘</Link>
        <button type="button" className="obys-btn obys-btn--primary" style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(4px, 0.5vw, 5px) clamp(10px, 1.2vw, 14px)', marginLeft: 'clamp(4px, 0.6vw, 8px)', background: '#fff', color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.28)', fontWeight: 500 }}>
          普通版
        </button>
      </nav>
    </header>
  );
}

function LockedChapterPage({ bookSlug, chapterIdx }: { bookSlug: string; chapterIdx: number }) {
  const redirect = `/library/${bookSlug}/${chapterIdx}`;

  return (
    <div id="main-content">
      <div className="metis-library-page">
        <MetisHeader />
        <div style={{ maxWidth: 580, margin: '0 auto', padding: 'clamp(120px,18vh,200px) 24px 100px', textAlign: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: '0 auto 24px',
              borderRadius: '50%',
              border: '1.5px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div style={{ fontSize: 12, letterSpacing: '0.3em', color: '#6b6b6b', marginBottom: 14 }}>
            PROFESSIONAL ONLY
          </div>
          <h1 style={{ fontSize: 'clamp(25px,4vw,36px)', fontWeight: 800, color: '#000', margin: '0 0 18px', letterSpacing: '0.02em' }}>
            古籍原典库 · 专业版专属
          </h1>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 2, marginBottom: 34 }}>
            六部古籍全文、四层精解（白话直译 · 义理阐发 · 实占应用 · 融会贯通）、
            <br />
            倪师批注与逐段 AI 解读，均为专业版研读内容。
            <br />
            开通专业版，即可解锁全部古籍原典的系统研习。
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/subscription?redirect=${encodeURIComponent(redirect)}`}
              style={{
                padding: '13px 34px',
                borderRadius: 26,
                background: '#000',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              解锁专业版 →
            </Link>
            <Link
              href="/"
              style={{
                padding: '13px 34px',
                borderRadius: 26,
                border: '1px solid #ccc',
                color: '#333',
                fontSize: 15,
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ book: string; chapter: string }>;
  searchParams?: Promise<ChapterSearchParams>;
}) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const chapterIdx = parseInt(chIdx, 10);
  const query = await searchParams;
  const result = getChapter(bookSlug, chapterIdx);
  if (!result) notFound();

  if (!hasMockProAccess(query ?? {})) {
    return <LockedChapterPage bookSlug={bookSlug} chapterIdx={chapterIdx} />;
  }

  const { book, chapter } = result;
  const prevIdx = chapterIdx - 1;
  const nextIdx = chapterIdx + 1;

  return (
    <div className="metis-library-page">
      <MetisHeader />
      <main className="metis-library-main">
        <section className="metis-library-hero">
          <div className="metis-library-eyebrow">CLASSICS · READING</div>
          <h1 className="metis-library-chapter-title">{chapter.title}</h1>
          {chapter.subtitle && <p className="metis-library-desc">{chapter.subtitle}</p>}
          <div className="metis-library-meta-row">
            <Link className="metis-library-chip" href={`/library/${book.slug}?pro=1`}>← 《{book.title}》目录</Link>
            <span className="metis-library-chip">{book.dynasty}</span>
            <span className="metis-library-chip">{String(chapterIdx + 1).padStart(2, '0')} / {book.chapters.length}</span>
            <span className="metis-library-chip">MOCK PRO · 已临时解锁</span>
          </div>
          <div className="metis-library-divider" aria-hidden="true" />
        </section>

        <article className="metis-reading-card">
          {chapter.paragraphs.map((p) => (
            <section key={p.id} id={p.id} className="metis-paragraph">
              <span className="metis-library-index">{String(p.idx).padStart(2, '0')}</span>
              <div>
                <p className="metis-paragraph-text">{p.text}</p>
                {p.translation && (
                  <div className="metis-annotation">
                    <span>白话</span>
                    {p.translation}
                  </div>
                )}
                {p.niNote && (
                  <div className="metis-annotation">
                    <span>倪师注</span>
                    {p.niNote}
                  </div>
                )}
              </div>
            </section>
          ))}
        </article>

        <nav className="metis-chapter-nav" aria-label="章节导航">
          {prevIdx >= 0 ? (
            <Link href={`/library/${book.slug}/${prevIdx}?pro=1`}>
              <span>← 上一章</span>
              <strong>{book.chapters[prevIdx].title}</strong>
            </Link>
          ) : <div className="metis-chapter-nav-placeholder" />}
          {nextIdx < book.chapters.length ? (
            <Link href={`/library/${book.slug}/${nextIdx}?pro=1`}>
              <span>下一章 →</span>
              <strong>{book.chapters[nextIdx].title}</strong>
            </Link>
          ) : <div className="metis-chapter-nav-placeholder" />}
        </nav>
      </main>
    </div>
  );
}
