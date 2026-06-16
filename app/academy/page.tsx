import Link from 'next/link';
import { OracleChrome, OracleHero, SectionTitle } from '@/components/OracleSubpage';
import { ALL_STARS, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { ALL_BOOKS } from '@/lib/classics';

export const metadata = {
  title: 'Oracle 学术中心 · 知识库 + 古籍原典',
  description: '按星曜查结论，按古籍读原典，一站式检索紫微斗数知识库与古籍原典。',
};

const comboPreview = ['紫府', '紫贪', '紫杀', '机阴', '机巨', '机梁', '武府', '廉杀'];
const extraClassics = [
  {
    href: '/diji',
    meta: '东晋 · 郭璞',
    title: '葬书',
    intro: '风水形势派开山祖经，立“乘生气”“藏风聚气”“得水为上”等堪舆总纲。',
    count: '3 章节 · 9 段',
  },
  {
    href: '/diji',
    meta: '秦汉 · 相传黄石公',
    title: '青囊经',
    intro: '风水理气派开山祖经，与《葬书》形势派互为风水两大派祖经。',
    count: '3 章节 · 9 段',
  },
  {
    href: '/renji',
    meta: '先秦两汉 · 托名黄帝',
    title: '黄帝内经·素问',
    intro: '中医理论最高经典，此处精选哲理养生纲领，作传统医学文化经典研读。',
    count: '3 章节 · 9 段',
  },
];

export default function Page() {
  return (
    <OracleChrome tone="ink">
      <OracleHero
        eyebrow="ORACLE ACADEMY"
        title="学术中心"
        subtitle="Knowledge + Classics"
        description="按星曜查结论 · 按古籍读原典 · 一站式检索"
        stats={`${ALL_STARS.length * 13} 项星曜专题·24 组双星·37 种格局·6 部古籍·103 段精华`}
      />

      <section className="oracle-content-band">
        <SectionTitle
          index="01"
          title="按星曜查"
          subtitle="14 主星 × 13 宫位 + 双星同宫 + 古典格局"
          action={<Link href="/knowledge">查看全部 →</Link>}
        />
        <div className="oracle-academy-stars">
          {ALL_STARS.map(star => (
            <Link key={star} href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}>
              <strong>{star}</strong>
              <span>{STAR_BRIEF_SEO[star]}</span>
            </Link>
          ))}
        </div>
        <div className="oracle-academy-feature-grid">
          <Link href="/knowledge">
            <b>双星同宫 · 24 组</b>
            <span>{comboPreview.join(' · ')} ...</span>
            <small>查看全部组合 →</small>
          </Link>
          <Link href="/knowledge">
            <b>古典格局 · 37 种</b>
            <span>上格 · 中格 · 助力格 · 恶格 · 基础格局</span>
            <small>查看全部格局 →</small>
          </Link>
        </div>
      </section>

      <section className="oracle-content-band">
        <SectionTitle
          index="02"
          title="按古籍读"
          subtitle="6 部原典 · 103 段精华"
          action={<Link href="/library">查看全部 →</Link>}
        />
        <div className="oracle-library-groups">
          <div>
            <span>0 1</span>
            <h3>天纪 · 命理</h3>
            <p>《骨髓赋》立纲，《全集》《全书》详论</p>
          </div>
          <div className="oracle-book-row">
            {ALL_BOOKS.map(book => (
              <Link key={book.slug} href={`/library/${book.slug}`}>
                <span>{book.dynasty} · {book.author.split(' ')[0]}</span>
                <b>《{book.title}》</b>
                <p>{book.intro}</p>
                <small>{book.chapters.length} 章节 · {book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)} 段</small>
              </Link>
            ))}
          </div>
          <div>
            <span>0 2</span>
            <h3>地纪 · 堪舆</h3>
            <p>《葬书》明形势，《青囊经》理气。</p>
          </div>
          <div className="oracle-book-row oracle-book-row--two">
            {extraClassics.slice(0, 2).map(book => (
              <Link key={book.title} href={book.href}>
                <span>{book.meta}</span>
                <b>《{book.title}》</b>
                <p>{book.intro}</p>
                <small>{book.count}</small>
              </Link>
            ))}
          </div>
          <div>
            <span>0 3</span>
            <h3>人纪 · 中医</h3>
            <p>《黄帝内经·素问》哲理养生。</p>
          </div>
          <div className="oracle-book-row oracle-book-row--one">
            {extraClassics.slice(2).map(book => (
              <Link key={book.title} href={book.href}>
                <span>{book.meta}</span>
                <b>《{book.title}》</b>
                <p>{book.intro}</p>
                <small>{book.count}</small>
              </Link>
            ))}
          </div>
        </div>
        <Link className="oracle-back-home" href="/">← 返回首页</Link>
      </section>

    </OracleChrome>
  );
}
