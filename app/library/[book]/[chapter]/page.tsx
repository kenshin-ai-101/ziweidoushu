/**
 * /library/[book]/[chapter] — 单章节阅读页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MetisLibraryHeader } from '@/components/MetisLibraryHeader';
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

function LockedChapterPage({ bookSlug, chapterIdx }: { bookSlug: string; chapterIdx: number }) {
  const redirect = `/library/${bookSlug}/${chapterIdx}`;

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
      <MetisLibraryHeader editionLabel="专业版" editionHref="/subscription?pro=1" />
      <main className="metis-library-main">
        <section className="metis-library-hero metis-library-hero--chapter">
          <div>
            <div className="metis-library-eyebrow">METIS CLASSICS · READING</div>
            <h1 className="metis-library-chapter-title">{chapter.title}</h1>
            {chapter.subtitle && <p className="metis-library-desc">{chapter.subtitle}</p>}
            <div className="metis-library-meta-row">
              <Link className="metis-library-chip" href={`/library/${book.slug}?pro=1`}>← 《{book.title}》目录</Link>
              <span className="metis-library-chip">{book.dynasty}</span>
              <span className="metis-library-chip">{String(chapterIdx + 1).padStart(2, '0')} / {book.chapters.length}</span>
              <span className="metis-library-chip">专业版已解锁</span>
            </div>
          </div>
          <div className="metis-library-hero-stat" aria-label="章节统计">
            <span>{String(chapterIdx + 1).padStart(2, '0')}</span>
            <strong>Chapter</strong>
            <em>{chapter.paragraphs.length} paragraphs</em>
          </div>
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
