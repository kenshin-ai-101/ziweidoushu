/**
 * /library/[book] — 单部古籍目录页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getBookBySlug, type Book } from '@/lib/classics';

type BookSearchParams = {
  pro?: string;
  mockPro?: string;
  access?: string;
};

export async function generateStaticParams() {
  return ALL_BOOKS.map(b => ({ book: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};
  return {
    title: `《${book.title}》· ${book.dynasty} · 紫微斗数古籍原典库`,
    description: book.intro,
  };
}

function hasMockProAccess(searchParams: BookSearchParams) {
  const value = searchParams.pro ?? searchParams.mockPro ?? searchParams.access;
  return value === '1' || value === 'true' || value === 'pro';
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ book: string }>;
  searchParams?: Promise<BookSearchParams>;
}) {
  const { book: slug } = await params;
  const query = await searchParams;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  if (hasMockProAccess(query ?? {})) {
    return <UnlockedBookPage book={book} />;
  }

  return <LockedBookPage book={book} />;
}

function LockedBookPage({ book }: { book: Book }) {
  const redirect = `/library/${book.slug}`;

  return (
    <div id="main-content">
      <div className="metis-library-page">
        <header
          className="jsx-4dd8fc7f2a3136ec"
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
              className="jsx-4dd8fc7f2a3136ec"
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
            className="jsx-4dd8fc7f2a3136ec"
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
            <div
              className="jsx-4dd8fc7f2a3136ec"
              style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}
            >
              <span
                className="jsx-4dd8fc7f2a3136ec obys-nav-desktop"
                style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}
              >
                <Link
                  className="obys-pill-link"
                  style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }}
                  href="/chart"
                >
                  起盘
                </Link>
              </span>
              <span
                className="jsx-4dd8fc7f2a3136ec obys-nav-desktop"
                style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}
              >
                <span className="jsx-4dd8fc7f2a3136ec" style={{ color: '#d4d4d4', fontSize: 'var(--fs-10)' }}>·</span>
                <Link
                  className="obys-pill-link"
                  style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }}
                  href="/heming"
                >
                  合盘
                </Link>
              </span>
              <button
                type="button"
                className="obys-btn obys-btn--primary"
                style={{
                  fontSize: 'clamp(11px, 1.1vw, 13px)',
                  padding: 'clamp(4px, 0.5vw, 5px) clamp(10px, 1.2vw, 14px)',
                  marginLeft: 'clamp(4px, 0.6vw, 8px)',
                  background: '#fff',
                  color: '#1a1a1a',
                  borderColor: 'rgba(0,0,0,0.28)',
                  fontWeight: 500,
                }}
              >
                普通版
              </button>
              <button
                aria-label="打开菜单"
                aria-expanded="false"
                className="jsx-4dd8fc7f2a3136ec obys-nav-burger"
                style={{
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#000',
                  fontSize: 20,
                  lineHeight: 1,
                  padding: '4px 2px 4px 8px',
                }}
              >
                ☰
              </button>
            </div>
          </div>
        </header>

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

function UnlockedBookPage({ book }: { book: Book }) {
  return (
    <div className="metis-library-page">
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

      <main className="metis-library-main">
        <section className="metis-library-hero">
          <div className="metis-library-eyebrow">CLASSICS · MOCK PRO ACCESS</div>
          <h1 className="metis-library-title">《{book.title}》</h1>
          <p className="metis-library-desc">{book.intro}</p>
          <div className="metis-library-meta-row">
            <span className="metis-library-chip">{book.dynasty}</span>
            <span className="metis-library-chip">{book.author}</span>
            <span className="metis-library-chip">{book.chapters.length} 章节</span>
            <span className="metis-library-chip">MOCK PRO · 已临时解锁</span>
          </div>
          <div className="metis-library-divider" aria-hidden="true" />
        </section>

        <section>
          <div className="metis-library-section-head">
            <span className="metis-library-index">01</span>
            <h2>章节目录</h2>
            <span className="metis-library-label">Chapters</span>
          </div>
          <div className="metis-chapter-list">
          {book.chapters.map((chapter, i) => (
            <Link
              key={i}
              href={`/library/${book.slug}/${i}?pro=1`}
              className="metis-chapter-link"
            >
              <span className="metis-library-index">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>{chapter.title}</h3>
                {chapter.subtitle && <p>{chapter.subtitle}</p>}
              </div>
              <span className="metis-chapter-count">{chapter.paragraphs.length} 段</span>
              <span className="metis-chapter-arrow">→</span>
            </Link>
          ))}
          </div>
        </section>
      </main>
    </div>
  );
}
