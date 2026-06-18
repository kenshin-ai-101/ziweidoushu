/**
 * /library/[book] — 单部古籍目录页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MetisLibraryHeader } from '@/components/MetisLibraryHeader';
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
        <MetisLibraryHeader />

        <main className="metis-library-lock">
          <div className="metis-library-lock-mark" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="metis-library-eyebrow">Professional Only</div>
          <h1>古籍原典库 · 专业版专属</h1>
          <p>
            六部古籍全文、四层精解（白话直译 · 义理阐发 · 实占应用 · 融会贯通）、
            <br />
            倪师批注与逐段 AI 解读，均为专业版研读内容。
            <br />
            开通专业版，即可解锁全部古籍原典的系统研习。
          </p>
          <div className="metis-library-lock-actions">
            <Link
              href={`/subscription?redirect=${encodeURIComponent(redirect)}`}
              className="metis-library-primary"
            >
              解锁专业版 →
            </Link>
            <Link
              href="/"
              className="metis-library-secondary"
            >
              返回首页
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function UnlockedBookPage({ book }: { book: Book }) {
  const paragraphCount = book.chapters.reduce((sum, chapter) => sum + chapter.paragraphs.length, 0);

  return (
    <div className="metis-library-page">
      <MetisLibraryHeader editionLabel="专业版" editionHref="/subscription?pro=1" />

      <main className="metis-library-main">
        <section className="metis-library-hero metis-library-hero--book">
          <div>
            <div className="metis-library-eyebrow">METIS CLASSICS · UNLOCKED</div>
            <h1 className="metis-library-title">《{book.title}》</h1>
            <p className="metis-library-desc">{book.intro}</p>
            <div className="metis-library-meta-row">
              <span className="metis-library-chip">{book.dynasty}</span>
              <span className="metis-library-chip">{book.author}</span>
              <span className="metis-library-chip">{book.chapters.length} 章</span>
              <span className="metis-library-chip">专业版已解锁</span>
            </div>
          </div>
          <div className="metis-library-hero-stat" aria-label="古籍统计">
            <span>{String(book.chapters.length).padStart(2, '0')}</span>
            <strong>Chapters</strong>
            <em>{paragraphCount} paragraphs</em>
          </div>
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
