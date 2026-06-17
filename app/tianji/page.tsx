import { SanjiPage } from '@/components/OracleSubpage';
import { ALL_BOOKS } from '@/lib/classics';
import { ALL_TIANJI_MODULES, TIANJI_STATS } from '@/lib/nihai';
import Link from 'next/link';

export const metadata = {
  title: '天纪 · 倪海厦天文术数体系 · 紫微斗数 / 易经 / 堪舆 / 推命',
  description: '天纪上知天文，收录紫微斗数、易经六十四卦、堪舆、推命、面相、测字、六壬等学科脉络。',
};

export default function Page() {
  return (
    <SanjiPage
      category="tianji"
      modules={ALL_TIANJI_MODULES}
      statLine={`8 大学科 · 67 个章节 · ${TIANJI_STATS.totalHexagrams} 卦详解 · ${TIANJI_STATS.recordYear}年录制 · ${TIANJI_STATS.videoEpisodes}集共${TIANJI_STATS.videoHours}小时`}
      sectionTitle="八大学科"
      sectionSubtitle="Tian Ji · 8 Disciplines"
      quote={(
        <>
          倪师不立门派，紫微取<strong>三合派</strong>之简明、易经取<strong>象数派</strong>之直观、堪舆取<strong>九星派</strong>之实用——大道至简，<strong>2/3 大于 1/3</strong>，后天努力一定能大于先天命运。
        </>
      )}
      quoteFrom="命宫是人的北极星——所有的分析都要围绕它来展开。"
      quoteSource="紫微斗数总论"
    >
      <div className="oracle-inline-links">
        <div className="oracle-sanity-nav">
          {ALL_BOOKS.map(book => (
            <Link key={book.slug} href={`/library/${book.slug}`}>
              《{book.title}》 {book.chapters.length} 章 →
            </Link>
          ))}
        </div>
      </div>
    </SanjiPage>
  );
}
