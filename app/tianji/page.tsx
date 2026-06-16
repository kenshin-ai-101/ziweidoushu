import { SanjiPage } from '@/components/OracleSubpage';
import { TIANJI_MODULES, TIANJI_STATS } from '@/lib/nihai';
import { ALL_BOOKS } from '@/lib/classics';
import Link from 'next/link';
import type { NiModule } from '@/lib/nihai';

export const metadata = {
  title: '天纪 · 倪海厦天文术数体系 · 紫微斗数 / 易经 / 堪舆 / 推命',
  description: '天纪上知天文，收录紫微斗数、易经六十四卦、堪舆、推命、面相、测字、六壬等学科脉络。',
};

export default function Page() {
  const modules: NiModule[] = [
    ...TIANJI_MODULES,
    {
      id: 'tj-tianxiang',
      category: 'tianji' as const,
      name: '天象学',
      nameEn: 'Tian Xiang Xue',
      subtitle: '28宿七政 · 观天识变',
      description: '天文现象与古代历法体系研究。',
      details: [],
      references: [],
      keywords: [],
      icon: '◎',
      status: 'active' as const,
      order: 7,
      slug: 'tianxiang',
      chapters: [],
    },
    {
      id: 'tj-liuren',
      category: 'tianji' as const,
      name: '六壬掐指法',
      nameEn: 'Liu Ren Qia Zhi Fa',
      subtitle: '掐指速算 · 心血来潮即断',
      description: '六壬学传统应用的知识体系。',
      details: [],
      references: [],
      keywords: [],
      icon: '◌',
      status: 'active' as const,
      order: 8,
      slug: 'liuren',
      chapters: [],
    },
  ].sort((a, b) => a.order - b.order);

  return (
    <SanjiPage
      category="tianji"
      modules={modules}
      intro="上知天文 — 紫微斗数命理体系、易经卦象、堪舆理论与传统术数方法论。"
      statLine={`8 大学科 · 67 个章节 · ${TIANJI_STATS.totalHexagrams} 卦详解 · ${TIANJI_STATS.recordYear}年录制 · ${TIANJI_STATS.videoEpisodes}集共${TIANJI_STATS.videoHours}小时`}
      sectionTitle="八大学科"
      sectionSubtitle="Tian Ji · 8 Disciplines"
      quote="倪师不立门派，紫微取三合派之简明、易经取象数派之直观、堪舆取九星派之实用。大道至简，后天努力一定能大于先天命运。"
      quoteFrom="命宫是人的北极星——所有的分析都要围绕它来展开。"
    >
      <div className="oracle-inline-links">
        <div className="oracle-sanity-nav">
          {ALL_BOOKS.slice(0, 3).map(book => (
            <Link key={book.slug} href={`/library/${book.slug}`}>
              《{book.title}》<span>{book.chapters.length} 章 →</span>
            </Link>
          ))}
        </div>
      </div>
    </SanjiPage>
  );
}
