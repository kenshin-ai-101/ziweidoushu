import { SanjiPage } from '@/components/OracleSubpage';
import { RENJI_MODULES, RENJI_STATS } from '@/lib/nihai';
import Link from 'next/link';

export const metadata = {
  title: '人纪 · 倪海厦中医经典教学体系 · 针灸 / 内经 / 本草 / 伤寒 / 金匮',
  description: '人纪中知人事，整理针灸大成、黄帝内经、神农本草经、伤寒论、金匮要略五大经典课程。',
};

export default function Page() {
  return (
    <SanjiPage
      category="renji"
      modules={RENJI_MODULES}
      intro="中知人事 — 针灸、内经、本草、伤寒、金匮五大经典课程。"
      statLine={`5 大经典 · 35 个章节 · ${RENJI_STATS.totalLessons} · ${RENJI_STATS.completionYear}年完成`}
      sectionTitle="五大经典课程"
      sectionSubtitle="Five Classics"
      quote="中医是物理医学——从物理的角度分析人体，阴阳寒热虚实是最基本的物理状态。学完五大经典，可从感冒治至疑难重症。"
      quoteFrom="经方一剂知，二剂已——精确辨证后，张仲景的经方往往一两剂即可见效。"
    >
      <div className="oracle-inline-links">
        <div className="oracle-roadmap">
          {RENJI_STATS.learningOrder.map((name, index) => (
            <article key={name}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{name}</h3>
              <p>{index < RENJI_STATS.learningOrder.length - 1 ? '→' : '完成五大经典基础闭环'}</p>
            </article>
          ))}
        </div>
        <div className="oracle-sanity-nav">
          <Link href="/library">《黄帝内经·素问》<span>哲理养生精选 →</span></Link>
        </div>
      </div>
    </SanjiPage>
  );
}
