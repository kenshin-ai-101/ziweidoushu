import Link from 'next/link';
import { MetisLibraryHeader } from '@/components/MetisLibraryHeader';
import { ALL_STARS, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { ALL_BOOKS, TOTAL_PARAGRAPHS, type Book } from '@/lib/classics';

export const metadata = {
  title: 'Metis 学术中心 · 知识库 + 古籍原典',
  description: '按星曜查结论，按古籍读原典，一站式检索紫微斗数知识库与古籍原典。',
};

const comboPreview = ['紫府', '紫贪', '紫杀', '机阴', '机巨', '机梁', '武府', '廉杀'];

const CLASSIC_GROUPS = [
  {
    index: '01',
    label: '天纪 · 命理',
    hint: '《骨髓赋》立纲、《全集》《全书》详论',
    slugs: ['gusuifu', 'quanji', 'quanshu'],
  },
  {
    index: '02',
    label: '地纪 · 堪舆',
    hint: '《葬书》明形势、《青囊经》理气',
    slugs: ['zangshu', 'qingnangjing'],
  },
  {
    index: '03',
    label: '人纪 · 中医',
    hint: '《黄帝内经·素问》哲理养生',
    slugs: ['huangdineijing'],
  },
] as const;

function BookCard({ book }: { book: Book }) {
  const paragraphs = book.chapters.reduce((sum, chapter) => sum + chapter.paragraphs.length, 0);

  return (
    <Link className="metis-academy-book-card" href={`/library/${book.slug}`}>
      <div className="metis-academy-book-meta">
        {book.dynasty} · {book.author}
      </div>
      <div className="metis-academy-book-title">《{book.title}》</div>
      <p className="metis-academy-book-intro">{book.intro}</p>
      <div className="metis-academy-book-stats">
        <span>{book.chapters.length} 章节</span>
        <span className="metis-academy-book-stats-sep">·</span>
        <span>{paragraphs} 段</span>
      </div>
    </Link>
  );
}

export default function Page() {
  const booksBySlug = Object.fromEntries(ALL_BOOKS.map(book => [book.slug, book]));
  const starTopicCount = ALL_STARS.length * 13;

  return (
    <div className="metis-academy-page">
      <MetisLibraryHeader />

      <main className="metis-academy-main">
        <section className="metis-academy-hero-wrap">
          <div className="metis-academy-eyebrow">METIS ACADEMY</div>
          <h1 className="metis-academy-title">学术中心</h1>
          <div className="metis-academy-subtitle">Knowledge + Classics</div>
          <p className="metis-academy-desc">按星曜查结论 · 按古籍读原典 · 一站式检索</p>
          <div className="metis-academy-divider" aria-hidden="true" />
        </section>

        <div className="metis-academy-stats">
          <span>
            <strong>{starTopicCount}</strong> 项星曜专题
          </span>
          <span className="metis-academy-stats-sep">·</span>
          <span>
            <strong>24</strong> 组双星
          </span>
          <span className="metis-academy-stats-sep">·</span>
          <span>
            <strong>37</strong> 种格局
          </span>
          <span className="metis-academy-stats-sep">·</span>
          <span>
            <strong>{ALL_BOOKS.length}</strong> 部古籍
          </span>
          <span className="metis-academy-stats-sep">·</span>
          <span>
            <strong>{TOTAL_PARAGRAPHS}</strong> 段精华
          </span>
        </div>

        <section className="metis-academy-band">
          <div className="metis-academy-section-head">
            <div className="metis-academy-section-title">
              <span className="metis-academy-section-index">01</span>
              <h2>按星曜查</h2>
              <span className="metis-academy-section-hint">
                14 主星 × 13 宫位 + 双星同宫 + 古典格局
              </span>
            </div>
            <Link className="metis-academy-cta" href="/knowledge">
              查看全部 →
            </Link>
          </div>

          <div className="obys-star-grid">
            {ALL_STARS.map(star => (
              <Link
                key={star}
                className="obys-star-card"
                href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
              >
                <div className="obys-star-card__name">{star}</div>
                <div className="obys-star-card__brief">{STAR_BRIEF_SEO[star]}</div>
              </Link>
            ))}
          </div>

          <div className="metis-academy-feature-grid">
            <Link className="metis-academy-feature-card" href="/knowledge#dual-star">
              <div className="metis-academy-feature-title">双星同宫 · 24 组</div>
              <div className="metis-academy-feature-desc">{comboPreview.join(' · ')} ...</div>
              <div className="metis-academy-feature-link">查看全部组合 →</div>
            </Link>
            <Link className="metis-academy-feature-card" href="/knowledge#patterns">
              <div className="metis-academy-feature-title">古典格局 · 37 种</div>
              <div className="metis-academy-feature-desc">
                上格 · 中格 · 助力格 · 恶格 · 基础格局 — 五类分明
              </div>
              <div className="metis-academy-feature-link">查看全部格局 →</div>
            </Link>
          </div>
        </section>

        <section className="metis-academy-band">
          <div className="metis-academy-section-head">
            <div className="metis-academy-section-title">
              <span className="metis-academy-section-index">02</span>
              <h2>按古籍读</h2>
              <span className="metis-academy-section-hint">
                {ALL_BOOKS.length} 部原典 · {TOTAL_PARAGRAPHS} 段精华
              </span>
            </div>
            <Link className="metis-academy-cta" href="/library">
              查看全部 →
            </Link>
          </div>

          {CLASSIC_GROUPS.map(group => (
            <div key={group.index} className="metis-academy-classic-group">
              <div className="metis-academy-group-head">
                <span className="metis-academy-group-index">{group.index}</span>
                <span className="metis-academy-group-label">{group.label}</span>
                <span className="metis-academy-group-hint">{group.hint}</span>
              </div>
              <div className="metis-academy-book-grid">
                {group.slugs.map(slug => {
                  const book = booksBySlug[slug];
                  if (!book) return null;
                  return <BookCard key={slug} book={book} />;
                })}
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="metis-academy-footer">
        <div className="metis-academy-footer-inner">
          <div className="metis-academy-footer-left">
            <Link href="/">← 返回首页</Link>
          </div>
          <div className="metis-academy-footer-right">
            <Link href="/privacy">隐私政策</Link>
            <span>·</span>
            <Link href="/terms">服务条款</Link>
            <span>·</span>
            <a href="mailto:feedback@wdyziweidoushu666.com">反馈</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
